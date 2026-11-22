
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { verificarSessaoGestor } from "@/lib/auth-gestor";

const MAX_IMAGES = 8;

const BLOB_HOST =
  "luw8besdsscy5bxa.public.blob.vercel-storage.com";

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

/**
 * Valida URLs de imagens do Vercel Blob.
 * Apenas imagens HTTPS do nosso armazenamento e da pasta
 * produtos são aceites.
 */
function validarUrlBlob(valor: unknown): valor is string {
  if (typeof valor !== "string" || !valor.trim()) {
    return false;
  }

  try {
    const url = new URL(valor);

    const caminhoValido =
      /^\/produtos\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/i.test(
        url.pathname
      );

    return (
      url.protocol === "https:" &&
      url.hostname === BLOB_HOST &&
      url.port === "" &&
      !url.username &&
      !url.password &&
      caminhoValido &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function validarListaImagens(valor: unknown): valor is string[] {
  if (!Array.isArray(valor)) return false;

  if (valor.length < 1 || valor.length > MAX_IMAGES) {
    return false;
  }

  if (!valor.every(validarUrlBlob)) {
    return false;
  }

  return new Set(valor).size === valor.length;
}

// GET - Listar produtos
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
    console.error("ERRO GET PRODUTOS:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("PRISMA CODE:", error.code);
      console.error("PRISMA META:", error.meta);
    }

    return NextResponse.json(
      { error: "Não foi possível consultar os produtos." },
      { status: 500 }
    );
  }
}

// POST - Criar produto com imagens no Vercel Blob
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação do gestor
    const sessao = await verificarSessaoGestor();

    if (!sessao) {
      return NextResponse.json(
        {
          error: "Não autorizado. Inicie sessão como gestor.",
        },
        { status: 401 }
      );
    }

    // 2. Receber dados
    const dados = await request.formData();

    const code = String(dados.get("code") || "").trim();

    if (code.length > 80) {
  return NextResponse.json(
    { error: "O código do produto não pode ultrapassar 80 caracteres." },
    { status: 400 }
  );
}

    const name = String(
      dados.get("name") || dados.get("nome") || ""
    ).trim();

    const description = String(
      dados.get("description") || ""
    ).trim();

    const priceRaw = String(dados.get("price") || "").trim();
    const oldPriceRaw = String(dados.get("oldPrice") || "").trim();
    const categoryId = String(dados.get("categoryId") || "").trim();

    const inStockRaw = dados.get("inStock");

    const featured = dados.get("featured") === "true";
    const active = dados.get("active") === "true";
    const promotion = dados.get("promotion") === "true";

    const price = Number(priceRaw);

    // 3. Receber URLs das imagens
    let imageUrls: unknown;
    let mainImage: unknown;

    try {
      imageUrls = JSON.parse(
        String(dados.get("imageUrls") || "[]")
      );

      mainImage = String(dados.get("mainImage") || "");
    } catch {
      return NextResponse.json(
        { error: "Dados das imagens inválidos." },
        { status: 400 }
      );
    }

    // 4. Validar nome
    if (!name) {
      return NextResponse.json(
        { error: "O nome do produto é obrigatório." },
        { status: 400 }
      );
    }

    // 5. Validar categoria
    if (!categoryId) {
      return NextResponse.json(
        { error: "Seleccione uma categoria." },
        { status: 400 }
      );
    }

    // 6. Validar preço
    if (!priceRaw || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "Introduza um preço válido." },
        { status: 400 }
      );
    }

    // 7. Validar disponibilidade
    if (
      inStockRaw !== "true" &&
      inStockRaw !== "false"
    ) {
      return NextResponse.json(
        { error: "Seleccione a disponibilidade do produto." },
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
            error:
              "O preço anterior deve ser superior ao preço actual.",
          },
          { status: 400 }
        );
      }
    }

    // 9. Validar URLs e quantidade de imagens
    if (!validarListaImagens(imageUrls)) {
      return NextResponse.json(
        {
          error:
            "Seleccione entre 1 e 8 imagens válidas do Vercel Blob.",
        },
        { status: 400 }
      );
    }

    if (
      typeof mainImage !== "string" ||
      !imageUrls.includes(mainImage)
    ) {
      return NextResponse.json(
        { error: "A imagem principal é inválida." },
        { status: 400 }
      );
    }

    // 10. Verificar categoria
    const categoria = await prisma.category.findFirst({
      where: {
        id: categoryId,
        active: true,
      },
      select: { id: true },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada ou inactiva." },
        { status: 404 }
      );
    }

    // 11. Verificar código duplicado
    if (code) {
      const codigoExistente = await prisma.product.findUnique({
        where: { code },
        select: { id: true },
      });

      if (codigoExistente) {
        return NextResponse.json(
          {
            error:
              "Já existe um componente registado com este código.",
          },
          { status: 409 }
        );
      }
    }

    // 12. Gerar slug
    const slug = await gerarSlugUnico(name);

    // 13. Colocar imagem principal na primeira posição
    const imagensOrdenadas = [
      mainImage,
      ...imageUrls.filter((url) => url !== mainImage),
    ];

    // 14. Criar produto
    const produto = await prisma.product.create({
      data: {
        code: code || null,
        name,
        slug,
        description: description || null,
        price,
        oldPrice,
        inStock,
        image: mainImage,
        images: imagensOrdenadas,
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

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "O código ou identificador deste produto já existe.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao registar o produto." },
      { status: 500 }
    );
  }
}
