
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";
import { enviarNotificacaoEmail } from "@/lib/notificacoes-email";
import { getClientSession } from "@/lib/client-session";

interface ItemRecebido {
  productId: string;
  quantity: number;
}

type CustomerType = "INDIVIDUAL" | "COMPANY";

interface PedidoCotacao {
  customerType?: CustomerType;
  customerName?: string;
  company?: string;
  nuit?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  items: ItemRecebido[];
}

// ==========================================
// CONSTANTES
// ==========================================

// Decimal(12,2): máximo 9.999.999.999,99.
const MAX_CENTAVOS = 999_999_999_999;

// ==========================================
// CONVERTER DECIMAL PARA CENTAVOS
// ==========================================

function decimalParaCentavos(
  valor: string | number
): number {
  const texto = String(valor).trim();

  const correspondencia = texto.match(
    /^(-?)(\d+)(?:\.(\d+))?$/
  );

  if (!correspondencia) {
    throw new Error("Valor monetário inválido.");
  }

  const sinal =
    correspondencia[1] === "-" ? -1 : 1;

  const inteiro = Number(correspondencia[2]);
  const decimal = correspondencia[3] || "";

  const primeirosDigitos = (
    decimal + "00"
  ).slice(0, 2);

  const terceiroDigito = Number(
    decimal[2] || "0"
  );

  let centavos =
    inteiro * 100 + Number(primeirosDigitos);

  if (terceiroDigito >= 5) {
    centavos++;
  }

  const resultado = centavos * sinal;

  if (!Number.isSafeInteger(resultado)) {
    throw new Error(
      "Valor monetário ultrapassa o limite permitido."
    );
  }

  return resultado;
}

// ==========================================
// FORMATAR CENTAVOS
// ==========================================

function formatarDinheiro(
  centavos: number
): string {
  if (
    !Number.isSafeInteger(centavos) ||
    Math.abs(centavos) > MAX_CENTAVOS
  ) {
    throw new Error(
      "Valor monetário ultrapassa o limite permitido."
    );
  }

  return (centavos / 100).toFixed(2);
}

// ==========================================
// TEXTO OPCIONAL
// ==========================================

