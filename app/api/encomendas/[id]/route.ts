
import { NextRequest, NextResponse } from "next/server";
import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// =====================================================
// CONFIGURAÇÕES
// =====================================================

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const ESTADOS_VALIDOS = [
  "PENDENTE",
  "CONFIRMADA",
  "EM_PREPARACAO",
  "ENVIADA",
  "ENTREGUE",
  "CANCELADA",
] as const;

type EstadoEncomenda = (typeof ESTADOS_VALIDOS)[number];

type SessaoGestor = {
  email: string;
  expiresAt: number;
};

// =====================================================
// RESPOSTAS HTTP
// =====================================================

function resposta(
  dados: unknown,
  status = 200
) {
  return NextResponse.json(dados, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

// =====================================================
// AUTENTICAÇÃO DO GESTOR
// =====================================================

function validarSessaoGestor(
  request: NextRequest
): SessaoGestor | null {
  try {
    const secret = process.env.AUTH_SECRET;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!secret || !adminEmail) {
      return null;
    }

    const token = request.cookies.get(
      "msw_admin_session"
    )?.value;

    if (!token) {
      return null;
    }

    const partes = token.split(".");

    if (partes.length !== 2) {
      return null;
    }

    const [payload, assinaturaRecebida] = partes;

    if (!payload || !assinaturaRecebida) {
      return null;
    }

    const assinaturaEsperada = createHmac(
      "sha256",
      secret
    )
      .update(payload)
      .digest("base64url");

    const assinaturaEsperadaBuffer = Buffer.from(
      assinaturaEsperada
    );

    const assinaturaRecebidaBuffer = Buffer.from(
      assinaturaRecebida
    );

    if (
      assinaturaEsperadaBuffer.length !==
      assinaturaRecebidaBuffer.length
    ) {
      return null;
    }

    if (
      !timingSafeEqual(
        assinaturaEsperadaBuffer,
        assinaturaRecebidaBuffer
      )
    ) {
      return null;
    }

    const dados = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<SessaoGestor>;

    if (
      typeof dados.email !== "string" ||
      typeof dados.expiresAt !== "number"
    ) {
      return null;
    }

    if (
      dados.email.toLowerCase() !==
      adminEmail.toLowerCase()
    ) {
      return null;
    }

    if (dados.expiresAt <= Date.now()) {
      return null;
    }

    return {
      email: dados.email,
      expiresAt: dados.expiresAt,
    };
  } catch {
    return null;
  }
}

function exigirGestor(request: NextRequest) {
  const sessao = validarSessaoGestor(request);

  if (!sessao) {
    return resposta(
      {
        sucesso: false,
        mensagem: "Acesso não autorizado.",
      },
      401
    );
  }

  return null;
}

// =====================================================
// CÁLCULO FINANCEIRO
// =====================================================

function calcularDadosFinanceiros(
  items: Array<{
    id: string;
    productId: string | null;
    productName: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    originalUnitPrice: Prisma.Decimal | null;
    total: Prisma.Decimal;
  }>
) {
  let subtotalOriginal = new Prisma.Decimal(0);
  let subtotalComDesconto = new Prisma.Decimal(0);
  let descontoTotal = new Prisma.Decimal(0);

  const produtos = items.map((item) => {
    const precoActual = new Prisma.Decimal(
      item.unitPrice
    );

    // Compatibilidade com encomendas antigas.
    const precoOriginal = new Prisma.Decimal(
      item.originalUnitPrice ?? item.unitPrice
    );

    const totalActual = new Prisma.Decimal(
      item.total
    );

    const totalOriginal = precoOriginal.mul(
      item.quantity
    );

    const desconto = Prisma.Decimal.max(
      totalOriginal.sub(totalActual),
      0
    );

    subtotalOriginal = subtotalOriginal.add(
      totalOriginal
    );

    subtotalComDesconto = subtotalComDesconto.add(
      totalActual
    );

    descontoTotal = descontoTotal.add(
      desconto
    );

    return {
      id: item.id,
      productId: item.productId,
      nome: item.productName,
      quantidade: item.quantity,

      preco: precoActual.toNumber(),

      precoOriginal: precoOriginal.toNumber(),

      total: totalActual.toNumber(),

      totalOriginal: totalOriginal.toNumber(),

      desconto: desconto.toNumber(),
    };
  });

  return {
    produtos,

    subtotalOriginal: subtotalOriginal.toNumber(),

    subtotalComDesconto:
      subtotalComDesconto.toNumber(),

    descontoTotal: descontoTotal.toNumber(),
  };
}

// =====================================================
// FORMATAR ENCOMENDA
// =====================================================

type EncomendaComItens = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;

function formatarEncomenda(
  encomenda: EncomendaComItens
) {
  const financeiro = calcularDadosFinanceiros(
    encomenda.items
  );

  const taxaEntrega = new Prisma.Decimal(
    encomenda.deliveryFee
  );

  const total = new Prisma.Decimal(
    encomenda.total
  );

  return {
    id: encomenda.id,

    referencia: encomenda.orderNumber,

    cliente: {
      tipo: encomenda.customerType,

      nome: encomenda.customerName,

      empresa: encomenda.company,

      nuit: encomenda.nuit,

      telefone: encomenda.phone,

      email: encomenda.email,

      endereco: encomenda.address,

      distrito: encomenda.district,
    },

    observacoes: encomenda.notes,

    // Valores financeiros.
    subtotalOriginal: financeiro.subtotalOriginal,

    subtotalComDesconto:
      financeiro.subtotalComDesconto,

    descontoTotal: financeiro.descontoTotal,

    taxaEntrega: taxaEntrega.toNumber(),

    entrega: taxaEntrega.toNumber(),

    // Total guardado na base de dados.
    total: total.toNumber(),

    estado: encomenda.status,

    produtos: financeiro.produtos,

    data: encomenda.createdAt,

    dataAtualizacao: encomenda.updatedAt,
  };
}

// =====================================================
// GET - CONSULTAR ENCOMENDA
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const erroAutenticacao = exigirGestor(request);

  if (erroAutenticacao) {
    return erroAutenticacao;
  }

  try {
    const { id } = await params;

    if (!id?.trim()) {
      return resposta(
        {
          sucesso: false,
          mensagem: "Identificador da encomenda inválido.",
        },
        400
      );
    }

    const encomenda = await prisma.order.findUnique({
      where: {
        id,
      },

      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!encomenda) {
      return resposta(
        {
          sucesso: false,
          mensagem: "Encomenda não encontrada.",
        },
        404
      );
    }

    return resposta({
      sucesso: true,
      encomenda: formatarEncomenda(encomenda),
    });
  } catch (error) {
    console.error(
      "Erro ao consultar encomenda:",
      error
    );

    return resposta(
      {
        sucesso: false,
        mensagem: "Não foi possível consultar a encomenda.",
      },
      500
    );
  }
}

// =====================================================
// PATCH - ACTUALIZAR ESTADO DA ENCOMENDA
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const erroAutenticacao = exigirGestor(request);

  if (erroAutenticacao) {
    return erroAutenticacao;
  }

  try {
    const { id } = await params;

    if (!id?.trim()) {
      return resposta(
        {
          sucesso: false,
          mensagem: "Identificador da encomenda inválido.",
        },
        400
      );
    }

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("estado" in body)
    ) {
      return resposta(
        {
          sucesso: false,
          mensagem: "O estado da encomenda é obrigatório.",
        },
        400
      );
    }

    const estadoRecebido = (
      body as { estado: unknown }
    ).estado;

    if (
      typeof estadoRecebido !== "string" ||
      !ESTADOS_VALIDOS.includes(
        estadoRecebido as EstadoEncomenda
      )
    ) {
      return resposta(
        {
          sucesso: false,
          mensagem: "Estado da encomenda inválido.",
          estadosValidos: ESTADOS_VALIDOS,
        },
        400
      );
    }

    const novoEstado =
      estadoRecebido as EstadoEncomenda;

    const resultado = await prisma.$transaction(
      async (tx) => {
        const encomendaAtual =
          await tx.order.findUnique({
            where: {
              id,
            },
          });

        if (!encomendaAtual) {
          throw new Error("ENCOMENDA_NAO_ENCONTRADA");
        }

        if (encomendaAtual.status === "CANCELADA") {
          throw new Error("ENCOMENDA_JA_CANCELADA");
        }

        const encomendaAtualizada =
          await tx.order.update({
            where: {
              id,
            },

            data: {
              status: novoEstado,
            },

            include: {
              items: {
                orderBy: {
                  id: "asc",
                },
              },
            },
          });

        return encomendaAtualizada;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return resposta({
      sucesso: true,

      mensagem: "Estado da encomenda actualizado com sucesso.",

      encomenda: formatarEncomenda(resultado),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ENCOMENDA_NAO_ENCONTRADA"
    ) {
      return resposta(
        {
          sucesso: false,
          mensagem: "Encomenda não encontrada.",
        },
        404
      );
    }

    if (
      error instanceof Error &&
      error.message === "ENCOMENDA_JA_CANCELADA"
    ) {
      return resposta(
        {
          sucesso: false,
          mensagem: "Não é possível alterar uma encomenda cancelada.",
        },
        409
      );
    }

    console.error(
      "Erro ao actualizar encomenda:",
      error
    );

    return resposta(
      {
        sucesso: false,
        mensagem: "Não foi possível actualizar a encomenda.",
      },
      500
    );
  }
}
