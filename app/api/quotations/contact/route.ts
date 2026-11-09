
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get("phone")?.trim();

    if (!phone || phone.length < 7 || phone.length > 40) {
      return NextResponse.json(
        { error: "Número de telefone inválido." },
        { status: 400 }
      );
    }

    const cotacao = await prisma.quotation.findFirst({
      where: {
        phone,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        customerName: true,
        company: true,
        phone: true,
        email: true,
        address: true,
      },
    });

    if (!cotacao) {
      return NextResponse.json({
        found: false,
        customer: null,
      });
    }

    return NextResponse.json(
      {
        found: true,
        customer: cotacao,
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
      { status: 500 }
    );
  }
}
