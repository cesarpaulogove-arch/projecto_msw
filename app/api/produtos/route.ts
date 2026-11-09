
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Prisma } from "@/generated/prisma/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 8;

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function gerarSlug(nome: string) {
  return (
    nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "produto"
  );
}

async function gerarSlugUnico(nome: string) {
  const slugBase = gerarSlug(nome);

  let slug = slugBase;
  let contador = 1;

  while (
    await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${slugBase}-${contador}`;
    contador++;
  }

  return slug;
}

// GET - Consultar e pesquisar produtos activos por nome ou código
export async function GET(request: NextRequest) {
  try {
    const pesquisa = request.nextUrl.searchParams
      .get("pesquisa")
      ?.trim();

    const produtos = await prisma.product.findMany({
      where: {
        active: true,

        ...(pesquisa
          ? {
              OR: [
                {
                  name: {
                    contains: pesquisa,
                    mode: "insensitive",
                  },
                },
                {
                  code: {
                    contains: pesquisa,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(produtos, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao consultar produtos:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar os produtos." },
      { status: 500 }
    );
  }
}

// POST - Criar produto com código e várias imagens
export async function POST(request: NextRequest) {
  const caminhosImagens: string[] = [];

  try {
    const dados = await request.formData();

    // 1. Receber dados
    const code = String(
      dados.get("code") || ""
    ).trim();

    const name = String(
      dados.get("name") || dados.get("nome") || ""
    ).trim();

    const description = String(
      dados.get("description") || ""
    ).trim();

    const priceRaw = String(
      dados.get("price") || ""
    ).trim();

    const oldPriceRaw = String(
      dados.get("oldPrice") || ""
    ).trim();

    const ivaRateRaw = String(
      dados.get("ivaRate") ?? "16"
    ).trim();

    const categoryId = String(
      dados.get("categoryId") || ""
    ).trim();

    const inStockRaw = dados.get("inStock");

    const featured = dados.get("featured") === "true";
    const active = dados.get("active") === "true";
    const promotion = dados.get("promotion") === "true";

    const price = Number(priceRaw);
    const ivaRate = Number(ivaRateRaw);

    // 2. Receber imagens
    const imagens = dados
      .getAll("images")
      .filter(
        (item): item is File =>
          item instanceof File && item.size > 0
      );

    // Compatibilidade com formulário antigo
    if (imagens.length === 0) {
      const imagemAntiga = dados.get("image");

      if (
        imagemAntiga instanceof File &&
        imagemAntiga.size > 0
      ) {
        imagens.push(imagemAntiga);
      }
    }

    // 3. Validar nome
    if (!name) {
      return NextResponse.json(
        { error: "O nome do produto é obrigatório." },
        { status: 400 }
      );
    }

    // 4. Validar categoria
    if (!categoryId) {
      return NextResponse.json(
        { error: "Seleccione uma categoria." },
        { status: 400 }
      );
    }

    // 5. Validar preço
    if (
      !priceRaw ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        { error: "Introduza um preço válido." },
        { status: 400 }
      );
    }

    // 6. Validar IVA
    if (
      !ivaRateRaw ||
      !Number.isFinite(ivaRate) ||
      ivaRate < 0 ||
      ivaRate > 100
    ) {
      return NextResponse.json(
        {
          error: "Introduza uma taxa de IVA válida entre 0% e 100%.",
        },
        { status: 400 }
      );
    }

    // 7. Validar disponibilidade
    if (
      inStockRaw !== "true" &&
      inStockRaw !== "false"
    ) {
      return NextResponse.json(
        {
          error: "Seleccione a disponibilidade do produto.",
        },
        { status: 400 }
      );
    }

    const inStock = inStockRaw === "true";

    // 8. Validar preço anterior
    let oldPrice: number | null = null;

    if (oldPriceRaw !== "") {
      oldPrice = Number(oldPriceRaw);

      if (
        !Number.isFinite(oldPrice) ||
        oldPrice <= price
      ) {
        return NextResponse.json(
          {
            error: "O preço anterior deve ser superior ao preço actual.",
          },
          { status: 400 }
        );
      }
    }

    // 9. Validar quantidade de imagens
    if (imagens.length === 0) {
      return NextResponse.json(
        { error: "Seleccione pelo menos uma imagem." },
        { status: 400 }
      );
    }

    if (imagens.length > MAX_IMAGES) {
      return NextResponse.json(
        {
          error: `Pode carregar no máximo ${MAX_IMAGES} imagens.`,
        },
        { status: 400 }
      );
    }

    // 10. Validar ficheiros
    for (const imagem of imagens) {
      if (imagem.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `A imagem "${imagem.name}" ultrapassa 5 MB.`,
          },
          { status: 400 }
        );
      }

      if (!TIPOS_PERMITIDOS[imagem.type]) {
        return NextResponse.json(
          {
            error: `O formato da imagem "${imagem.name}" não é permitido.`,
          },
          { status: 400 }
        );
      }
    }

    // 11. Verificar categoria
    const categoria = await prisma.category.findFirst({
      where: {
        id: categoryId,
        active: true,
      },
    });

    if (!categoria) {
      return NextResponse.json(
        {
          error: "Categoria não encontrada ou inactiva.",
        },
        { status: 404 }
      );
    }

    // 12. Verificar código duplicado
    if (code) {
      const codigoExistente = await prisma.product.findUnique({
        where: { code },
        select: { id: true },
      });

      if (codigoExistente) {
        return NextResponse.json(
          {
            error: "Já existe um componente registado com este código.",
          },
          { status: 409 }
        );
      }
    }

    // 13. Gerar slug
    const slug = await gerarSlugUnico(name);

    // 14. Preparar pasta de uploads
    const pastaUploads = path.join(
      process.cwd(),
      "public",
      "uploads",
      "produtos"
    );

    await mkdir(pastaUploads, { recursive: true });

    // 15. Guardar imagens
    for (const imagem of imagens) {
      const extensao = TIPOS_PERMITIDOS[imagem.type];
      const nomeImagem = `${randomUUID()}${extensao}`;

      const caminhoFisico = path.join(
        pastaUploads,
        nomeImagem
      );

      const caminhoPublico =
        `/uploads/produtos/${nomeImagem}`;

      const buffer = Buffer.from(
        await imagem.arrayBuffer()
      );

      await writeFile(caminhoFisico, buffer);

      caminhosImagens.push(caminhoPublico);
    }

    // 16. Primeira imagem é a principal
    const imagemPrincipal = caminhosImagens[0];

    // 17. Criar produto
    const produto = await prisma.product.create({
      data: {
        code: code || null,
        name,
        slug,
        description: description || null,
        price,
        oldPrice,
        ivaRate,
        inStock,
        image: imagemPrincipal,
        images: caminhosImagens,
        featured,
        active,
        promotion,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      {
        message: "Produto criado com sucesso.",
        produto,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erro ao criar produto:", error);

    // Limpar imagens se o registo falhar
    await Promise.all(
      caminhosImagens.map((caminho) =>
        unlink(
          path.join(
            process.cwd(),
            "public",
            caminho.replace(/^\//, "")
          )
        ).catch((erro) => {
          console.error("Erro ao remover imagem:", erro);
        })
      )
    );

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "O código ou identificador deste produto já existe.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno ao registar o produto.",
      },
      { status: 500 }
    );
  }
}
