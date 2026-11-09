
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { exigirGestor } from "@/lib/auth-gestor";




function gerarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// LISTAR CATEGORIAS
// Público: visitantes, clientes e gestor
export async function GET() {
  try {
    const categorias = await prisma.category.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json(categorias, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao listar categorias:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar as categorias." },
      { status: 500 }
    );
  }
}

// CRIAR CATEGORIA
// Exclusivo do gestor
export async function POST(request: Request) {
  try {
    await exigirGestor();

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 }
      );
    }

    const nome = String(body.name ?? "").trim();
    const descricao = String(body.description ?? "").trim();
    const imagem = String(body.image ?? "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "O nome da categoria é obrigatório." },
        { status: 400 }
      );
    }

    if (nome.length > 100) {
      return NextResponse.json(
        { error: "O nome não pode ultrapassar 100 caracteres." },
        { status: 400 }
      );
    }

    if (descricao.length > 1000) {
      return NextResponse.json(
        { error: "A descrição não pode ultrapassar 1000 caracteres." },
        { status: 400 }
      );
    }

    if (imagem.length > 2048) {
      return NextResponse.json(
        { error: "O endereço da imagem é demasiado longo." },
        { status: 400 }
      );
    }

    const slug = gerarSlug(nome);

    if (!slug) {
      return NextResponse.json(
        { error: "Nome de categoria inválido." },
        { status: 400 }
      );
    }

    const categoria = await prisma.category.create({
      data: {
        name: nome,
        slug,
        description: descricao || null,
        image: imagem || null,
        active: true,
        showInNav: false,
        navOrder: null,
      },
    });

    return NextResponse.json(categoria, {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    // Sessão inválida ou inexistente
    if (
      error instanceof Error &&
      error.message === "NEXT_REDIRECT"
    ) {
      return NextResponse.json(
        { error: "Não autorizado. Apenas o gestor pode criar categorias." },
        { status: 401 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome ou endereço." },
        { status: 409 }
      );
    }

    console.error("Erro ao criar categoria:", error);

    return NextResponse.json(
      { error: "Erro ao criar categoria." },
      { status: 500 }
    );
  }
}
