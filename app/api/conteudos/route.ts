
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TipoConteudo = "SERVICOS" | "PROJECTOS" | "SOLUCOES";
type EstadoConteudo = "RASCUNHO" | "PUBLICADO";

const TIPOS_VALIDOS: TipoConteudo[] = [
  "SERVICOS",
  "PROJECTOS",
  "SOLUCOES",
];

const ESTADOS_VALIDOS: EstadoConteudo[] = [
  "RASCUNHO",
  "PUBLICADO",
];

const MAX_IMAGENS = 10;

function respostaErro(mensagem: string, status = 400) {
  return NextResponse.json({ error: mensagem }, { status });
}

function validarUrlImagem(valor: string): boolean {
  if (
    valor.startsWith("/uploads/conteudos/") &&
    !valor.includes("..") &&
    !valor.includes("\\") &&
    !valor.startsWith("//")
  ) {
    return true;
  }

  try {
    const endereco = new URL(valor);

    return (
      (endereco.protocol === "https:" ||
        endereco.protocol === "http:") &&
      endereco.hostname.length > 0
    );
  } catch {
    return false;
  }
}

function gerarSlug(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET - Listar conteúdos
export async function GET() {
  try {
    const conteudos = await prisma.siteContent.findMany({
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(conteudos);
  } catch (error) {
    console.error("Erro ao consultar conteúdos:", error);

    return respostaErro(
      "Não foi possível consultar os conteúdos.",
      500
    );
  }
}

// POST - Criar conteúdo
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      body === null ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return respostaErro("Os dados enviados são inválidos.");
    }

    const dados = body as Record<string, unknown>;

    // Título
    const title =
      typeof dados.title === "string"
        ? dados.title.trim()
        : "";

    if (!title) {
      return respostaErro("O título é obrigatório.");
    }

    if (title.length > 160) {
      return respostaErro(
        "O título não pode ultrapassar 160 caracteres."
      );
    }

    // Tipo
    const typeValue = dados.type;

    if (
      typeof typeValue !== "string" ||
      !TIPOS_VALIDOS.includes(typeValue as TipoConteudo)
    ) {
      return respostaErro("Seleccione um tipo válido.");
    }

    const type = typeValue as TipoConteudo;

    // Resumo
    const summary =
      typeof dados.summary === "string"
        ? dados.summary.trim()
        : "";

    if (summary.length > 500) {
      return respostaErro(
        "O resumo não pode ultrapassar 500 caracteres."
      );
    }

    // Conteúdo opcional
    const content =
      typeof dados.content === "string"
        ? dados.content.trim()
        : "";

    // Imagem principal
    let image: string | null = null;

    if (dados.image !== undefined && dados.image !== null) {
      if (typeof dados.image !== "string") {
        return respostaErro(
          "A imagem principal tem um formato inválido."
        );
      }

      const imagemPrincipal = dados.image.trim();

      if (imagemPrincipal) {
        if (!validarUrlImagem(imagemPrincipal)) {
          return respostaErro(
            "O endereço da imagem principal é inválido."
          );
        }

        image = imagemPrincipal;
      }
    }

    // Galeria de imagens
    if (
      dados.images !== undefined &&
      !Array.isArray(dados.images)
    ) {
      return respostaErro(
        "A galeria de imagens tem um formato inválido."
      );
    }

    const images: string[] = [];

    if (Array.isArray(dados.images)) {
      for (const item of dados.images) {
        if (typeof item !== "string") {
          return respostaErro(
            "A galeria contém elementos inválidos."
          );
        }

        const url = item.trim();

        if (!url) continue;

        if (!validarUrlImagem(url)) {
          return respostaErro(
            "Um dos endereços das imagens é inválido."
          );
        }

        if (!images.includes(url)) {
          images.push(url);
        }

        if (images.length > MAX_IMAGENS) {
          return respostaErro(
            "A galeria permite no máximo 10 imagens."
          );
        }
      }
    }

    // Definir imagem principal e galeria final
    const imagensFinais = [...images];

    if (image) {
      const indice = imagensFinais.indexOf(image);

      if (indice !== -1) {
        imagensFinais.splice(indice, 1);
      }

      imagensFinais.unshift(image);
    } else if (imagensFinais.length > 0) {
      image = imagensFinais[0];
    }

    if (imagensFinais.length > MAX_IMAGENS) {
      return respostaErro(
        "A galeria permite no máximo 10 imagens."
      );
    }

    // Ordem
    const order =
      dados.order === undefined
        ? 0
        : Number(dados.order);

    if (!Number.isInteger(order) || order < 0) {
      return respostaErro(
        "A ordem deve ser um número inteiro igual ou superior a zero."
      );
    }

    // Estado
    const statusValue =
      dados.status === undefined
        ? "RASCUNHO"
        : dados.status;

    if (
      typeof statusValue !== "string" ||
      !ESTADOS_VALIDOS.includes(
        statusValue as EstadoConteudo
      )
    ) {
      return respostaErro("Seleccione um estado válido.");
    }

    const status = statusValue as EstadoConteudo;

    // Gerar slug
    const slugBase = gerarSlug(title);

    if (!slugBase) {
      return respostaErro(
        "Não foi possível gerar um endereço válido para o conteúdo."
      );
    }

    let slug = slugBase;
    let contador = 1;

    while (true) {
      const existente = await prisma.siteContent.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existente) break;

      slug = `${slugBase}-${contador}`;
      contador++;
    }

    // Data de publicação
    const publishedAt =
      status === "PUBLICADO" ? new Date() : null;

    // Guardar no Prisma
    const novoConteudo = await prisma.siteContent.create({
      data: {
        title,
        slug,
        type,
        summary: summary || null,
        content,
        image,
        images: imagensFinais,
        order,
        status,
        publishedAt,
      },
    });

    return NextResponse.json(
      {
        message:
          status === "PUBLICADO"
            ? "Conteúdo publicado com sucesso."
            : "Conteúdo guardado como rascunho.",
        conteudo: novoConteudo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar conteúdo:", error);

    return respostaErro(
      "Ocorreu um erro ao guardar o conteúdo.",
      500
    );
  }
}
