
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const phone = url.searchParams.get("phone")?.trim();

  try {
    if (!phone || phone.length < 7 || phone.length > 40) {
      return NextResponse.json(
        { error: "Número de telefone inválido." },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    const cotacao = await prisma.quotation.findFirst({
      where: { phone },
      orderBy: { createdAt: "desc" },
      select: {
        customerType: true,
        customerName: true,
        company: true,
        nuit: true,
        phone: true,
        email: true,
        address: true,
      },
    });

    if (!cotacao) {
      return NextResponse.json(
        { found: false, customer: null },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    return NextResponse.json(
      {
        found: true,
        customer: {
          ...cotacao,
          // Compatibilidade com registos antigos
          customerType:
            cotacao.customerType ??
            (cotacao.company ? "COMPANY" : "INDIVIDUAL"),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao verificar contacto:", error);

    return NextResponse.json(
      { error: "Não foi possível verificar o contacto." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
