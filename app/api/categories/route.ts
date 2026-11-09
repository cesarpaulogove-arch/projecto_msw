
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        active: true,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,

        _count: {
          select: {
            products: {
              where: {
                active: true,
                inStock: true,
              },
            },
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar as categorias." },
      { status: 500 }
    );
  }
}
