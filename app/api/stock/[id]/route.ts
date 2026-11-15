
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar se foi enviado pelo menos um campo válido
    const atualizarDisponibilidade =
      typeof body.inStock === "boolean";

    const atualizarVisibilidade =
      typeof body.active === "boolean";

    if (!atualizarDisponibilidade && !atualizarVisibilidade) {
      return NextResponse.json(
        {
          error:
            "É necessário indicar uma disponibilidade ou visibilidade válida.",
        },
        { status: 400 }
      );
    }

    // Construir actualização apenas com os campos enviados
    const dadosAtualizacao: {
      inStock?: boolean;
      active?: boolean;
    } = {};

    if (atualizarDisponibilidade) {
      dadosAtualizacao.inStock = body.inStock;
    }

    if (atualizarVisibilidade) {
      dadosAtualizacao.active = body.active;
    }

    const produto = await prisma.product.update({
      where: { id },
      data: dadosAtualizacao,
      select: {
        id: true,
        name: true,
        inStock: true,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      produto,
    });
  } catch (error) {
    console.error("Erro ao actualizar produto:", error);

    return NextResponse.json(
      {
        error: "Não foi possível actualizar o produto.",
      },
      { status: 500 }
    );
  }
}
