
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export async function GET() {
  try {
    const [allCategories, mainCategories] = await Promise.all([
      // Todas as categorias activas
      prisma.category.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),

      // Categorias principais visíveis na navegação
      prisma.category.findMany({
        where: {
          active: true,
          showInNav: true,
          products: {
            some: {
              active: true,
              inStock: true,
            },
          },
        },
        orderBy: {
          navOrder: "asc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          navOrder: true,
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
      }),
    ]);

    return NextResponse.json(
      {
        allCategories,
        mainCategories,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("ERRO API CATEGORIAS MENU:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao carregar categorias.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
