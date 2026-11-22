
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { verificarSessaoGestor } from "@/lib/auth-gestor";

const MAX_IMAGES = 8;

const BLOB_HOST =
  "luw8besdsscy5bxa.public.blob.vercel-storage.com";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function validarUrlBlob(valor: unknown): valor is string {
  if (typeof valor !== "string" || !valor.trim()) {
    return false;
  }

  try {
    const url = new URL(valor);

    return (
      url.protocol === "https:" &&
      url.hostname === BLOB_HOST &&
      /^\/produtos\/[a-zA-Z0-9._-]+$/.test(url.pathname) &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
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



const MAX_PRODUTOS_RELACIONADOS = 5;
const MAX_CANDIDATOS = 120;

// Palavras que não ajudam a identificar semelhanças.
const STOP_WORDS = new Set([
  "para", "com", "sem", "por", "uma", "uns",
  "das", "dos", "que", "the", "and", "for",
  "produto", "produtos", "modelo", "novo",
  "nova", "unidade", "kit", "tipo", "versao",
]);

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extrairPalavras(texto: string | null | undefined) {
  if (!texto) return [];

  return [
    ...new Set(
      normalizarTexto(texto)
        .split(/\s+/)
        .filter(
          (palavra) =>
            palavra.length >= 2 &&
            !STOP_WORDS.has(palavra)
        )
    ),
  ];
}

// Identifica famílias tecnológicas e componentes relacionados.
const FAMILIAS_TECNOLOGICAS: Record<string, string[]> = {
  esp32: ["esp32", "esp32 cam", "esp32cam"],
  esp8266: ["esp8266", "nodemcu", "esp 12"],
  arduino: ["arduino", "atmega328", "uno", "mega", "nano"],
  raspberry: ["raspberry pi", "raspberry", "raspi"],
  sensores: [
    "sensor", "dht11", "dht22", "bmp280",
    "mq2", "mq6", "ldr", "ultrassonico",
  ],
  comunicacao: [
    "bluetooth", "wifi", "gsm", "sim800",
    "rfid", "nfc", "lora", "zigbee",
  ],
  alimentacao: [
    "fonte", "conversor", "regulador",
    "buck", "boost", "step down", "step up",
  ],
  prototipagem: [
    "breadboard", "protoboard", "jumper",
    "jumpers", "pcb",
  ],
  acionamento: [
    "rele", "relay", "motor", "servo",
    "driver", "ponte h",
  ],
};

function identificarFamilias(texto: string) {
  const normalizado = normalizarTexto(texto);

  return Object.entries(FAMILIAS_TECNOLOGICAS)
    .filter(([, termos]) =>
      termos.some((termo) => {
        const termoNormalizado = normalizarTexto(termo);

        return normalizado.includes(termoNormalizado);
      })
    )
    .map(([familia]) => familia);
}

function calcularRelevancia(
  produtoBase: {
    name: string;
    description: string | null;
    categoryId: string;
    category: { name: string };
  },
  candidato: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string;
    category: { name: string };
    featured: boolean;
    inStock: boolean;
    rating: number;
  }
) {
  let pontuacao = 0;

  const nomeBase = extrairPalavras(produtoBase.name);
  const nomeCandidato = extrairPalavras(candidato.name);

  const descricaoBase = extrairPalavras(
    produtoBase.description
  );

  const descricaoCandidato = extrairPalavras(
    candidato.description
  );

  const palavrasCandidato = new Set([
    ...nomeCandidato,
    ...descricaoCandidato,
  ]);

  // Mesma categoria.
  if (produtoBase.categoryId === candidato.categoryId) {
    pontuacao += 30;
  }

  // Correspondência de palavras no nome.
  const palavrasNomeComuns = nomeBase.filter((palavra) =>
    nomeCandidato.includes(palavra)
  );

  pontuacao += Math.min(
    palavrasNomeComuns.length * 12,
    36
  );

  // Correspondência entre descrições.
  const palavrasDescricaoComuns = descricaoBase.filter(
    (palavra) => palavrasCandidato.has(palavra)
  );

  pontuacao += Math.min(
    palavrasDescricaoComuns.length * 3,
    15
  );

  // Relação tecnológica.
  const textoBase = [
    produtoBase.name,
    produtoBase.description ?? "",
  ].join(" ");

  const textoCandidato = [
    candidato.name,
    candidato.description ?? "",
  ].join(" ");

  const familiasBase = identificarFamilias(textoBase);
  const familiasCandidato = identificarFamilias(
    textoCandidato
  );

  const familiasComuns = familiasBase.filter((familia) =>
    familiasCandidato.includes(familia)
  );

  pontuacao += Math.min(
    familiasComuns.length * 20,
    40
  );

  // Produtos complementares:
  // Relações intencionais entre componentes.
  const complementares: Record<string, string[]> = {
    esp32: [
      "sensores",
      "comunicacao",
      "alimentacao",
      "prototipagem",
      "acionamento",
    ],
    esp8266: [
      "sensores",
      "comunicacao",
      "alimentacao",
      "prototipagem",
      "acionamento",
    ],
    arduino: [
      "sensores",
      "alimentacao",
      "prototipagem",
      "acionamento",
      "comunicacao",
    ],
    raspberry: [
      "sensores",
      "comunicacao",
      "alimentacao",
      "prototipagem",
    ],
  };

  const familiasComplementares = new Set(
    familiasBase.flatMap(
      (familia) => complementares[familia] ?? []
    )
  );

  const relacaoComplementar = familiasCandidato.some(
    (familia) => familiasComplementares.has(familia)
  );

  // A pontuação complementar só é aplicada a outra categoria.
  if (
    relacaoComplementar &&
    produtoBase.categoryId !== candidato.categoryId
  ) {
    pontuacao += 20;
  }

  if (candidato.featured) {
    pontuacao += 5;
  }

  if (candidato.rating > 0) {
    pontuacao += Math.min(
      (candidato.rating / 5) * 5,
      5
    );
  }

  if (candidato.inStock) {
    pontuacao += 5;
  }

  // Evitar relações baseadas apenas em palavras genéricas.
  const temCorrespondencia =
    palavrasNomeComuns.length > 0 ||
    palavrasDescricaoComuns.length > 1 ||
    familiasComuns.length > 0 ||
    relacaoComplementar;

  return {
    pontuacao,
    relevante: temCorrespondencia && pontuacao >= 15,
  };
}


// ======================================================
// GET — CONSULTAR PRODUTO E PRODUTOS RELACIONADOS
// ======================================================


export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json(
        { error: "Identificador do produto inválido." },
        { status: 400 }
      );
    }

 const identificador = id.trim();

    // 1. Consultar produto principal.
    const produto = await prisma.product.findFirst({
      where: {
        active: true,
        OR: [
          { id: identificador },
          { slug: identificador },
        ],
      },
      include: {
        category: true,
      },
    });

    if (!produto) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 404 }
      );
    }

    // 2. Procurar candidatos.
    // Primeiro produtos da mesma categoria.
    const candidatosMesmaCategoria =
      await prisma.product.findMany({
        where: {
          active: true,
          id: { not: produto.id },
          categoryId: produto.categoryId,
        },
        include: {
          category: true,
        },
        orderBy: [
          { inStock: "desc" },
          { featured: "desc" },
          { rating: "desc" },
          { createdAt: "desc" },
        ],
        take: MAX_CANDIDATOS,
      });

    // 3. Procurar candidatos de outras categorias.
    // Limitamos a consulta para evitar percorrer todo o catálogo.
    const candidatosOutrasCategorias =
      await prisma.product.findMany({
        where: {
          active: true,
          inStock: true,
          id: {
            not: produto.id,
          },
          categoryId: {
            not: produto.categoryId,
          },
        },
        include: {
          category: true,
        },
        orderBy: [
          { featured: "desc" },
          { rating: "desc" },
          { createdAt: "desc" },
        ],
        take: MAX_CANDIDATOS,
      });

    // 4. Unificar candidatos.
    const candidatos = [
      ...candidatosMesmaCategoria,
      ...candidatosOutrasCategorias,
    ];

    // 5. Calcular relevância.
    const classificados = candidatos
      .map((candidato) => {
        const resultado = calcularRelevancia(
          produto,
          candidato
        );

        return {
          produto: candidato,
          pontuacao: resultado.pontuacao,
          relevante: resultado.relevante,
        };
      })
      .filter((item) => item.relevante)
      .sort((a, b) => {
        // Primeiro, maior relevância.
        if (b.pontuacao !== a.pontuacao) {
          return b.pontuacao - a.pontuacao;
        }

        // Em caso de empate, disponibilidade.
        if (
          a.produto.inStock !== b.produto.inStock
        ) {
          return a.produto.inStock ? -1 : 1;
        }

        // Depois, melhor avaliação.
        return b.produto.rating - a.produto.rating;
      });

    // 6. Máximo absoluto de cinco produtos.
    const relacionados = classificados
      .slice(0, MAX_PRODUTOS_RELACIONADOS)
      .map((item) => item.produto);

    // 7. Resposta.
    return NextResponse.json(
      {
        produto,
        relacionados,
        totalRelacionados: relacionados.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );

  } catch (error) {
    console.error(
      "Erro ao consultar detalhes do produto:",
      error
    );

    return NextResponse.json(
      {
        error: "Não foi possível consultar o produto.",
      },
      { status: 500 }
    );
  }
}


