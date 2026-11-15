
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";
import { enviarNotificacaoEmail } from "@/lib/notificacoes-email";

interface ItemRecebido {
  productId: string;
  quantity: number;
}

type CustomerType = "INDIVIDUAL" | "COMPANY";

interface PedidoCotacao {
  customerType?: CustomerType;
  customerName: string;
  company?: string;
  nuit?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  items: ItemRecebido[];
}

// Converter valores decimais para centavos.
function decimalParaCentavos(valor: string | number): number {
  const texto = String(valor).trim();
  const correspondencia = texto.match(/^(-?)(\d+)(?:\.(\d+))?$/);

  if (!correspondencia) {
    throw new Error("Valor monetário inválido.");
  }

  const sinal = correspondencia[1] === "-" ? -1 : 1;
  const inteiro = Number(correspondencia[2]);
  const decimal = correspondencia[3] || "";

  const primeirosDigitos = (decimal + "00").slice(0, 2);
  const terceiroDigito = Number(decimal[2] || "0");

  let centavos = inteiro * 100 + Number(primeirosDigitos);

  if (terceiroDigito >= 5) {
    centavos++;
  }

  return centavos * sinal;
}

// Converter centavos para formato decimal.
function formatarDinheiro(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

// Validar textos opcionais.
function textoOpcional(valor: unknown): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const resultado = valor.trim();
  return resultado || null;
}

// Validar email.
function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Gerar número único da cotação.
function gerarNumeroCotacao(): string {
  const ano = new Date().getFullYear();

  const codigo = randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `COT-${ano}-${codigo}`;
}

