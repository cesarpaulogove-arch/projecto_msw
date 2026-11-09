
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 8;

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ImagemOrdem {
  type: "existing" | "new";
  url?: string;
  index?: number;
}

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

async function gerarSlugUnico(nome: string, id: string) {
  const slugBase = gerarSlug(nome);
  let slug = slugBase;
  let contador = 1;

  while (true) {
    const existente = await prisma.product.findFirst({
      where: {
        slug,
        NOT: { id },
      },
      select: { id: true },
    });

    if (!existente) return slug;

    slug = `${slugBase}-${contador}`;
    contador++;
  }
}

function obterCaminhoImagem(caminho: string) {
  const prefixo = "/uploads/produtos/";

  if (!caminho.startsWith(prefixo)) return null;

  const nome = caminho.slice(prefixo.length);

  if (
    !nome ||
    nome !== path.basename(nome) ||
    nome.includes("..")
  ) {
    return null;
  }

  return path.join(
    process.cwd(),
    "public",
    "uploads",
    "produtos",
    nome
  );
}

async function removerImagemSeNaoUtilizada(
  caminho: string,
  produtoId: string
) {
  const caminhoFisico = obterCaminhoImagem(caminho);

  if (!caminhoFisico) return;

  const outrosProdutos = await prisma.product.count({
    where: {
      id: { not: produtoId },
      OR: [
        { image: caminho },
        { images: { has: caminho } },
      ],
    },
  });

  if (outrosProdutos === 0) {
    await unlink(caminhoFisico).catch((error) => {
      console.error("Erro ao remover imagem antiga:", error);
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const novasImagensGuardadas: string[] = [];
  let baseDadosActualizada = false;

  try {
    const { id } = await params;

    // 1. Procurar produto
    const produtoExistente = await prisma.product.findUnique({
      where: { id },
    });

    if (!produtoExistente) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 404 }
      );
    }

    const dados = await request.formData();

    // 2. Receber dados
    // Se o formulário não enviar code, preservar o código actual.
    const code = dados.has("code")
      ? String(dados.get("code") ?? "").trim()
      : produtoExistente.code ?? "";

    const name = String(dados.get("name") || "").trim();

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
      dados.get("ivaRate") ?? produtoExistente.ivaRate
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

    // 9. Validar categoria
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

    // 10. Verificar código duplicado
    if (code) {
      const codigoExistente = await prisma.product.findFirst({
        where: {
          code,
          NOT: { id },
        },
        select: { id: true },
      });

      if (codigoExistente) {
        return NextResponse.json(
          {
            error: "Já existe outro produto com este código.",
          },
          { status: 409 }
        );
      }
    }

    // 11. Preparar imagens originais
    const imagensOriginais = new Set([
      produtoExistente.image,
      ...(produtoExistente.images || []),
    ]);

    // 12. Receber novas imagens
    const novasImagens = dados
      .getAll("newImages")
      .filter(
        (item): item is File =>
          item instanceof File && item.size > 0
      );

    // 13. Validar novos ficheiros
    for (const imagem of novasImagens) {
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

    // 14. Receber ordem completa da galeria
    const ordemRecebida = dados.get("imageOrder");

    if (typeof ordemRecebida !== "string") {
      return NextResponse.json(
        {
          error: "A ordem da galeria não foi enviada.",
        },
        { status: 400 }
      );
    }

    let ordemImagens: ImagemOrdem[];

    try {
      const parsed: unknown = JSON.parse(ordemRecebida);

      if (!Array.isArray(parsed)) {
        throw new Error("Formato inválido.");
      }

      ordemImagens = parsed as ImagemOrdem[];
    } catch {
      return NextResponse.json(
        {
          error: "A ordem das imagens é inválida.",
        },
        { status: 400 }
      );
    }

    // 15. Validar imagens da sequência
    for (const item of ordemImagens) {
      if (
        !item ||
        typeof item !== "object" ||
        !("type" in item)
      ) {
        return NextResponse.json(
          {
            error: "A galeria contém elementos inválidos.",
          },
          { status: 400 }
        );
      }

      if (item.type === "existing") {
        if (
          typeof item.url !== "string" ||
          !imagensOriginais.has(item.url) ||
          !obterCaminhoImagem(item.url)
        ) {
          return NextResponse.json(
            {
              error: "Uma imagem existente não é válida.",
            },
            { status: 400 }
          );
        }
      } else if (item.type === "new") {
        if (
          typeof item.index !== "number" ||
          !Number.isInteger(item.index) ||
          item.index < 0 ||
          item.index >= novasImagens.length
        ) {
          return NextResponse.json(
            {
              error: "Uma nova imagem contém um índice inválido.",
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: "Tipo de imagem desconhecido.",
          },
          { status: 400 }
        );
      }
    }

    // 16. Impedir imagens duplicadas
    const indicesNovos = ordemImagens
      .filter((item) => item.type === "new")
      .map((item) => item.index);

    const urlsExistentes = ordemImagens
      .filter((item) => item.type === "existing")
      .map((item) => item.url);

    if (
      new Set(indicesNovos).size !== indicesNovos.length ||
      new Set(urlsExistentes).size !== urlsExistentes.length
    ) {
      return NextResponse.json(
        {
          error: "A galeria contém imagens duplicadas.",
        },
        { status: 400 }
      );
    }

    // 17. Validar quantidade de imagens
    if (
      indicesNovos.length !== novasImagens.length ||
      ordemImagens.length > MAX_IMAGES
    ) {
      return NextResponse.json(
        {
          error:
            `A galeria deve conter todas as imagens seleccionadas e no máximo ${MAX_IMAGES} imagens.`,
        },
        { status: 400 }
      );
    }

    if (ordemImagens.length === 0) {
      return NextResponse.json(
        {
          error:
            "O produto deve possuir pelo menos uma imagem.",
        },
        { status: 400 }
      );
    }

    // 18. Validar imagem principal
    const mainImageIndex = Number(
      dados.get("mainImageIndex")
    );

    if (
      !Number.isInteger(mainImageIndex) ||
      mainImageIndex < 0 ||
      mainImageIndex >= ordemImagens.length
    ) {
      return NextResponse.json(
        {
          error: "A imagem principal seleccionada é inválida.",
        },
        { status: 400 }
      );
    }

    // 19. Guardar novas imagens
    const pastaUploads = path.join(
      process.cwd(),
      "public",
      "uploads",
      "produtos"
    );

    await mkdir(pastaUploads, { recursive: true });

    for (const imagem of novasImagens) {
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

      novasImagensGuardadas.push(caminhoPublico);

      await writeFile(caminhoFisico, buffer);
    }

    // 20. Reconstruir galeria
    const galeria = ordemImagens.map((item) => {
      if (item.type === "existing") {
        return item.url!;
      }

      return novasImagensGuardadas[item.index!];
    });

    // 21. Identificar imagem principal
    const mainImage = galeria[mainImageIndex];

    // 22. Colocar imagem principal na primeira posição
    const galeriaOrdenada = [
      mainImage,
      ...galeria.filter(
        (imagem) => imagem !== mainImage
      ),
    ];

    // 23. Gerar slug
    const slug =
      name === produtoExistente.name
        ? produtoExistente.slug
        : await gerarSlugUnico(name, id);

    // 24. Actualizar produto
    const produto = await prisma.product.update({
      where: { id },
      data: {
        code: code || null,
        name,
        slug,
        description: description || null,
        price,
        oldPrice,
        ivaRate,
        inStock,
        categoryId,
        featured,
        active,
        promotion,
        image: mainImage,
        images: galeriaOrdenada,
      },
      include: {
        category: true,
      },
    });

    baseDadosActualizada = true;

    // 25. Limpar imagens antigas não utilizadas
    const imagensAnteriores = new Set([
      produtoExistente.image,
      ...(produtoExistente.images || []),
    ]);

    const imagensActuais = new Set(galeriaOrdenada);

    for (const imagemAntiga of imagensAnteriores) {
      if (!imagensActuais.has(imagemAntiga)) {
        try {
          await removerImagemSeNaoUtilizada(
            imagemAntiga,
            id
          );
        } catch (error) {
          console.error(
            "Não foi possível limpar uma imagem antiga:",
            error
          );
        }
      }
    }

    return NextResponse.json({
      message: "Produto actualizado com sucesso.",
      produto,
    });

  } catch (error) {
    console.error("Erro ao actualizar produto:", error);

    if (!baseDadosActualizada) {
      await Promise.all(
        novasImagensGuardadas.map((imagem) => {
          const caminho = obterCaminhoImagem(imagem);

          return caminho
            ? unlink(caminho).catch((erro) => {
                console.error(
                  "Erro ao limpar nova imagem:",
                  erro
                );
              })
            : Promise.resolve();
        })
      );
    }

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
        error: "Não foi possível actualizar o produto.",
      },
      { status: 500 }
    );
  }
}
