
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Ler os parâmetros antes do try/catch
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
        customerName: true,
        company: true,
        phone: true,
        email: true,
        address: true,
      },
    });

    return NextResponse.json(
      cotacao
        ? { found: true, customer: cotacao }
        : { found: false, customer: null },
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