// Calcular validade: exactamente 5 dias após a emissão.
function calcularValidade(dataEmissao: Date): Date {
  const validade = new Date(dataEmissao);
  validade.setDate(validade.getDate() + 5);
  return validade;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Receber dados.
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

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados da cotação inválidos.",
        },
        { status: 400 }
      );
    }

    // 2. Validar tipo de cliente.
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

    // 3. Validar dados do cliente.
    const customerName =
      typeof dados.customerName === "string"
        ? dados.customerName.trim()
        : "";

    const phone =
      typeof dados.phone === "string"
        ? dados.phone.trim()
        : "";

    const companyRecebida = textoOpcional(dados.company);
    const nuitRecebido = textoOpcional(dados.nuit);

    const company =
      customerType === "COMPANY"
        ? companyRecebida
        : null;

    const nuit =
      customerType === "COMPANY"
        ? nuitRecebido
        : null;

    const email = textoOpcional(dados.email);
    const address = textoOpcional(dados.address);
    const notes = textoOpcional(dados.notes);

    if (!customerName || customerName.length < 2) {
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

    if (!phone || phone.length < 5 || phone.length > 40) {
      return NextResponse.json(
        {
          success: false,
          error: "Introduza um contacto telefónico válido.",
        },
        { status: 400 }
      );
    }

    // Validar empresa e NUIT.
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

      if (!nuit) {
        return NextResponse.json(
          {
            success: false,
            error: "Introduza o NUIT da empresa.",
          },
          { status: 400 }
        );
      }

      if (!/^\d{9}$/.test(nuit)) {
        return NextResponse.json(
          {
            success: false,
            error: "O NUIT deve conter exactamente 9 dígitos.",
          },
          { status: 400 }
        );
      }
    }

    if (email && !validarEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "O endereço de email não é válido.",
        },
        { status: 400 }
      );
    }

    if (address && address.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "O endereço é demasiado longo.",
        },
        { status: 400 }
      );
    }

    if (notes && notes.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: "As observações não podem ultrapassar 2000 caracteres.",
        },
        { status: 400 }
      );
    }

    // 4. Validar produtos.
    if (!Array.isArray(dados.items) || dados.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Adicione pelo menos um produto à cotação.",
        },
        { status: 400 }
      );
    }

    if (dados.items.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "A cotação não pode ultrapassar 100 linhas.",
        },
        { status: 400 }
      );
    }

    const itensRecebidos: ItemRecebido[] = [];

    for (const item of dados.items) {
      if (!item || typeof item !== "object") {
        return NextResponse.json(
          {
            success: false,
            error: "Existe um produto inválido na cotação.",
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
            error: "Identificador de produto inválido.",
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
            error: "A quantidade de cada produto deve ser um número inteiro positivo.",
          },
          { status: 400 }
        );
      }

      itensRecebidos.push({
        productId,
        quantity,
      });
    }

    // 5. Consultar produtos na base de dados.
    const productIds = [
      ...new Set(itensRecebidos.map((item) => item.productId)),
    ];

    const produtos = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
      },
    });

    const produtosMap = new Map(
      produtos.map((produto) => [produto.id, produto])
    );

    // 6. Confirmar existência dos produtos.
    const produtosEmFalta = productIds.filter(
      (id) => !produtosMap.has(id)
    );

    if (produtosEmFalta.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Um ou mais produtos não existem ou estão inactivos. Actualize a cotação.",
          productIds: produtosEmFalta,
        },
        { status: 400 }
      );
    }

    // 7. Calcular valores sem IVA.
    let totalGeral = 0;

    const linhas = itensRecebidos.map((item) => {
      const produto = produtosMap.get(item.productId)!;

      const precoUnitario = decimalParaCentavos(
        produto.price.toString()
      );

      if (
        !Number.isSafeInteger(precoUnitario) ||
        precoUnitario <= 0
      ) {
        throw new Error(
          `Preço inválido no produto ${produto.name}.`
        );
      }

      const totalLinha = precoUnitario * item.quantity;

      if (!Number.isSafeInteger(totalLinha)) {
        throw new Error(
          `O total do produto ${produto.name} ultrapassa o limite permitido.`
        );
      }

      totalGeral += totalLinha;

      return {
        id: randomUUID(),
        productId: produto.id,
        productName: produto.name,
        productImage: produto.image,
        quantity: item.quantity,
        unitPrice: formatarDinheiro(precoUnitario),
        total: formatarDinheiro(totalLinha),
      };
    });

    if (!Number.isSafeInteger(totalGeral) || totalGeral < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Os valores da cotação ultrapassam o limite permitido.",
        },
        { status: 400 }
      );
    }

    // 8. Definir emissão e validade automática de 5 dias.
    const agora = new Date();
    const validUntil = calcularValidade(agora);

    // 9. Criar cotação e respectivas linhas.
    const cotacao = await prisma.quotation.create({
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

        total: formatarDinheiro(totalGeral),

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

    // 10. Enviar notificação por email.
    // A falha do email não invalida a cotação.
    try {
      const emailEnviado = await enviarNotificacaoEmail({
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
            valor: cotacao.company || "Não indicada",
          },
          {
            nome: "NUIT",
            valor: cotacao.nuit || "Não indicado",
          },
          {
            nome: "Telefone",
            valor: cotacao.phone,
          },
          {
            nome: "Email",
            valor: cotacao.email || "Não indicado",
          },
          {
            nome: "Endereço",
            valor: cotacao.address || "Não indicado",
          },
          {
            nome: "Observações",
            valor: cotacao.notes || "Nenhuma",
          },
          {
            nome: "Total",
            valor: `${cotacao.total.toString()} MZN`,
          },
          {
            nome: "Validade",
            valor: cotacao.validUntil
              ? new Intl.DateTimeFormat("pt-MZ", {
                  timeZone: "Africa/Maputo",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }).format(cotacao.validUntil)
              : "Não definida",
          },
          {
            nome: "Estado",
            valor: cotacao.status,
          },
        ],

        itens: cotacao.items.map((item) => ({
          nome: item.productName,
          quantidade: item.quantity,
          preco: `${item.unitPrice.toString()} MZN`,
          total: `${item.total.toString()} MZN`,
        })),
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

    // 11. Resposta de sucesso.
    return NextResponse.json(
      {
        success: true,
        message: "Cotação criada com sucesso.",
        quotation: cotacao,
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error("ERRO AO CRIAR COTAÇÃO:");

    if (error instanceof Error) {
      console.error("Mensagem:", error.message);
      console.error("Stack:", error.stack);
    }

    const prismaError = error as {
      code?: string;
      meta?: unknown;
      cause?: unknown;
      clientVersion?: string;
    };

    console.error("DETALHES DO PRISMA:", {
      code: prismaError.code,
      meta: prismaError.meta,
      cause: prismaError.cause,
      clientVersion: prismaError.clientVersion,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível criar a cotação.",
      },
      { status: 500 }
    );
  }
}
