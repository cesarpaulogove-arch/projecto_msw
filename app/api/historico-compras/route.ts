
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizarTelefone(valor: string): string {
  let numero = valor.replace(/\D/g, "");

  if (numero.startsWith("00258")) {
    numero = numero.slice(5);
  } else if (numero.startsWith("258")) {
    numero = numero.slice(3);
  }

  return numero;
}

export async function GET(request: NextRequest) {
  try {
    const telefoneRecebido =
      request.nextUrl.searchParams.get("telefone") || "";

    const telefone = normalizarTelefone(telefoneRecebido);

    // Validar telefone moçambicano
    if (!/^8\d{8}$/.test(telefone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Introduz um número de telefone válido.",
        },
        { status: 400 }
      );
    }

    // Consultar encomendas
    const encomendas = await prisma.order.findMany({
      where: {
        phone: telefone,
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        orderNumber: true,

        customerType: true,
        customerName: true,
        company: true,
        nuit: true,

        phone: true,
        email: true,
        address: true,
        district: true,
        notes: true,

        deliveryFee: true,
        total: true,
        status: true,
        createdAt: true,

        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        },
      },
    });

    // Preparar resposta
    const resultado = encomendas.map((encomenda) => ({
      id: encomenda.id,

      referencia: encomenda.orderNumber,

      tipoCliente: encomenda.customerType,
      cliente: encomenda.customerName,
      empresa: encomenda.company,
      nuit: encomenda.nuit,

      telefone: encomenda.phone,
      email: encomenda.email,
      endereco: encomenda.address,
      distrito: encomenda.district,
      observacoes: encomenda.notes,

      entrega: Number(encomenda.deliveryFee),
      total: Number(encomenda.total),

      estado: encomenda.status,
      data: encomenda.createdAt,

      produtos: encomenda.items.map((item) => ({
        id: item.id,
        nome: item.productName,
        quantidade: item.quantity,
        preco: Number(item.unitPrice),
        total: Number(item.total),
      })),
    }));

    return NextResponse.json(
      {
        success: true,
        encontrado: resultado.length > 0,
        quantidade: resultado.length,
        encomendas: resultado,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao consultar histórico de compras:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível consultar o histórico de compras.",
      },
      { status: 500 }
    );
  }
}
