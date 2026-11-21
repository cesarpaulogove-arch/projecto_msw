
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/client-session";

// ======================================================
// RESPOSTA NÃO AUTORIZADA
// ======================================================

function respostaNaoAutorizada() {
  return NextResponse.json(
    {
      success: false,
      error: "Inicia sessão para aceder ao teu carrinho.",
    },
    { status: 401 }
  );
}

// ======================================================
// GET — RECUPERAR CARRINHO DA CONTA
// ======================================================

export async function GET() {
  try {
    const sessao = await getClientSession();

    if (!sessao?.userId) {
      return respostaNaoAutorizada();
    }

    const carrinho = await prisma.cart.findUnique({
      where: {
        userId: sessao.userId,
      },
      include: {
        items: {
          where: {
            product: {
              active: true,
            },
          },
          include: {
            product: {
              include: {
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const itens = (carrinho?.items ?? []).map((item) => ({
      produto: {
        id: item.product.id,
        name: item.product.name,
        category: item.product.category.name,

        // Preços sempre obtidos da base de dados.
        price: Number(item.product.price),

        oldPrice:
          item.product.oldPrice === null
            ? null
            : Number(item.product.oldPrice),

        promotion: item.product.promotion === true,

        image: item.product.image,
        images: item.product.images ?? [],
        rating: item.product.rating ?? 0,
        inStock: item.product.inStock,
      },

      quantidade: item.quantity,
      selecionado: item.selecionado,
    }));

    return NextResponse.json(
      {
        success: true,
        itens,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("ERRO GET CARRINHO:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível carregar o carrinho.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT — GUARDAR / ACTUALIZAR CARRINHO
// ======================================================

export async function PUT(request: NextRequest) {
  try {
    const sessao = await getClientSession();

    if (!sessao?.userId) {
      return respostaNaoAutorizada();
    }

    // --------------------------------------------------
    // 1. LER DADOS
    // --------------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "O conteúdo enviado não é um JSON válido.",
        },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !Array.isArray(
        (body as Record<string, unknown>).itens
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados do carrinho inválidos.",
        },
        { status: 400 }
      );
    }

    const itensRecebidos = (
      body as { itens: unknown[] }
    ).itens;

    if (itensRecebidos.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "O carrinho não pode ultrapassar 100 produtos.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. VALIDAR ITENS
    // --------------------------------------------------

    const ids = new Set<string>();

    const itensValidados: {
      productId: string;
      quantity: number;
      selecionado: boolean;
    }[] = [];

    for (const item of itensRecebidos) {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Produto inválido no carrinho.",
          },
          { status: 400 }
        );
      }

      const valor = item as Record<string, unknown>;
      const produto = valor.produto;

      if (
        !produto ||
        typeof produto !== "object" ||
        Array.isArray(produto)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Dados do produto inválidos.",
          },
          { status: 400 }
        );
      }

      const p = produto as Record<string, unknown>;

      const productId =
        typeof p.id === "string"
          ? p.id.trim()
          : "";

      const quantity = valor.quantidade;

      if (
        !productId ||
        productId.length > 191 ||
        !Number.isSafeInteger(quantity) ||
        (quantity as number) < 1 ||
        (quantity as number) > 99 ||
        typeof valor.selecionado !== "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Dados de um produto inválidos.",
          },
          { status: 400 }
        );
      }

      if (ids.has(productId)) {
        return NextResponse.json(
          {
            success: false,
            error: "Existem produtos repetidos no carrinho.",
          },
          { status: 400 }
        );
      }

      ids.add(productId);

      itensValidados.push({
        productId,
        quantity: quantity as number,
        selecionado: valor.selecionado,
      });
    }

    // --------------------------------------------------
    // 3. CONFIRMAR PRODUTOS NA BASE DE DADOS
    // --------------------------------------------------

    const produtos = ids.size
      ? await prisma.product.findMany({
          where: {
            id: {
              in: [...ids],
            },
            active: true,
          },
          select: {
            id: true,
          },
        })
      : [];

    if (produtos.length !== ids.size) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Um ou mais produtos já não estão disponíveis.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. GUARDAR NUMA TRANSAÇÃO
    // --------------------------------------------------

    await prisma.$transaction(async (tx) => {
      const carrinho = await tx.cart.upsert({
        where: {
          userId: sessao.userId,
        },

        create: {
          userId: sessao.userId,
        },

        update: {},

        select: {
          id: true,
        },
      });

      const productIds = itensValidados.map(
        (item) => item.productId
      );

      // Remover produtos que já não estão no carrinho.
      await tx.cartItem.deleteMany({
        where: {
          cartId: carrinho.id,

          ...(productIds.length > 0
            ? {
                productId: {
                  notIn: productIds,
                },
              }
            : {}),
        },
      });

      // Actualizar ou criar os produtos.
      for (const item of itensValidados) {
        await tx.cartItem.upsert({
          where: {
            cartId_productId: {
              cartId: carrinho.id,
              productId: item.productId,
            },
          },

          create: {
            cartId: carrinho.id,
            productId: item.productId,
            quantity: item.quantity,
            selecionado: item.selecionado,
          },

          update: {
            quantity: item.quantity,
            selecionado: item.selecionado,
          },
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Carrinho guardado com sucesso.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERRO PUT CARRINHO:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível guardar o carrinho.",
      },
      { status: 500 }
    );
  }
}
