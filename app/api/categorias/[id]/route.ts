
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

function gerarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// CONSULTAR UMA CATEGORIA
export async function GET(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;

    const categoria = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(categoria);
  } catch (error) {
    console.error("Erro ao consultar categoria:", error);

    return NextResponse.json(
      { error: "Erro ao consultar categoria." },
      { status: 500 }
    );
  }
}

// EDITAR CATEGORIA
export async function PUT(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const nome = String(body.name ?? "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "O nome é obrigatório." },
        { status: 400 }
      );
    }

    const slug = gerarSlug(nome);

    if (!slug) {
      return NextResponse.json(
        { error: "Nome inválido." },
        { status: 400 }
      );
    }

    const categoria = await prisma.category.update({
      where: { id },
      data: {
        name: nome,
        slug,
        description:
          typeof body.description === "string"
            ? body.description.trim() || null
            : undefined,
        image:
          typeof body.image === "string"
            ? body.image.trim() || null
            : undefined,

        // Não alterar showInNav nem navOrder aqui.
      },
    });

    return NextResponse.json(categoria);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome." },
        { status: 409 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Categoria não encontrada." },
        { status: 404 }
      );
    }

    console.error("Erro ao atualizar categoria:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar categoria." },
      { status: 500 }
    );
  }
}

// ACTIVAR / DESACTIVAR CATEGORIA
export async function PATCH(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    const categoria = await prisma.category.update({
      where: { id },
      data: {
        active: body.active,

        // A selecção da barra é preservada.
        // A navegação pública filtrará categorias inactivas.
      },
    });

    return NextResponse.json(categoria);
  } catch (error) {
    console.error("Erro ao alterar estado:", error);

    return NextResponse.json(
      { error: "Não foi possível alterar o estado da categoria." },
      { status: 400 }
    );
  }
}

// ELIMINAR CATEGORIA
export async function DELETE(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;

    const categoria = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada." },
        { status: 404 }
      );
    }

    if (categoria._count.products > 0) {
      return NextResponse.json(
        {
          error:
            "Esta categoria possui produtos associados. Transfira-os para outra categoria antes de eliminar.",
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Categoria eliminada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao eliminar categoria:", error);

    return NextResponse.json(
      { error: "Erro ao eliminar categoria." },
      { status: 500 }
    );
  }
}
