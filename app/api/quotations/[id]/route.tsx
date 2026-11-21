
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

// ==========================================
// RESPOSTAS DE ERRO
// ==========================================

function erro(
  mensagem: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      error: mensagem,
    },
    { status }
  );
}

// ==========================================
// TEXTO OPCIONAL
// ==========================================

function textoOpcional(
  valor: unknown
): string | null | undefined {
  if (valor === undefined) return undefined;
  if (valor === null) return null;

  if (typeof valor !== "string") {
    return undefined;
  }

  const resultado = valor.trim();

  return resultado || null;
}

// ==========================================
// VALIDAR EMAIL
// ==========================================

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================
// VALIDAR IDENTIFICADOR
// ==========================================

function validarId(id: string): boolean {
  return (
    typeof id === "string" &&
    id.trim().length > 0 &&
    id.length <= 100
  );
}

// ==========================================
// CAMPOS FINANCEIROS PROTEGIDOS
// ==========================================

const camposFinanceirosProtegidos = [
  "total",
  "subtotalOriginal",
  "discountTotal",
  "currency",
  "items",
  "validUntil",
];

// ==========================================
// GET — CONSULTAR COTAÇÃO
// ==========================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!validarId(id)) {
      return erro(
        "Identificador da cotação inválido.",
        400
      );
    }

    const cotacao =
      await prisma.quotation.findUnique({
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
      return erro(
        "Cotação não encontrada.",
        404
      );
    }

    // ======================================
    // RESUMO FINANCEIRO
    // ======================================

    return NextResponse.json({
      success: true,

      quotation: cotacao,

      resumo: {
        subtotalOriginal:
          cotacao.subtotalOriginal.toString(),

        descontoTotal:
          cotacao.discountTotal.toString(),

        total:
          cotacao.total.toString(),

        currency: cotacao.currency,

        quantidadeItens:
          cotacao.items.reduce(
            (soma, item) =>
              soma + item.quantity,
            0
          ),
      },
    });
  } catch (error) {
    console.error(
      "Erro ao consultar cotação:",
      error
    );

    return erro(
      "Não foi possível consultar a cotação.",
      500
    );
  }
}

