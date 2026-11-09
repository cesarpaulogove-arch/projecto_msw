
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LIMITE_CATEGORIAS = 5;

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { categoryIds } = body;

    // Validar array
    if (!Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: "Lista de categorias inválida." },
        { status: 400 }
      );
    }

    // Limite de cinco
    if (categoryIds.length > LIMITE_CATEGORIAS) {
      return NextResponse.json(
        { error: "A barra principal permite apenas 5 categorias." },
        { status: 400 }
      );
    }

    // Validar IDs
    if (
      categoryIds.some(
        (id: unknown) =>
          typeof id !== "string" || !id.trim()
      )
    ) {
      return NextResponse.json(
        { error: "Existem identificadores inválidos." },
        { status: 400 }
      );
    }

    // Impedir duplicados
    if (new Set(categoryIds).size !== categoryIds.length) {
      return NextResponse.json(
        { error: "Não podes seleccionar categorias repetidas." },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {

      // Consultar categorias enviadas
      const categorias = await tx.category.findMany({
        where: {
          id: {
            in: categoryIds,
          },
        },
        select: {
          id: true,
          active: true,
          showInNav: true,
        },
      });

      // Confirmar que todos os IDs existem
      if (categorias.length !== categoryIds.length) {
        throw new Error("CATEGORIA_NAO_EXISTE");
      }

      // Não permitir adicionar categorias inactivas.
      // Mas permitir manter as que já estavam seleccionadas.
      const categoriaInvalida = categorias.some(
        (categoria) =>
          !categoria.active && !categoria.showInNav
      );

      if (categoriaInvalida) {
        throw new Error("CATEGORIA_INACTIVA");
      }

      // Limpar selecção anterior
      await tx.category.updateMany({
        where: {
          showInNav: true,
        },
        data: {
          showInNav: false,
          navOrder: null,
        },
      });

      // Guardar selecção e ordem
      for (const [index, id] of categoryIds.entries()) {
        await tx.category.update({
          where: {
            id,
          },
          data: {
            showInNav: true,
            navOrder: index + 1,
          },
        });
      }

      return categoryIds;
    });

    return NextResponse.json({
      success: true,
      message: "Barra principal actualizada com sucesso.",
      categoryIds: resultado,
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CATEGORIA_NAO_EXISTE") {
        return NextResponse.json(
          { error: "Uma ou mais categorias não existem." },
          { status: 400 }
        );
      }

      if (error.message === "CATEGORIA_INACTIVA") {
        return NextResponse.json(
          {
            error:
              "Não podes adicionar uma categoria inactiva à barra principal.",
          },
          { status: 400 }
        );
      }
    }

    console.error("ERRO AO GUARDAR BARRA PRINCIPAL:", error);

    return NextResponse.json(
      { error: "Erro interno ao actualizar a barra principal." },
      { status: 500 }
    );
  }
}