function textoOpcional(
  valor: unknown
): string | null {
  if (typeof valor !== "string") {
    return null;
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
// GERAR NÚMERO DA COTAÇÃO
// ==========================================

function gerarNumeroCotacao(): string {
  const ano = new Date().getFullYear();

  const codigo = randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `COT-${ano}-${codigo}`;
}

// ==========================================
// CALCULAR VALIDADE
// ==========================================

function calcularValidade(
  dataEmissao: Date
): Date {
  const validade = new Date(dataEmissao);

  validade.setDate(validade.getDate() + 5);

  return validade;
}

// ==========================================
// POST — CRIAR COTAÇÃO
// ==========================================

export async function POST(
  request: NextRequest
) {
  try {
    // ======================================
    // 1. IDENTIFICAR SESSÃO DO CLIENTE
    // ======================================

    const sessao = await getClientSession();

    let clienteAutenticado: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
    } | null = null;

    if (sessao) {
      const utilizador =
        await prisma.user.findUnique({
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
        !utilizador ||
        !utilizador.active ||
        utilizador.role !== "CLIENTE"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A sua sessão não é válida. Inicie sessão novamente.",
          },
          { status: 401 }
        );
      }

      clienteAutenticado = {
        id: utilizador.id,
        name: utilizador.name,
        phone: utilizador.phone,
        email: utilizador.email,
      };
    }

    // ======================================
    // 2. RECEBER DADOS
    // ======================================

    let dados: PedidoCotacao;

    try {
      dados = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "O conteúdo enviado não é um JSON válido.",
        },
        { status: 400 }
      );
    }

    if (
      !dados ||
      typeof dados !== "object" ||
      Array.isArray(dados)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados da cotação inválidos.",
        },
        { status: 400 }
      );
    }

    // ======================================
    // 3. VALIDAR TIPO DE CLIENTE
    // ======================================

    const customerType =
      dados.customerType === undefined
        ? "INDIVIDUAL"
        : dados.customerType;

    if (
      customerType !== "INDIVIDUAL" &&
      customerType !== "COMPANY"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de cliente inválido.",
        },
        { status: 400 }
      );
    }

    // ======================================
    // 4. OBTER DADOS DO CLIENTE
    // ======================================

    const customerName = clienteAutenticado
      ? clienteAutenticado.name.trim()
      : typeof dados.customerName === "string"
        ? dados.customerName.trim()
        : "";

    const phone =
      clienteAutenticado?.phone?.trim() ||
      (
        typeof dados.phone === "string"
          ? dados.phone.trim()
          : ""
      );

    const email = clienteAutenticado
      ? textoOpcional(clienteAutenticado.email)
      : textoOpcional(dados.email);

    const companyRecebida = textoOpcional(
      dados.company
    );

    const nuitRecebido = textoOpcional(
      dados.nuit
    );

    const company =
      customerType === "COMPANY"
        ? companyRecebida
        : null;

    const nuit =
      customerType === "COMPANY"
        ? nuitRecebido
        : null;

    const address = textoOpcional(
      dados.address
    );

    const notes = textoOpcional(
      dados.notes
    );

    // ======================================
    // 5. VALIDAR NOME
    // ======================================

    if (
      !customerName ||
      customerName.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Introduza o nome do cliente.",
        },
        { status: 400 }
      );
    }

    if (customerName.length > 150) {
      return NextResponse.json(
        {
          success: false,
          error: "O nome do cliente é demasiado longo.",
        },
        { status: 400 }
      );
    }

    // ======================================
    // 6. VALIDAR TELEFONE
    // ======================================

    if (
      !phone ||
      phone.replace(/\D/g, "").length < 9 ||
      phone.length > 40
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Introduza um contacto telefónico válido.",
        },
        { status: 400 }
      );
    }

    // ======================================
    // 7. VALIDAR EMPRESA E NUIT
    // ======================================

    if (customerType === "COMPANY") {
      if (!company) {
        return NextResponse.json(
          {
            success: false,
            error: "Introduza o nome da empresa.",
          },
          { status: 400 }
        );
      }

      if (company.length > 150) {
        return NextResponse.json(
          {
            success: false,
            error: "O nome da empresa é demasiado longo.",
          },
          { status: 400 }
        );
      }

      if (
        !nuit ||
        !/^\d{9}$/.test(nuit)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "O NUIT deve conter exactamente 9 dígitos.",
          },
          { status: 400 }
        );
      }
    }

    // ======================================
    // 8. VALIDAR EMAIL
    // ======================================

    if (
      email &&
      !validarEmail(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "O endereço de email não é válido.",
        },
        { status: 400 }
      );
    }

    // ======================================
    // 9. VALIDAR ENDEREÇO E OBSERVAÇÕES
    // ======================================

    if (
      address &&
      address.length > 500
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "O endereço é demasiado longo.",
        },
        { status: 400 }
      );
    }

    if (
      notes &&
      notes.length > 2000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "As observações não podem ultrapassar 2000 caracteres.",
        },
        { status: 400 }
      );
    }

    // ======================================
    // 10. VALIDAR PRODUTOS
    // ======================================

    if (
      !Array.isArray(dados.items) ||
      dados.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Adicione pelo menos um produto à cotação.",
        },
        { status: 400 }
      );
    }

    if (dados.items.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A cotação não pode ultrapassar 100 linhas.",
        },
        { status: 400 }
      );
    }

    const itensRecebidos: ItemRecebido[] = [];

    for (const item of dados.items) {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Existe um produto inválido na cotação.",
          },
          { status: 400 }
        );
      }

      const productId =
        typeof item.productId === "string"
          ? item.productId.trim()
          : "";

      const quantity = item.quantity;

      if (!productId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Identificador de produto inválido.",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        quantity > 100000
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A quantidade de cada produto deve ser um número inteiro positivo.",
          },
          { status: 400 }
        );
      }

      itensRecebidos.push({
        productId,
        quantity,
      });
    }

    // ======================================
    // 11. CONSULTAR PRODUTOS NA BASE DE DADOS
    // ======================================

    const productIds = [
      ...new Set(
        itensRecebidos.map(
          (item) => item.productId
        )
      ),
    ];

    const produtos =
      await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          active: true,
        },
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
          oldPrice: true,
          promotion: true,
        },
      });

    const produtosMap = new Map(
      produtos.map((produto) => [
        produto.id,
        produto,
      ])
    );

    // ======================================
    // 12. CONFIRMAR EXISTÊNCIA DOS PRODUTOS
    // ======================================

    const produtosEmFalta = productIds.filter(
      (id) => !produtosMap.has(id)
    );

    if (produtosEmFalta.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Um ou mais produtos não existem ou estão inactivos. Actualize a cotação.",
          productIds: produtosEmFalta,
        },
        { status: 400 }
      );
    }

    // ======================================
    // 13. CALCULAR PREÇOS E DESCONTOS
    // ======================================

    let subtotalOriginal = 0;
    let totalGeral = 0;

    const linhas = itensRecebidos.map(
      (item) => {
        const produto = produtosMap.get(
          item.productId
        )!;

        // Preço actual registado na base de dados.
        const precoActual = decimalParaCentavos(
          produto.price.toString()
        );

        if (
          !Number.isSafeInteger(precoActual) ||
          precoActual <= 0
        ) {
          throw new Error(
            `Preço inválido no produto ${produto.name}.`
          );
        }

        // Preço original, quando existe.
        const precoAnterior =
          produto.oldPrice !== null
            ? decimalParaCentavos(
                produto.oldPrice.toString()
              )
            : precoActual;

        // A promoção só é válida quando:
        // 1. promotion = true
        // 2. oldPrice existe
        // 3. oldPrice > price

        const temPromocao =
          produto.promotion === true &&
          produto.oldPrice !== null &&
          precoAnterior > precoActual;

        const precoOriginal = temPromocao
          ? precoAnterior
          : precoActual;

        const precoUnitario = precoActual;

        // Calcular totais da linha.
        const totalOriginalLinha =
          precoOriginal * item.quantity;

        const totalLinha =
          precoUnitario * item.quantity;

        if (
          !Number.isSafeInteger(totalOriginalLinha) ||
          !Number.isSafeInteger(totalLinha)
        ) {
          throw new Error(
            `O total do produto ${produto.name} ultrapassa o limite permitido.`
          );
        }

        subtotalOriginal += totalOriginalLinha;
        totalGeral += totalLinha;

        if (
          !Number.isSafeInteger(subtotalOriginal) ||
          !Number.isSafeInteger(totalGeral) ||
          subtotalOriginal > MAX_CENTAVOS ||
          totalGeral > MAX_CENTAVOS
        ) {
          throw new Error(
            "Os valores totais da cotação ultrapassam o limite permitido."
          );
        }

        return {
          id: randomUUID(),

          productId: produto.id,
          productName: produto.name,
          productImage: produto.image,

          quantity: item.quantity,

          // Preço promocional ou preço normal.
          unitPrice: formatarDinheiro(
            precoUnitario
          ),

          // Preço anterior à promoção.
          originalUnitPrice: formatarDinheiro(
            precoOriginal
          ),

          // Total calculado com o preço final.
          total: formatarDinheiro(
            totalLinha
          ),
        };
      }
    );

    // ======================================
    // 14. CALCULAR DESCONTO GLOBAL
    // ======================================

    const descontoTotal =
      subtotalOriginal - totalGeral;

    if (
      descontoTotal < 0 ||
      !Number.isSafeInteger(descontoTotal)
    ) {
      throw new Error(
        "Não foi possível calcular o desconto da cotação."
      );
    }

    // ======================================
    // 15. DEFINIR EMISSÃO E VALIDADE
    // ======================================

    const agora = new Date();

    const validUntil = calcularValidade(
      agora
    );

    // ======================================
    // 16. CRIAR COTAÇÃO NA BASE DE DADOS
    // ======================================

    const cotacao =
      await prisma.quotation.create({
        data: {
          id: randomUUID(),

          quoteNumber: gerarNumeroCotacao(),

          customerType,
          customerName,
          company,
          nuit,
          phone,
          email,
          address,
          notes,

          // Total final com promoções.
          total: formatarDinheiro(
            totalGeral
          ),

          // Total antes das promoções.
          subtotalOriginal: formatarDinheiro(
            subtotalOriginal
          ),

          // Desconto acumulado.
          discountTotal: formatarDinheiro(
            descontoTotal
          ),

          currency: "MZN",
          validUntil,

          status: "RASCUNHO",

          createdAt: agora,
          updatedAt: agora,

          items: {
            create: linhas,
          },
        },

        include: {
          items: true,
        },
      });

    // ======================================
    // 17. ENVIAR NOTIFICAÇÃO POR EMAIL
    // ======================================

    // A falha no envio não invalida a cotação.
    try {
      const emailEnviado =
        await enviarNotificacaoEmail({
          tipo: "NOVA COTACAO",

          referencia: cotacao.quoteNumber,

          cliente: cotacao.customerName,

          campos: [
            {
              nome: "Tipo de cliente",
              valor:
                cotacao.customerType === "COMPANY"
                  ? "Empresa"
                  : "Pessoa individual",
            },
            {
              nome: "Empresa",
              valor:
                cotacao.company || "Não indicada",
            },
            {
              nome: "NUIT",
              valor:
                cotacao.nuit || "Não indicado",
            },
            {
              nome: "Telefone",
              valor: cotacao.phone,
            },
            {
              nome: "Email",
              valor:
                cotacao.email || "Não indicado",
            },
            {
              nome: "Endereço",
              valor:
                cotacao.address || "Não indicado",
            },
            {
              nome: "Observações",
              valor:
                cotacao.notes || "Nenhuma",
            },
            {
              nome: "Subtotal original",
              valor:
                `${cotacao.subtotalOriginal.toString()} MZN`,
            },
            {
              nome: "Desconto total",
              valor:
                `${cotacao.discountTotal.toString()} MZN`,
            },
            {
              nome: "Total final",
              valor:
                `${cotacao.total.toString()} MZN`,
            },
            {
              nome: "Validade",
              valor: cotacao.validUntil
                ? new Intl.DateTimeFormat(
                    "pt-MZ",
                    {
                      timeZone: "Africa/Maputo",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  ).format(cotacao.validUntil)
                : "Não definida",
            },
            {
              nome: "Estado",
              valor: cotacao.status,
            },
          ],

          itens: cotacao.items.map(
            (item) => {
              const precoOriginal =
                item.originalUnitPrice?.toString() ??
                item.unitPrice.toString();

              const precoFinal =
                item.unitPrice.toString();

              return {
                nome: item.productName,
                quantidade: item.quantity,

                preco:
                  `${precoFinal} MZN`,

                precoOriginal:
                  `${precoOriginal} MZN`,

                total:
                  `${item.total.toString()} MZN`,
              };
            }
          ),
        });

      if (!emailEnviado) {
        console.error(
          `A cotação ${cotacao.quoteNumber} foi criada, mas a notificação não foi enviada.`
        );
      }
    } catch (emailError) {
      console.error(
        "ERRO AO ENVIAR NOTIFICAÇÃO DA COTAÇÃO:",
        emailError
      );
    }

    // ======================================
    // 18. RESPOSTA DE SUCESSO
    // ======================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Cotação criada com sucesso.",

        quotation: cotacao,

        resumo: {
          subtotalOriginal:
            cotacao.subtotalOriginal.toString(),

          descontoTotal:
            cotacao.discountTotal.toString(),

          total:
            cotacao.total.toString(),

          currency: "MZN",
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // ======================================
    // 19. TRATAMENTO DE ERROS
    // ======================================

    console.error(
      "ERRO AO CRIAR COTAÇÃO:"
    );

    if (error instanceof Error) {
      console.error(
        "Mensagem:",
        error.message
      );

      console.error(
        "Stack:",
        error.stack
      );
    }

    const prismaError = error as {
      code?: string;
      meta?: unknown;
      cause?: unknown;
      clientVersion?: string;
    };

    console.error(
      "DETALHES DO PRISMA:",
      {
        code: prismaError.code,
        meta: prismaError.meta,
        cause: prismaError.cause,
        clientVersion:
          prismaError.clientVersion,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Não foi possível criar a cotação.",
      },
      { status: 500 }
    );
  }
}
