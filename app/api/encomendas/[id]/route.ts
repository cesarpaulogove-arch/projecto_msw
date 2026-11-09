
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ESTADOS_VALIDOS = [
  "PENDENTE",
  "CONFIRMADA",
  "EM_PREPARACAO",
  "ENVIADA",
  "ENTREGUE",
  "CANCELADA",
] as const;

type EstadoEncomenda = (typeof ESTADOS_VALIDOS)[number];

// GET - Consultar uma encomenda
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const encomenda = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!encomenda) {
      return NextResponse.json(
        {
          success: false,
          error: "Encomenda não encontrada.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      encomenda: {
        id: encomenda.id,
        referencia: encomenda.orderNumber,
        cliente: {
          nome: encomenda.customerName,
          telefone: encomenda.phone,
          email: encomenda.email,
          endereco: encomenda.address,
          distrito: encomenda.district,
        },
        observacoes: encomenda.notes,
        subtotal: Number(encomenda.subtotal),
        taxaEntrega: Number(encomenda.deliveryFee),
        total: Number(encomenda.total),
        estado: encomenda.status,
        produtos: encomenda.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          nome: item.productName,
          quantidade: item.quantity,
          precoUnitario: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })),
        dataCriacao: encomenda.createdAt,
        dataActualizacao: encomenda.updatedAt,
      },
    });
  } catch (error) {
    console.error("ERRO AO CONSULTAR ENCOMENDA:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível consultar a encomenda.",
      },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado da encomenda
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Ler os dados enviados pelo frontend
    let body: { estado?: string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Corpo da requisição inválido.",
        },
        { status: 400 }
      );
    }

    const estado = body.estado;

    // Validar o estado recebido
    if (
      !estado ||
      !ESTADOS_VALIDOS.includes(estado as EstadoEncomenda)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Estado da encomenda inválido.",
        },
        { status: 400 }
      );
    }

    // Actualizar encomenda e stock numa transacção
    const encomenda = await prisma.$transaction(async (tx) => {
      const actual = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      if (!actual) {
        throw new Error("ENCOMENDA_NAO_ENCONTRADA");
      }

      // Não permitir alterações depois do cancelamento
      if (actual.status === "CANCELADA") {
        throw new Error("ENCOMENDA_JA_CANCELADA");
      }

      // Devolver stock quando a encomenda é cancelada
      if (estado === "CANCELADA") {
        for (const item of actual.items) {
          if (item.productId) {
            await tx.product.update({
              where: {
                id: item.productId,
              },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      // Guardar novo estado
      return tx.order.update({
        where: { id },
        data: {
          status: estado as EstadoEncomenda,
        },
        include: {
          items: true,
        },
      });
        }, {
      maxWait: 10000,
      timeout: 20000,
    });

    return NextResponse.json({
      success: true,
      message: "Estado da encomenda actualizado com sucesso.",
      encomenda: {
        id: encomenda.id,
        referencia: encomenda.orderNumber,
        estado: encomenda.status,
        total: Number(encomenda.total),
        produtos: encomenda.items.map((item) => ({
          nome: item.productName,
          quantidade: item.quantity,
          subtotal: Number(item.subtotal),
        })),
        dataActualizacao: encomenda.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ENCOMENDA_NAO_ENCONTRADA") {
        return NextResponse.json(
          {
            success: false,
            error: "Encomenda não encontrada.",
          },
          { status: 404 }
        );
      }

      if (error.message === "ENCOMENDA_JA_CANCELADA") {
        return NextResponse.json(
          {
            success: false,
            error: "Esta encomenda já foi cancelada.",
          },
          { status: 409 }
        );
      }
    }

    console.error("ERRO AO ACTUALIZAR ENCOMENDA:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível actualizar a encomenda.",
      },
      { status: 500 }
    );
  }
}
