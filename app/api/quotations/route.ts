
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

interface ItemRecebido {
  productId: string;
  quantity: number;
}

interface PedidoCotacao {
  customerName: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  validUntil?: string;
  items: ItemRecebido[];
}

// Converte valores decimais para centavos.
// Exemplo: "150.50" => 15050
function decimalParaCentavos(valor: string | number): number {
  const texto = String(valor).trim();
  const correspondencia = texto.match(
    /^(-?)(\d+)(?:\.(\d+))?$/
  );

  if (!correspondencia) {
    throw new Error("Valor monetário inválido.");
  }

  const sinal = correspondencia[1] === "-" ? -1 : 1;
  const inteiro = Number(correspondencia[2]);
  const decimal = correspondencia[3] || "";

  const primeirosDigitos = (decimal + "00").slice(0, 2);
  const terceiroDigito = Number(decimal[2] || "0");

  let centavos =
    inteiro * 100 + Number(primeirosDigitos);

  if (terceiroDigito >= 5) {
    centavos++;
  }

  return centavos * sinal;
}

// Converte taxa percentual para centésimos.
// Exemplo: 16.00% => 1600
function taxaParaInteiro(valor: string | number): number {
  return decimalParaCentavos(valor);
}

// Formata centavos para Decimal do Prisma.
function formatarDinheiro(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

function textoOpcional(valor: unknown): string | null {
  if (typeof valor !== "string") return null;

  const resultado = valor.trim();

  return resultado || null;
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function gerarNumeroCotacao(): string {
  const ano = new Date().getFullYear();
  const codigo = randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `COT-${ano}-${codigo}`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Receber dados
    let dados: PedidoCotacao;

    try {
      dados = await request.json();
    } catch {
      return NextResponse.json(
        { error: "O conteúdo enviado não é um JSON válido." },
        { status: 400 }
      );
    }

    if (!dados || typeof dados !== "object") {
      return NextResponse.json(
        { error: "Dados da cotação inválidos." },
        { status: 400 }
      );
    }

    // 2. Validar cliente
    const customerName =
      typeof dados.customerName === "string"
        ? dados.customerName.trim()
        : "";

    const phone =
      typeof dados.phone === "string"
        ? dados.phone.trim()
        : "";

    const company = textoOpcional(dados.company);
    const email = textoOpcional(dados.email);
    const address = textoOpcional(dados.address);
    const notes = textoOpcional(dados.notes);

    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: "Introduza o nome do cliente." },
        { status: 400 }
      );
    }

    if (customerName.length > 150) {
      return NextResponse.json(
        { error: "O nome do cliente é demasiado longo." },
        { status: 400 }
      );
    }

    if (!phone || phone.length < 5 || phone.length > 40) {
      return NextResponse.json(
        { error: "Introduza um contacto telefónico válido." },
        { status: 400 }
      );
    }

    if (email && !validarEmail(email)) {
      return NextResponse.json(
        { error: "O endereço de email não é válido." },
        { status: 400 }
      );
    }

    if (company && company.length > 150) {
      return NextResponse.json(
        { error: "O nome da empresa é demasiado longo." },
        { status: 400 }
      );
    }

    if (address && address.length > 500) {
      return NextResponse.json(
        { error: "O endereço é demasiado longo." },
        { status: 400 }
      );
    }

    if (notes && notes.length > 2000) {
      return NextResponse.json(
        { error: "As observações não podem ultrapassar 2000 caracteres." },
        { status: 400 }
      );
    }

    // 3. Validar produtos
    if (
      !Array.isArray(dados.items) ||
      dados.items.length === 0
    ) {
      return NextResponse.json(
        { error: "Adicione pelo menos um produto à cotação." },
        { status: 400 }
      );
    }

    if (dados.items.length > 100) {
      return NextResponse.json(
        { error: "A cotação não pode ultrapassar 100 linhas." },
        { status: 400 }
      );
    }

    const itensRecebidos: ItemRecebido[] = [];

    for (const item of dados.items) {
      if (!item || typeof item !== "object") {
        return NextResponse.json(
          { error: "Existe um produto inválido na cotação." },
          { status: 400 }
        );
      }

      const productId =
        typeof item.productId === "string"
          ? item.productId.trim()
          : "";

      const quantity = Number(item.quantity);

      if (!productId) {
        return NextResponse.json(
          { error: "Identificador de produto inválido." },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 100000
      ) {
        return NextResponse.json(
          {
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

    // 4. Validar validade da cotação
    let validUntil: Date | null = null;

    if (dados.validUntil) {
      if (typeof dados.validUntil !== "string") {
        return NextResponse.json(
          { error: "Data de validade inválida." },
          { status: 400 }
        );
      }

      const data = new Date(dados.validUntil);

      if (Number.isNaN(data.getTime())) {
        return NextResponse.json(
          { error: "Data de validade inválida." },
          { status: 400 }
        );
      }

      if (data.getTime() <= Date.now()) {
        return NextResponse.json(
          {
            error: "A validade da cotação deve ser uma data futura.",
          },
          { status: 400 }
        );
      }

      validUntil = data;
    }

    // 5. Consultar produtos na base de dados
    const productIds = [
      ...new Set(
        itensRecebidos.map((item) => item.productId)
      ),
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
        ivaRate: true,
      },
    });

    const produtosMap = new Map(
      produtos.map((produto) => [
        produto.id,
        produto,
      ])
    );

    // 6. Confirmar que todos os produtos existem e estão activos
    const produtosEmFalta = productIds.filter(
      (id) => !produtosMap.has(id)
    );

    if (produtosEmFalta.length > 0) {
      return NextResponse.json(
        {
          error:
            "Um ou mais produtos não existem ou estão inactivos. Actualize a cotação.",
          productIds: produtosEmFalta,
        },
        { status: 400 }
      );
    }

    // 7. Calcular valores por produto
    let subtotalGeral = 0;
    let ivaGeral = 0;

    const linhas = itensRecebidos.map((item) => {
      const produto = produtosMap.get(item.productId)!;

      const precoUnitario = decimalParaCentavos(
        produto.price.toString()
      );

      const taxaIVA = taxaParaInteiro(
        produto.ivaRate.toString()
      );

      if (
        !Number.isSafeInteger(precoUnitario) ||
        precoUnitario <= 0
      ) {
        throw new Error(
          `Preço inválido no produto ${produto.name}.`
        );
      }

      if (
        !Number.isSafeInteger(taxaIVA) ||
        taxaIVA < 0 ||
        taxaIVA > 10000
      ) {
        throw new Error(
          `Taxa de IVA inválida no produto ${produto.name}.`
        );
      }

      const subtotalLinha =
        precoUnitario * item.quantity;

      if (!Number.isSafeInteger(subtotalLinha)) {
        throw new Error(
          `O subtotal do produto ${produto.name} ultrapassa o limite permitido.`
        );
      }

      // IVA calculado individualmente para cada produto
      const ivaLinha = Math.round(
        (subtotalLinha * taxaIVA) / 10000
      );

      const totalLinha =
        subtotalLinha + ivaLinha;

      subtotalGeral += subtotalLinha;
      ivaGeral += ivaLinha;

      return {
        productId: produto.id,
        productName: produto.name,
        productImage: produto.image,
        quantity: item.quantity,

        unitPrice: formatarDinheiro(precoUnitario),
        ivaRate: produto.ivaRate.toString(),

        subtotal: formatarDinheiro(subtotalLinha),
        ivaAmount: formatarDinheiro(ivaLinha),
        total: formatarDinheiro(totalLinha),
      };
    });

    const totalGeral = subtotalGeral + ivaGeral;

    if (
      !Number.isSafeInteger(subtotalGeral) ||
      !Number.isSafeInteger(ivaGeral) ||
      !Number.isSafeInteger(totalGeral)
    ) {
      return NextResponse.json(
        { error: "Os valores da cotação ultrapassam o limite permitido." },
        { status: 400 }
      );
    }

    // 8. Criar cotação e respectivas linhas
    // O nested create garante que a cotação e os produtos
    // são gravados como uma única operação.
    const cotacao = await prisma.quotation.create({
      data: {
        quoteNumber: gerarNumeroCotacao(),

        customerName,
        company,
        phone,
        email,
        address,
        notes,

        subtotal: formatarDinheiro(subtotalGeral),
        ivaTotal: formatarDinheiro(ivaGeral),
        total: formatarDinheiro(totalGeral),

        currency: "MZN",
        validUntil,

        status: "RASCUNHO",

        items: {
          create: linhas,
        },
      },
      include: {
        items: true,
      },
    });

    // 9. Resposta
    return NextResponse.json(
      {
        message: "Cotação criada com sucesso.",
        quotation: cotacao,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erro ao criar cotação:", error);

    return NextResponse.json(
      {
        error: "Não foi possível criar a cotação.",
      },
      { status: 500 }
    );
  }
}
