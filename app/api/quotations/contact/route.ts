
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/client-session";

const headersNoCache = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar primeiro se existe uma sessão autenticada
    const sessao = await getClientSession();

    if (sessao) {
      const cliente = await prisma.user.findUnique({
        where: {
          id: sessao.userId,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          active: true,
        },
      });

      if (
        !cliente ||
        !cliente.active ||
        cliente.role !== "CLIENTE"
      ) {
        return NextResponse.json(
          { error: "Sessão de cliente inválida. Faça login novamente." },
          {
            status: 401,
            headers: headersNoCache,
          }
        );
      }

      // 2. Procurar a última cotação para recuperar
      // os dados específicos de cada cotação
      const ultimaCotacao = cliente.phone
        ? await prisma.quotation.findFirst({
            where: {
              phone: cliente.phone,
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              customerType: true,
              company: true,
              nuit: true,
              address: true,
            },
          })
        : null;

      // 3. Os dados pessoais vêm sempre da conta autenticada.
      // Os dados empresariais vêm da última cotação, quando existirem.
      return NextResponse.json(
        {
          authenticated: true,
          found: true,
          customer: {
            customerName: cliente.name,
            phone: cliente.phone ?? "",
            email: cliente.email ?? "",
            customerType:
              ultimaCotacao?.customerType ??
              (ultimaCotacao?.company ? "COMPANY" : "INDIVIDUAL"),
            company: ultimaCotacao?.company ?? "",
            nuit: ultimaCotacao?.nuit ?? "",
            address: ultimaCotacao?.address ?? "",
          },
        },
        {
          headers: headersNoCache,
        }
      );
    }

    // 4. Sem sessão: manter o comportamento anterior,
    // procurando o contacto pelo telefone
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone")?.trim();

    if (!phone || phone.length < 7 || phone.length > 40) {
      return NextResponse.json(
        { error: "Número de telefone inválido." },
        {
          status: 400,
          headers: headersNoCache,
        }
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
        {
          authenticated: false,
          found: false,
          customer: null,
        },
        {
          headers: headersNoCache,
        }
      );
    }

    return NextResponse.json(
      {
        authenticated: false,
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
        headers: headersNoCache,
      }
    );
  } catch (error) {
    console.error("Erro ao verificar contacto:", error);

    return NextResponse.json(
      { error: "Não foi possível verificar o contacto." },
      {
        status: 500,
        headers: headersNoCache,
      }
    );
  }
}
