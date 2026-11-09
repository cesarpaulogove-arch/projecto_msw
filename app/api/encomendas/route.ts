
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { randomBytes } from "node:crypto";
import { enviarNotificacaoEmail } from "@/lib/notificacoes-email";

interface EncomendaItem {
  productId: string;
  quantity: number;
}

interface EncomendaBody {
  customerName: string;
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
        customerName: true,
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
        nome: cliente.customerName,
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

    // 1. Validar dados do cliente
    const nome = body.customerName?.trim() || "";
    const telefoneOriginal = body.phone?.trim() || "";
    const telefone = normalizarTelefone(telefoneOriginal);
    const endereco = body.address?.trim() || "";
    const email = body.email?.trim() || "";

    if (
      !nome ||
      telefone.length < 9 ||
      !endereco
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Preencha o nome, telefone e endereço.",
        },
        { status: 400 }
      );
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
          const subtotal = unitPrice.mul(quantity);

          return {
            productId: produto.id,
            productName: produto.name,
            quantity,
            unitPrice,
            subtotal,
          };
        });

        // 5. Calcular valores
        const subtotal = linhas.reduce(
          (total, item) => total.add(item.subtotal),
          new Prisma.Decimal(0)
        );

        // A entrega será confirmada posteriormente.
        const deliveryFee = new Prisma.Decimal(0);
        const total = subtotal.add(deliveryFee);

        // 6. Registar encomenda e produtos
        const novaEncomenda = await tx.order.create({
          data: {
            orderNumber: gerarReferencia(),
            customerName: nome,
            phone: telefone,
            email: email || null,
            address: endereco,
            district: body.district?.trim() || null,
            notes: body.notes?.trim() || null,
            subtotal,
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
    // Uma falha no e-mail não deve invalidar a encomenda.
    try {
      const emailEnviado = await enviarNotificacaoEmail({
        tipo: "NOVA ENCOMENDA",
        referencia: encomenda.orderNumber,
        cliente: encomenda.customerName,

        campos: [
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
            nome: "Subtotal",
            valor: `${encomenda.subtotal.toString()} MZN`,
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
          subtotal: `${item.subtotal.toString()} MZN`,
          total: `${item.subtotal.toString()} MZN`,
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
          cliente: encomenda.customerName,
          estado: encomenda.status,

          produtos: encomenda.items.map((item) => ({
            nome: item.productName,
            quantidade: item.quantity,
            preco: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
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
