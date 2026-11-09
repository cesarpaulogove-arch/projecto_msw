
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Contexto = {
  params: Promise<{ id: string }>;
};

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
      Boolean(endereco.hostname)
    );
  } catch {
    return false;
  }
}

// GET - Consultar conteúdo pelo ID
export async function GET(
  _request: NextRequest,
  { params }: Contexto
) {
  try {
    const { id } = await params;

    const conteudo = await prisma.siteContent.findUnique({
      where: { id },
    });

    if (!conteudo) {
      return respostaErro("Conteúdo não encontrado.", 404);
    }

    return NextResponse.json(conteudo);
  } catch (error) {
    console.error("Erro ao consultar conteúdo:", error);

    return respostaErro(
      "Não foi possível consultar o conteúdo.",
      500
    );
  }
}

// PUT - Actualizar conteúdo
export async function PUT(
  request: NextRequest,
  { params }: Contexto
) {
  try {
    const { id } = await params;

    const existente = await prisma.siteContent.findUnique({
      where: { id },
      select: {
        id: true,
        publishedAt: true,
      },
    });

    if (!existente) {
      return respostaErro("Conteúdo não encontrado.", 404);
    }

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
    if (
      typeof dados.type !== "string" ||
      !TIPOS_VALIDOS.includes(dados.type as TipoConteudo)
    ) {
      return respostaErro("Seleccione um tipo válido.");
    }

    const type = dados.type as TipoConteudo;

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

    // Galeria
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

    // Garantir que a imagem principal aparece primeiro
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

    // Preservar a data original se já estava publicado
    const publishedAt =
      status === "PUBLICADO"
        ? existente.publishedAt || new Date()
        : null;

    // Actualizar no Prisma
    const conteudoActualizado = await prisma.siteContent.update({
      where: { id },
      data: {
        title,
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

    return NextResponse.json({
      message:
        status === "PUBLICADO"
          ? "Conteúdo actualizado e publicado com sucesso."
          : "Conteúdo actualizado e guardado como rascunho.",
      conteudo: conteudoActualizado,
    });
  } catch (error) {
    console.error("Erro ao actualizar conteúdo:", error);

    return respostaErro(
      "Não foi possível actualizar o conteúdo.",
      500
    );
  }
}