// ==========================================
// PATCH — ACTUALIZAR COTAÇÃO
// ==========================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!validarId(id)) {
      return erro(
        "Identificador da cotação inválido.",
        400
      );
    }

    // ======================================
    // 1. VERIFICAR EXISTÊNCIA
    // ======================================

    const cotacaoExistente =
      await prisma.quotation.findUnique({
        where: { id },

        select: {
          id: true,
          status: true,
          customerType: true,
        },
      });

    if (!cotacaoExistente) {
      return erro(
        "Cotação não encontrada.",
        404
      );
    }

    // ======================================
    // 2. RECEBER DADOS
    // ======================================

    let dados: Record<string, unknown>;

    try {
      dados = await request.json();
    } catch {
      return erro(
        "Dados enviados inválidos.",
        400
      );
    }

    if (
      !dados ||
      typeof dados !== "object" ||
      Array.isArray(dados)
    ) {
      return erro(
        "Dados enviados inválidos.",
        400
      );
    }

    // ======================================
    // 3. PROTEGER CAMPOS FINANCEIROS
    // ======================================

    const campoFinanceiroEnviado =
      camposFinanceirosProtegidos.find(
        (campo) =>
          Object.prototype.hasOwnProperty.call(
            dados,
            campo
          )
      );

    if (campoFinanceiroEnviado) {
      return erro(
        `O campo ${campoFinanceiroEnviado} não pode ser alterado directamente.`,
        400
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        dados,
        "originalUnitPrice"
      )
    ) {
      return erro(
        "Os preços históricos dos produtos não podem ser alterados.",
        400
      );
    }

    // ======================================
    // 4. PREPARAR ACTUALIZAÇÃO
    // ======================================

    const data: {
      customerName?: string;
      company?: string | null;
      phone?: string;
      email?: string | null;
      address?: string | null;
      notes?: string | null;
      status?: QuotationStatus;
    } = {};

    // ======================================
    // 5. NOME DO CLIENTE
    // ======================================

    if (dados.customerName !== undefined) {
      if (
        typeof dados.customerName !== "string" ||
        dados.customerName.trim().length < 2 ||
        dados.customerName.trim().length > 150
      ) {
        return erro(
          "Nome do cliente inválido.",
          400
        );
      }

      data.customerName =
        dados.customerName.trim();
    }

    // ======================================
    // 6. EMPRESA
    // ======================================

    if (dados.company !== undefined) {
      const company = textoOpcional(
        dados.company
      );

      if (
        company === undefined ||
        (company && company.length > 150)
      ) {
        return erro(
          "Nome da empresa inválido.",
          400
        );
      }

      data.company = company;
    }

    // ======================================
    // 7. TELEFONE
    // ======================================

    if (dados.phone !== undefined) {
      if (
        typeof dados.phone !== "string" ||
        dados.phone.trim().replace(/\D/g, "").length < 9 ||
        dados.phone.trim().length > 40
      ) {
        return erro(
          "Contacto telefónico inválido.",
          400
        );
      }

      data.phone = dados.phone.trim();
    }

    // ======================================
    // 8. EMAIL
    // ======================================

    if (dados.email !== undefined) {
      const email = textoOpcional(
        dados.email
      );

      if (
        email === undefined ||
        (email && !validarEmail(email))
      ) {
        return erro(
          "Endereço de email inválido.",
          400
        );
      }

      data.email = email;
    }

    // ======================================
    // 9. ENDEREÇO
    // ======================================

    if (dados.address !== undefined) {
      const address = textoOpcional(
        dados.address
      );

      if (
        address === undefined ||
        (address && address.length > 500)
      ) {
        return erro(
          "Endereço inválido.",
          400
        );
      }

      data.address = address;
    }

    // ======================================
    // 10. OBSERVAÇÕES
    // ======================================

    if (dados.notes !== undefined) {
      const notes = textoOpcional(
        dados.notes
      );

      if (
        notes === undefined ||
        (notes && notes.length > 2000)
      ) {
        return erro(
          "Observações inválidas.",
          400
        );
      }

      data.notes = notes;
    }

    // ======================================
    // 11. TIPO DE CLIENTE
    // ======================================

    if (dados.customerType !== undefined) {
      if (
        dados.customerType !== "INDIVIDUAL" &&
        dados.customerType !== "COMPANY"
      ) {
        return erro(
          "Tipo de cliente inválido.",
          400
        );
      }

      if (
        dados.customerType !==
        cotacaoExistente.customerType
      ) {
        return erro(
          "O tipo de cliente não pode ser alterado nesta cotação.",
          400
        );
      }
    }

    // ======================================
    // 12. NUIT
    // ======================================

    if (dados.nuit !== undefined) {
      const nuit = textoOpcional(
        dados.nuit
      );

      if (
        nuit === undefined ||
        (
          nuit !== null &&
          !/^\d{9}$/.test(nuit)
        )
      ) {
        return erro(
          "NUIT inválido. Deve conter exactamente 9 dígitos.",
          400
        );
      }

      if (
        cotacaoExistente.customerType === "COMPANY" &&
        nuit === null
      ) {
        return erro(
          "O NUIT é obrigatório para clientes empresariais.",
          400
        );
      }

      return erro(
        "O NUIT não pode ser alterado directamente nesta cotação.",
        400
      );
    }

    // ======================================
    // 13. VALIDADE AUTOMÁTICA
    // ======================================

    if (dados.validUntil !== undefined) {
      return erro(
        "A validade da cotação é automática e corresponde a 5 dias após a emissão.",
        400
      );
    }

    // ======================================
    // 14. ESTADO
    // ======================================

    if (dados.status !== undefined) {
      if (
        typeof dados.status !== "string" ||
        !estadosPermitidos.includes(
          dados.status as QuotationStatus
        )
      ) {
        return erro(
          "Estado da cotação inválido.",
          400
        );
      }

      data.status =
        dados.status as QuotationStatus;
    }

    // ======================================
    // 15. VERIFICAR SE EXISTEM ALTERAÇÕES
    // ======================================

    if (Object.keys(data).length === 0) {
      return erro(
        "Não foram fornecidos dados para actualizar.",
        400
      );
    }

    // ======================================
    // 16. ACTUALIZAR COTAÇÃO
    // ======================================

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

    // ======================================
    // 17. RESPOSTA
    // ======================================

    return NextResponse.json({
      success: true,

      message:
        "Cotação actualizada com sucesso.",

      quotation: cotacaoActualizada,

      resumo: {
        subtotalOriginal:
          cotacaoActualizada.subtotalOriginal.toString(),

        descontoTotal:
          cotacaoActualizada.discountTotal.toString(),

        total:
          cotacaoActualizada.total.toString(),

        currency:
          cotacaoActualizada.currency,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao actualizar cotação:",
      error
    );

    return erro(
      "Não foi possível actualizar a cotação.",
      500
    );
  }
}

// ==========================================
// DELETE — ELIMINAR COTAÇÃO
// ==========================================

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!validarId(id)) {
      return erro(
        "Identificador da cotação inválido.",
        400
      );
    }

    // ======================================
    // 1. CONSULTAR COTAÇÃO
    // ======================================

    const cotacao =
      await prisma.quotation.findUnique({
        where: { id },

        select: {
          id: true,
          status: true,
        },
      });

    if (!cotacao) {
      return erro(
        "Cotação não encontrada.",
        404
      );
    }

    // ======================================
    // 2. PROTEGER COTAÇÕES ACEITES
    // ======================================

    if (cotacao.status === "ACEITE") {
      return erro(
        "Não é permitido eliminar uma cotação aceite.",
        409
      );
    }

    // ======================================
    // 3. ELIMINAR COTAÇÃO
    // ======================================

    await prisma.quotation.delete({
      where: { id },
    });

    // ======================================
    // 4. RESPOSTA
    // ======================================

    return NextResponse.json({
      success: true,

      message:
        "Cotação eliminada com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao eliminar cotação:",
      error
    );

    return erro(
      "Não foi possível eliminar a cotação.",
      500
    );
  }
}
