
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/client-session";

function normalizarTelefone(valor: string): string {
  return valor.replace(/\D/g, "")
    .replace(/^00258/, "")
    .replace(/^258/, "");
}

function formatosTelefone(valor: string): string[] {
  const numero = normalizarTelefone(valor);

  if (!/^8\d{8}$/.test(numero)) {
    return [];
  }

  return [
    numero,
    `+258${numero}`,
    `258${numero}`,
    `00258${numero}`,
  ];
}

export async function GET() {
  try {
    // 1. Verificar sessão do cliente
    const sessao = await getClientSession();

    if (!sessao) {
      return NextResponse.json(
        {
          success: false,
          error: "Inicia sessão para consultar o teu histórico.",
        },
        { status: 401 }
      );
    }

    // 2. Construir critérios da conta autenticada
    const telefone = sessao.phone
      ? formatosTelefone(sessao.phone)
      : [];

    const email = sessao.email?.trim();

    const identificadores = [];

    if (telefone.length > 0) {
      identificadores.push({
        phone: { in: telefone },
      });
    }

    if (email) {
      identificadores.push({
        email: {
          equals: email,
          mode: "insensitive" as const,
        },
      });
    }

    if (identificadores.length === 0) {
      return NextResponse.json({
        success: true,
        encontrado: false,
        quantidade: 0,
        encomendas: [],
      });
    }

    // 3. Consultar apenas encomendas associadas à conta
    const encomendas = await prisma.order.findMany({
      where: {
        OR: identificadores,
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

    // 4. Preparar resposta
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
    console.error("Erro ao consultar histórico:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível consultar o histórico de compras.",
      },
      { status: 500 }
    );
  }
}
