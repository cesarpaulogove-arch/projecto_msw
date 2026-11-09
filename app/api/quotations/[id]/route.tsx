
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const estadosPermitidos = [
  "RASCUNHO",
  "EMITIDA",
  "ACEITE",
  "REJEITADA",
  "EXPIRADA",
] as const;

type QuotationStatus =
  (typeof estadosPermitidos)[number];

function textoOpcional(valor: unknown): string | null | undefined {
  if (valor === undefined) return undefined;
  if (valor === null) return null;

  if (typeof valor !== "string") {
    return undefined;
  }

  const resultado = valor.trim();

  return resultado || null;
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GET — Consultar cotação individual
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Identificador da cotação não informado." },
        { status: 400 }
      );
    }

    const cotacao = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!cotacao) {
      return NextResponse.json(
        { error: "Cotação não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      quotation: cotacao,
    });

  } catch (error) {
    console.error("Erro ao consultar cotação:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar a cotação." },
      { status: 500 }
    );
  }
}

// PATCH — Actualizar dados da cotação
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const cotacaoExistente =
      await prisma.quotation.findUnique({
        where: { id },
      });

    if (!cotacaoExistente) {
      return NextResponse.json(
        { error: "Cotação não encontrada." },
        { status: 404 }
      );
    }

    let dados: Record<string, unknown>;

    try {
      dados = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Dados enviados inválidos." },
        { status: 400 }
      );
    }

    const data: {
      customerName?: string;
      company?: string | null;
      phone?: string;
      email?: string | null;
      address?: string | null;
      notes?: string | null;
      validUntil?: Date | null;
      status?: QuotationStatus;
    } = {};

    // Nome do cliente
    if (dados.customerName !== undefined) {
      if (
        typeof dados.customerName !== "string" ||
        dados.customerName.trim().length < 2 ||
        dados.customerName.trim().length > 150
      ) {
        return NextResponse.json(
          { error: "Nome do cliente inválido." },
          { status: 400 }
        );
      }

      data.customerName = dados.customerName.trim();
    }

    // Empresa
    if (dados.company !== undefined) {
      const company = textoOpcional(dados.company);

      if (
        company === undefined ||
        (company && company.length > 150)
      ) {
        return NextResponse.json(
          { error: "Nome da empresa inválido." },
          { status: 400 }
        );
      }

      data.company = company;
    }

    // Telefone
    if (dados.phone !== undefined) {
      if (
        typeof dados.phone !== "string" ||
        dados.phone.trim().length < 5 ||
        dados.phone.trim().length > 40
      ) {
        return NextResponse.json(
          { error: "Contacto telefónico inválido." },
          { status: 400 }
        );
      }

      data.phone = dados.phone.trim();
    }

    // Email
    if (dados.email !== undefined) {
      const email = textoOpcional(dados.email);

      if (
        email === undefined ||
        (email && !validarEmail(email))
      ) {
        return NextResponse.json(
          { error: "Endereço de email inválido." },
          { status: 400 }
        );
      }

      data.email = email;
    }

    // Endereço
    if (dados.address !== undefined) {
      const address = textoOpcional(dados.address);

      if (
        address === undefined ||
        (address && address.length > 500)
      ) {
        return NextResponse.json(
          { error: "Endereço inválido." },
          { status: 400 }
        );
      }

      data.address = address;
    }

    // Observações
    if (dados.notes !== undefined) {
      const notes = textoOpcional(dados.notes);

      if (
        notes === undefined ||
        (notes && notes.length > 2000)
      ) {
        return NextResponse.json(
          { error: "Observações inválidas." },
          { status: 400 }
        );
      }

      data.notes = notes;
    }

    // Validade
    if (dados.validUntil !== undefined) {
      if (dados.validUntil === null || dados.validUntil === "") {
        data.validUntil = null;
      } else {
        if (typeof dados.validUntil !== "string") {
          return NextResponse.json(
            { error: "Data de validade inválida." },
            { status: 400 }
          );
        }

        const validade = new Date(dados.validUntil);

        if (
          Number.isNaN(validade.getTime()) ||
          validade.getTime() <= Date.now()
        ) {
          return NextResponse.json(
            {
              error: "A validade deve corresponder a uma data futura.",
            },
            { status: 400 }
          );
        }

        data.validUntil = validade;
      }
    }

    // Estado
    if (dados.status !== undefined) {
      if (
        typeof dados.status !== "string" ||
        !estadosPermitidos.includes(
          dados.status as QuotationStatus
        )
      ) {
        return NextResponse.json(
          { error: "Estado da cotação inválido." },
          { status: 400 }
        );
      }

      data.status = dados.status as QuotationStatus;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Não foram fornecidos dados para actualizar." },
        { status: 400 }
      );
    }

    const cotacaoActualizada =
      await prisma.quotation.update({
        where: { id },
        data,
        include: {
          items: {
            orderBy: {
              id: "asc",
            },
          },
        },
      });

    return NextResponse.json({
      message: "Cotação actualizada com sucesso.",
      quotation: cotacaoActualizada,
    });

  } catch (error) {
    console.error("Erro ao actualizar cotação:", error);

    return NextResponse.json(
      { error: "Não foi possível actualizar a cotação." },
      { status: 500 }
    );
  }
}

// DELETE — Eliminar cotação
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const cotacao = await prisma.quotation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!cotacao) {
      return NextResponse.json(
        { error: "Cotação não encontrada." },
        { status: 404 }
      );
    }

    if (
      cotacao.status === "ACEITE"
    ) {
      return NextResponse.json(
        {
          error:
            "Não é permitido eliminar uma cotação aceite.",
        },
        { status: 409 }
      );
    }

    await prisma.quotation.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Cotação eliminada com sucesso.",
    });

  } catch (error) {
    console.error("Erro ao eliminar cotação:", error);

    return NextResponse.json(
      { error: "Não foi possível eliminar a cotação." },
      { status: 500 }
    );
  }
}
