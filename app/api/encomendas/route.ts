
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { randomBytes } from "node:crypto";
import { enviarNotificacaoEmail } from "@/lib/notificacoes-email";

type CustomerType = "INDIVIDUAL" | "COMPANY";

interface EncomendaItem {
  productId: string;
  quantity: number;
}

interface EncomendaBody {
  customerType?: CustomerType;
  customerName: string;
  company?: string;
  nuit?: string;
  phone: string;
  email?: string;
  address: string;
  district?: string;
  notes?: string;
  items: EncomendaItem[];
}

function normalizarTelefone(telefone: string) {
  return telefone.replace(/\D/g, "");
}

function gerarReferencia() {
  const ano = new Date().getFullYear();
  const codigo = randomBytes(4).toString("hex").toUpperCase();

  return `MSW-${ano}-${codigo}`;
}

/**
 * PESQUISAR CLIENTE PELO TELEFONE
 * GET /api/encomendas?phone=...
 */
export async function GET(request: NextRequest) {
  try {
    const telefoneOriginal =
      request.nextUrl.searchParams.get("phone")?.trim() || "";

    const telefone = normalizarTelefone(telefoneOriginal);

    if (telefone.length < 9) {
      return NextResponse.json(
        {
          success: false,
          error: "Introduza um número de telefone válido.",
        },
        { status: 400 }
      );
    }

    const cliente = await prisma.order.findFirst({
      where: {
        OR: [
          { phone: telefone },
          { phone: telefoneOriginal },
        ],
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

    if (!cliente) {
      return NextResponse.json({
        success: true,
        encontrado: false,
        cliente: null,
      });
    }

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    console.error("ERRO AO PESQUISAR CLIENTE:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível pesquisar o cliente.",
      },
      { status: 500 }
    );
  }
}

/**
 * REGISTAR NOVA ENCOMENDA
 * POST /api/encomendas
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EncomendaBody;

    // 1. Validar tipo e dados do cliente
    const customerType = body.customerType || "INDIVIDUAL";

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

    const nome = body.customerName?.trim() || "";
    const empresa = body.company?.trim() || "";
    const nuit = body.nuit?.replace(/\D/g, "") || "";

    const telefoneOriginal = body.phone?.trim() || "";
    const telefone = normalizarTelefone(telefoneOriginal);

    const endereco = body.address?.trim() || "";
    const email = body.email?.trim() || "";

    if (!nome || telefone.length < 9 || !endereco) {
      return NextResponse.json(
        {
          success: false,
          error: "Preencha o nome, telefone e endereço.",
        },
        { status: 400 }
      );
    }

    if (customerType === "COMPANY") {
      if (!empresa) {
        return NextResponse.json(
          {
            success: false,
            error: "Introduza o nome da empresa.",
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

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Introduza um endereço de e-mail válido.",
        },
        { status: 400 }
      );
    }

    // Para pessoas individuais, não guardar dados de empresa.
    const company = customerType === "COMPANY" ? empresa : null;
    const nuitFinal = customerType === "COMPANY" ? nuit : null;

    // 2. Validar produtos
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A encomenda deve conter pelo menos um produto.",
        },
        { status: 400 }
      );
    }

    // 3. Agrupar quantidades por produto
    const quantidades = new Map<string, number>();

    for (const item of body.items) {
      if (
        typeof item.productId !== "string" ||
        !item.productId.trim() ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Existem produtos ou quantidades inválidas.",
          },
          { status: 400 }
        );
      }

      const productId = item.productId.trim();

      const quantidade =
        (quantidades.get(productId) ?? 0) + item.quantity;

      if (quantidade > 10000) {
        return NextResponse.json(
          {
            success: false,
            error: "Quantidade solicitada demasiado elevada.",
          },
          { status: 400 }
        );
      }

      quantidades.set(productId, quantidade);
    }

    if (quantidades.size > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "A encomenda contém demasiados produtos diferentes.",
        },
        { status: 400 }
      );
    }

    const ids = [...quantidades.keys()];

    // 4. Criar encomenda dentro de uma transacção
    const encomenda = await prisma.$transaction(
      async (tx) => {
        const produtos = await tx.product.findMany({
          where: {
            id: { in: ids },
            active: true,
          },
        });

        if (produtos.length !== ids.length) {
          throw new Error("PRODUTO_INDISPONIVEL");
        }

        const linhas = produtos.map((produto) => {
          const quantity = quantidades.get(produto.id)!;

          if (!produto.inStock) {
            throw new Error(
              `PRODUTO_INDISPONIVEL:${produto.name}`
            );
          }

          const unitPrice = new Prisma.Decimal(produto.price);
          const total = unitPrice.mul(quantity);

          return {
            productId: produto.id,
            productName: produto.name,
            quantity,
            unitPrice,
            total,
          };
        });

        // 5. Calcular o total dos produtos
        const totalProdutos = linhas.reduce(
          (soma, item) => soma.add(item.total),
          new Prisma.Decimal(0)
        );

        // A entrega será confirmada posteriormente.
        const deliveryFee = new Prisma.Decimal(0);
        const total = totalProdutos.add(deliveryFee);

        // 6. Registar encomenda e produtos
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
            district: body.district?.trim() || null,
            notes: body.notes?.trim() || null,

            deliveryFee,
            total,

            items: {
              create: linhas,
            },
          },
          include: {
            items: true,
          },
        });

        // Não alterar inStock nem efectuar desconto de quantidades.
        return novaEncomenda;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 20000,
      }
    );

    // 7. Enviar notificação depois de a encomenda ser registada.
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
            nome: "Entrega",
            valor: `${encomenda.deliveryFee.toString()} MZN`,
          },
          {
            nome: "Total",
            valor: `${encomenda.total.toString()} MZN`,
          },
        ],

        itens: encomenda.items.map((item) => ({
          nome: item.productName,
          quantidade: item.quantity,
          preco: `${item.unitPrice.toString()} MZN`,
          total: `${item.total.toString()} MZN`,
        })),
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

    // 8. Resposta de sucesso
    return NextResponse.json(
      {
        success: true,
        orderNumber: encomenda.orderNumber,
        total: Number(encomenda.total),

       encomenda: {
          id: encomenda.id,
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

          entrega: Number(encomenda.deliveryFee),
          total: Number(encomenda.total),

          estado: encomenda.status,

          produtos: encomenda.items.map((item) => ({
            nome: item.productName,
            quantidade: item.quantity,
            preco: Number(item.unitPrice),
            total: Number(item.total),
          })),

          data: encomenda.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Produto indisponível
    if (
      error instanceof Error &&
      (
        error.message === "PRODUTO_INDISPONIVEL" ||
        error.message.startsWith("PRODUTO_INDISPONIVEL:")
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Um ou mais produtos já não estão disponíveis.",
        },
        { status: 409 }
      );
    }

    // Conflito de transacção Prisma
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Conflito ao processar a encomenda. Tente novamente.",
        },
        { status: 409 }
      );
    }

    console.error("ERRO AO REGISTAR ENCOMENDA:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível registar a encomenda.",
      },
      { status: 500 }
    );
  }
}
