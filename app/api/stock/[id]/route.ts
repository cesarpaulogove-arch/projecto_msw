import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.inStock !== "boolean") {
      return NextResponse.json(
        { error: "Disponibilidade inválida." },
        { status: 400 }
      );
    }

    const produto = await prisma.product.update({
      where: { id },
      data: {
        inStock: body.inStock,
      },
      select: {
        id: true,
        name: true,
        inStock: true,
      },
    });

    return NextResponse.json({
      success: true,
      produto,
    });
  } catch (error) {
    console.error("Erro ao atualizar disponibilidade:", error);

    return NextResponse.json(
      { error: "Não foi possível atualizar o produto." },
      { status: 500 }
    );
  }
}