
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { randomBytes } from "node:crypto";
import { enviarNotificacaoEmail } from "@/lib/notificacoes-email";
import { getClientSession } from "@/lib/client-session";

type CustomerType = "INDIVIDUAL" | "COMPANY";
type ZonaEntrega = "MAPUTO" | "MATOLA";

interface EncomendaItem {
  productId: string;
  quantity: number;
}

interface EncomendaBody {
  customerType?: CustomerType;
  customerName?: string;
  company?: string | null;
  nuit?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  notes?: string;
  items?: EncomendaItem[];
}

const TAXAS_ENTREGA: Record<ZonaEntrega, number> = {
  MAPUTO: 400,
  MATOLA: 900,
};

function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

function gerarReferencia(): string {
  const ano = new Date().getFullYear();
  const codigo = randomBytes(4).toString("hex").toUpperCase();

  return `MSW-${ano}-${codigo}`;
}

function decimalParaNumero(valor: Prisma.Decimal): number {
  return Number(valor.toString());
}

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json(
    { success: false, error: mensagem },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

// =====================================================
// GET — PESQUISAR CLIENTE OU CARREGAR DADOS DA CONTA
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const sessao = await getClientSession();

    if (sessao) {
      const utilizador = await prisma.user.findUnique({
        where: { id: sessao.userId },
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
        utilizador &&
        utilizador.active &&
        utilizador.role === "CLIENTE"
      ) {
        const telefoneConta = utilizador.phone
          ? normalizarTelefone(utilizador.phone)
          : "";

        const ultimaEncomenda = telefoneConta
          ? await prisma.order.findFirst({
              where: {
                OR: [
                  { phone: telefoneConta },
                  { phone: utilizador.phone! },
                ],
                address: { not: "A combinar" },
              },
              orderBy: { createdAt: "desc" },
            })
          : null;

        return NextResponse.json(
          {
            success: true,
            autenticado: true,
            encontrado: true,
            telefoneEmFalta: !telefoneConta,
            cliente: {
              nome: utilizador.name || "",
              telefone: utilizador.phone || "",
              email: utilizador.email || "",
              endereco: ultimaEncomenda?.address || "",
              customerType:
                ultimaEncomenda?.customerType || "INDIVIDUAL",
              empresa: ultimaEncomenda?.company || "",
              nuit: ultimaEncomenda?.nuit || "",
            },
          },
          {
            headers: { "Cache-Control": "no-store" },
          }
        );
      }
    }

    const telefoneOriginal =
      request.nextUrl.searchParams.get("phone")?.trim() || "";

    const telefone = normalizarTelefone(telefoneOriginal);

    if (telefone.length < 9) {
      return respostaErro(
        "Introduza um número de telefone válido.",
        400
      );
    }

    const cliente = await prisma.order.findFirst({
      where: {
        OR: [
          { phone: telefone },
          { phone: telefoneOriginal },
        ],
      },
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

    if (!cliente) {
      return NextResponse.json(
        {
          success: true,
          autenticado: false,
          encontrado: false,
          cliente: null,
        },
        {
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        autenticado: false,
        encontrado: true,
        cliente: {
          customerType: cliente.customerType,
          nome: cliente.customerName,
          empresa: cliente.company || "",
          nuit: cliente.nuit || "",
          telefone: cliente.phone,
          email: cliente.email || "",
          endereco: cliente.address,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("ERRO AO PESQUISAR CLIENTE:", error);

    return respostaErro(
      "Não foi possível pesquisar o cliente.",
      500
    );
  }
}

// =====================================================
// POST — REGISTAR NOVA ENCOMENDA
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EncomendaBody;
    const sessao = await getClientSession();

    const utilizador = sessao
      ? await prisma.user.findUnique({
          where: { id: sessao.userId },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            active: true,
          },
        })
      : null;

    const clienteAutenticado =
      utilizador &&
      utilizador.active &&
      utilizador.role === "CLIENTE"
        ? utilizador
        : null;

    // -------------------------------------------------
    // 1. VALIDAR DADOS DO CLIENTE
    // -------------------------------------------------

    const customerType: CustomerType =
      body.customerType || "INDIVIDUAL";

    if (
      customerType !== "INDIVIDUAL" &&
      customerType !== "COMPANY"
    ) {
      return respostaErro("Tipo de cliente inválido.", 400);
    }

    const nome = (
      clienteAutenticado?.name ||
      body.customerName ||
      ""
    ).trim();

    const empresa = body.company?.trim() || "";
    const nuit = body.nuit?.replace(/\D/g, "") || "";

    const telefoneOriginal = (
      clienteAutenticado?.phone ||
      body.phone ||
      ""
    ).trim();

    const telefone = normalizarTelefone(telefoneOriginal);
    const endereco = body.address?.trim() || "";

    const email = (
      clienteAutenticado?.email ||
      body.email ||
      ""
    ).trim();

    if (!nome || telefone.length < 9 || !endereco) {
      return respostaErro(
        "Preencha o nome, telefone e endereço.",
        400
      );
    }

    if (customerType === "COMPANY") {
      if (!empresa) {
        return respostaErro(
          "Introduza o nome da empresa.",
          400
        );
      }

      if (!/^\d{9}$/.test(nuit)) {
        return respostaErro(
          "O NUIT deve conter exactamente 9 dígitos.",
          400
        );
      }
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return respostaErro(
        "Introduza um endereço de e-mail válido.",
        400
      );
    }

    // -------------------------------------------------
    // 2. VALIDAR ZONA E CALCULAR TAXA DE ENTREGA
    // -------------------------------------------------

    const distritoRecebido =
      body.district?.trim().toUpperCase() || "";

    if (
      distritoRecebido &&
      distritoRecebido !== "MAPUTO" &&
      distritoRecebido !== "MATOLA"
    ) {
      return respostaErro(
        "A zona de entrega seleccionada é inválida.",
        400
      );
    }

    const distrito: ZonaEntrega | null =
      distritoRecebido === "MAPUTO" ||
      distritoRecebido === "MATOLA"
        ? distritoRecebido
        : null;

    // A taxa é sempre determinada pelo servidor.
    const taxaEntregaNumero = distrito
      ? TAXAS_ENTREGA[distrito]
      : 0;

    const deliveryFee = new Prisma.Decimal(
      taxaEntregaNumero
    );

    // -------------------------------------------------
    // 3. ASSOCIAR TELEFONE À CONTA
    // -------------------------------------------------

    if (
      clienteAutenticado &&
      !clienteAutenticado.phone
    ) {
      const telefoneEmUso = await prisma.user.findFirst({
        where: {
          phone: telefone,
          id: { not: clienteAutenticado.id },
        },
        select: { id: true },
      });

      if (telefoneEmUso) {
        return respostaErro(
          "Este número de telefone já está associado a outra conta.",
          409
        );
      }
    }

    const company =
      customerType === "COMPANY" ? empresa : null;

    const nuitFinal =
      customerType === "COMPANY" ? nuit : null;

    // -------------------------------------------------
    // 4. VALIDAR PRODUTOS
    // -------------------------------------------------

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return respostaErro(
        "A encomenda deve conter pelo menos um produto.",
        400
      );
    }

    // -------------------------------------------------
    // 5. AGRUPAR QUANTIDADES
    // -------------------------------------------------

    const quantidades = new Map<string, number>();

    for (const item of body.items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !item.productId.trim() ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return respostaErro(
          "Existem produtos ou quantidades inválidas.",
          400
        );
      }

      const productId = item.productId.trim();

      const quantidade =
        (quantidades.get(productId) ?? 0) + item.quantity;

      if (quantidade > 10000) {
        return respostaErro(
          "Quantidade solicitada demasiado elevada.",
          400
        );
      }

      quantidades.set(productId, quantidade);
    }

    if (quantidades.size > 100) {
      return respostaErro(
        "A encomenda contém demasiados produtos diferentes.",
        400
      );
    }

    const ids = [...quantidades.keys()];

    // -------------------------------------------------
    // 6. CRIAR ENCOMENDA COM TRANSACÇÃO
    // -------------------------------------------------

    const encomenda = await prisma.$transaction(
      async (tx) => {
        if (
          clienteAutenticado &&
          !clienteAutenticado.phone
        ) {
          await tx.user.update({
            where: { id: clienteAutenticado.id },
            data: { phone: telefone },
          });
        }

        const produtos = await tx.product.findMany({
          where: {
            id: { in: ids },
            active: true,
          },
        });

        if (produtos.length !== ids.length) {
          throw new Error("PRODUTO_INDISPONIVEL");
        }

        // -------------------------------------------------
        // 7. CALCULAR PREÇOS E DESCONTOS
        // -------------------------------------------------

        const linhas = produtos.map((produto) => {
          const quantity = quantidades.get(produto.id)!;

          if (!produto.inStock) {
            throw new Error(
              `PRODUTO_INDISPONIVEL:${produto.name}`
            );
          }

          const unitPrice = new Prisma.Decimal(
            produto.price
          );

          const precoAntigo =
            produto.oldPrice !== null
              ? new Prisma.Decimal(produto.oldPrice)
              : null;

          const temPromocao =
            produto.promotion === true &&
            precoAntigo !== null &&
            precoAntigo.greaterThan(unitPrice);

          const originalUnitPrice = temPromocao
            ? precoAntigo!
            : unitPrice;

          const total = unitPrice.mul(quantity);
          const originalTotal =
            originalUnitPrice.mul(quantity);

          return {
            productId: produto.id,
            productName: produto.name,
            quantity,
            unitPrice,
            originalUnitPrice,
            total,
            originalTotal,
          };
        });

        // -------------------------------------------------
        // 8. RESUMO FINANCEIRO
        // -------------------------------------------------

        const totalProdutos = linhas.reduce(
          (soma, item) => soma.add(item.total),
          new Prisma.Decimal(0)
        );

        const subtotalOriginal = linhas.reduce(
          (soma, item) => soma.add(item.originalTotal),
          new Prisma.Decimal(0)
        );

        const descontoTotal =
          subtotalOriginal.sub(totalProdutos);

        // Total geral = produtos com desconto + entrega.
        const total = totalProdutos.add(deliveryFee);

        // -------------------------------------------------
        // 9. REGISTAR NA BASE DE DADOS
        // -------------------------------------------------

        const novaEncomenda = await tx.order.create({
          data: {
            orderNumber: gerarReferencia(),

            customerType,
            customerName: nome,
            company,
            nuit: nuitFinal,

            phone: telefone,
            email: email || null,

            address: endereco,
            district: distrito,
            notes: body.notes?.trim() || null,

            deliveryFee,
            total,

            items: {
              create: linhas.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                originalUnitPrice: item.originalUnitPrice,
                total: item.total,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        return {
          ...novaEncomenda,
          subtotalOriginal,
          descontoTotal,
          totalProdutos,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 20000,
      }
    );

    // -------------------------------------------------
    // 10. ENVIAR NOTIFICAÇÃO POR EMAIL
    // -------------------------------------------------

    try {
      const emailEnviado = await enviarNotificacaoEmail({
        tipo: "NOVA ENCOMENDA",
        referencia: encomenda.orderNumber,
        cliente: encomenda.customerName,

        campos: [
          {
            nome: "Tipo de cliente",
            valor:
              encomenda.customerType === "COMPANY"
                ? "Empresa"
                : "Pessoa individual",
          },
          ...(encomenda.customerType === "COMPANY"
            ? [
                {
                  nome: "Empresa",
                  valor: encomenda.company || "Não indicado",
                },
                {
                  nome: "NUIT",
                  valor: encomenda.nuit || "Não indicado",
                },
              ]
            : []),
          {
            nome: "Telefone",
            valor: encomenda.phone,
          },
          {
            nome: "Email",
            valor: encomenda.email || "Não indicado",
          },
          {
            nome: "Endereço",
            valor: encomenda.address,
          },
          {
            nome: "Distrito",
            valor: encomenda.district || "Não indicado",
          },
          {
            nome: "Observações",
            valor: encomenda.notes || "Nenhuma",
          },
          {
            nome: "Valor sem desconto",
            valor: `${encomenda.subtotalOriginal.toFixed(2)} MZN`,
          },
          {
            nome: "Desconto total",
            valor: `${encomenda.descontoTotal.toFixed(2)} MZN`,
          },
          {
            nome: "Subtotal com desconto",
            valor: `${encomenda.totalProdutos.toFixed(2)} MZN`,
          },
          {
            nome: "Entrega",
            valor: `${encomenda.deliveryFee.toString()} MZN`,
          },
          {
            nome: "Total a pagar",
            valor: `${encomenda.total.toString()} MZN`,
          },
        ],

        itens: encomenda.items.map((item) => {
          const precoOriginal =
            item.originalUnitPrice ?? item.unitPrice;

          const totalOriginal =
            precoOriginal.mul(item.quantity);

          const desconto = totalOriginal.sub(item.total);

          return {
            nome: item.productName,
            quantidade: item.quantity,
            preco: `${item.unitPrice.toString()} MZN`,
            total: `${item.total.toString()} MZN`,
            precoOriginal: `${precoOriginal.toString()} MZN`,
            desconto: `${desconto.toString()} MZN`,
          };
        }),
      });

      if (!emailEnviado) {
        console.error(
          `A encomenda ${encomenda.orderNumber} foi registada, mas a notificação não foi enviada.`
        );
      }
    } catch (emailError) {
      console.error(
        "ERRO AO ENVIAR NOTIFICAÇÃO DA ENCOMENDA:",
        emailError
      );
    }

    // -------------------------------------------------
    // 11. PREPARAR PRODUTOS PARA O PDF
    // -------------------------------------------------

    const produtosPDF = encomenda.items.map((item) => {
      const precoOriginal =
        item.originalUnitPrice ?? item.unitPrice;

      const totalOriginal =
        precoOriginal.mul(item.quantity);

      const desconto = totalOriginal.sub(item.total);

      return {
        nome: item.productName,
        quantidade: item.quantity,
        preco: decimalParaNumero(item.unitPrice),
        precoOriginal: decimalParaNumero(precoOriginal),
        total: decimalParaNumero(item.total),
        totalOriginal: decimalParaNumero(totalOriginal),
        desconto: decimalParaNumero(desconto),
      };
    });

    // -------------------------------------------------
    // 12. RESPOSTA DE SUCESSO
    // -------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        orderNumber: encomenda.orderNumber,

        subtotalComDesconto: decimalParaNumero(
          encomenda.totalProdutos
        ),

        entrega: decimalParaNumero(
          encomenda.deliveryFee
        ),

        total: decimalParaNumero(encomenda.total),

        encomenda: {
          id: encomenda.id,
          orderNumber: encomenda.orderNumber,
          referencia: encomenda.orderNumber,

          customerType: encomenda.customerType,
          cliente: encomenda.customerName,
          empresa: encomenda.company,
          nuit: encomenda.nuit,

          telefone: encomenda.phone,
          email: encomenda.email,

          endereco: encomenda.address,
          distrito: encomenda.district,
          observacoes: encomenda.notes,

          subtotalOriginal: decimalParaNumero(
            encomenda.subtotalOriginal
          ),

          descontoTotal: decimalParaNumero(
            encomenda.descontoTotal
          ),

          subtotalComDesconto: decimalParaNumero(
            encomenda.totalProdutos
          ),

          entrega: decimalParaNumero(
            encomenda.deliveryFee
          ),

          taxaEntrega: decimalParaNumero(
            encomenda.deliveryFee
          ),

          total: decimalParaNumero(encomenda.total),

          estado: encomenda.status,
          produtos: produtosPDF,
          data: encomenda.createdAt,
        },
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (
        error.message === "PRODUTO_INDISPONIVEL" ||
        error.message.startsWith("PRODUTO_INDISPONIVEL:")
      )
    ) {
      return respostaErro(
        "Um ou mais produtos já não estão disponíveis.",
        409
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return respostaErro(
        "Conflito ao processar a encomenda. Tente novamente.",
        409
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return respostaErro(
        "Este número de telefone já está associado a outra conta.",
        409
      );
    }

    console.error("ERRO AO REGISTAR ENCOMENDA:", error);

    return respostaErro(
      "Não foi possível registar a encomenda.",
      500
    );
  }
}