// ======================================================
// PATCH — ACTUALIZAR PRODUTO
// ======================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 1. Verificar sessão do gestor
    const sessao = await verificarSessaoGestor();

    if (!sessao) {
      return NextResponse.json(
        {
          error: "Não autorizado. Inicie sessão como gestor.",
        },
        { status: 401 }
      );
    }

    // 2. Identificar produto
    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json(
        { error: "Identificador do produto inválido." },
        { status: 400 }
      );
    }

    const produtoExistente = await prisma.product.findUnique({
      where: { id },
    });

    if (!produtoExistente) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 404 }
      );
    }

    // 3. Receber dados
    const dados = await request.formData();

    const code = dados.has("code")
      ? String(dados.get("code") ?? "").trim()
      : produtoExistente.code ?? "";

      if (code.length > 80) {
      return NextResponse.json(
        { error: "O código não pode ultrapassar 80 caracteres." },
        { status: 400 }
      );
    }

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

    const categoryId = String(
      dados.get("categoryId") || ""
    ).trim();

    const inStockRaw = dados.get("inStock");

    const featured = dados.get("featured") === "true";
    const active = dados.get("active") === "true";
    const promotion = dados.get("promotion") === "true";

    const price = Number(priceRaw);

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
            error:
              "O preço anterior deve ser superior ao preço actual.",
          },
          { status: 400 }
        );
      }
    }

    // 9. Verificar categoria
    const categoria = await prisma.category.findFirst({
      where: {
        id: categoryId,
        active: true,
      },
      select: { id: true },
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

    // 11. Preparar imagens que já pertencem ao produto
    const imagensOriginais = new Set([
      produtoExistente.image,
      ...(produtoExistente.images || []),
    ]);

    // 12. Receber URLs enviadas pelo formulário
    let imageUrls: unknown;
    let mainImage: unknown;

    try {
      imageUrls = JSON.parse(
        String(dados.get("imageUrls") || "[]")
      );

      mainImage = String(
        dados.get("mainImage") || ""
      );
    } catch {
      return NextResponse.json(
        { error: "Os dados das imagens são inválidos." },
        { status: 400 }
      );
    }

    // 13. Validar quantidade de imagens
    if (
      !Array.isArray(imageUrls) ||
      imageUrls.length < 1 ||
      imageUrls.length > MAX_IMAGES
    ) {
      return NextResponse.json(
        {
          error:
            `O produto deve possuir entre 1 e ${MAX_IMAGES} imagens.`,
        },
        { status: 400 }
      );
    }

    // 14. Validar cada URL
    const imagensValidas: string[] = [];

    for (const url of imageUrls) {
      if (typeof url !== "string" || !url.trim()) {
        return NextResponse.json(
          { error: "A galeria contém uma imagem inválida." },
          { status: 400 }
        );
      }

      // Uma imagem antiga só pode ser mantida
      // se já pertencer a este produto.
      const imagemAntiga = imagensOriginais.has(url);

      // Uma imagem nova tem de pertencer ao nosso Blob.
      const imagemBlob = validarUrlBlob(url);

      if (!imagemAntiga && !imagemBlob) {
        return NextResponse.json(
          {
            error:
              "Uma das imagens não pertence ao armazenamento autorizado.",
          },
          { status: 400 }
        );
      }

      imagensValidas.push(url);
    }

    // 15. Impedir URLs duplicadas
    if (
      new Set(imagensValidas).size !== imagensValidas.length
    ) {
      return NextResponse.json(
        { error: "A galeria contém imagens duplicadas." },
        { status: 400 }
      );
    }

    // 16. Validar imagem principal
    if (
      typeof mainImage !== "string" ||
      !imagensValidas.includes(mainImage)
    ) {
      return NextResponse.json(
        { error: "A imagem principal seleccionada é inválida." },
        { status: 400 }
      );
    }

    // 17. Organizar galeria com a imagem principal primeiro
    const galeriaOrdenada = [
      mainImage,
      ...imagensValidas.filter(
        (imagem) => imagem !== mainImage
      ),
    ];

    // 18. Gerar slug
    const slug =
      name === produtoExistente.name
        ? produtoExistente.slug
        : await gerarSlugUnico(name, id);

    // 19. Actualizar produto na base de dados
    const produto = await prisma.product.update({
      where: { id },
      data: {
        code: code || null,
        name,
        slug,
        description: description || null,
        price,
        oldPrice,
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

    return NextResponse.json({
      message: "Produto actualizado com sucesso.",
      produto,
    });

  } catch (error) {
    console.error("Erro ao actualizar produto:", error);

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
      {
        error: "Não foi possível actualizar o produto.",
      },
      { status: 500 }
    );
  }
}
