
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { randomBytes } from "node:crypto";

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
  const data = new Date();
  const ano = data.getFullYear();
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
        { error: "Introduza um número de telefone válido." },
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
      { error: "Não foi possível pesquisar o cliente." },
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

    const telefone = normalizarTelefone(body.phone || "");

    // 1. Validar dados do cliente
    if (
      !body.customerName?.trim() ||
      telefone.length < 9 ||
      !body.address?.trim()
    ) {
      return NextResponse.json(
        { error: "Preencha o nome, telefone e endereço." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "A encomenda deve conter pelo menos um produto." },
        { status: 400 }
      );
    }

    // 2. Validar quantidades e IDs
    const quantidades = new Map<string, number>();

    for (const item of body.items) {
      if (
        typeof item.productId !== "string" ||
        !item.productId.trim() ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          { error: "Existem produtos ou quantidades inválidas." },
          { status: 400 }
        );
      }

      const quantidade =
        (quantidades.get(item.productId) ?? 0) + item.quantity;

      if (quantidade > 10000) {
        return NextResponse.json(
          { error: "Quantidade solicitada demasiado elevada." },
          { status: 400 }
        );
      }

      quantidades.set(item.productId, quantidade);
    }

    if (quantidades.size > 100) {
      return NextResponse.json(
        { error: "A encomenda contém demasiados produtos diferentes." },
        { status: 400 }
      );
    }

    const ids = [...quantidades.keys()];

    // 3. Criar encomenda e actualizar stock numa transacção
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

          if (produto.stock < quantity) {
            throw new Error(`STOCK_INSUFICIENTE:${produto.name}`);
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

        const subtotal = linhas.reduce(
          (total, item) => total.add(item.subtotal),
          new Prisma.Decimal(0)
        );

        // A taxa de entrega será confirmada posteriormente.
        const deliveryFee = new Prisma.Decimal(0);
        const total = subtotal.add(deliveryFee);

        const novaEncomenda = await tx.order.create({
          data: {
            orderNumber: gerarReferencia(),
            customerName: body.customerName.trim(),
            phone: telefone,
            email: body.email?.trim() || null,
            address: body.address.trim(),
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

        // Actualizar stock com condição atómica
        for (const item of linhas) {
          const actualizacao = await tx.product.updateMany({
            where: {
              id: item.productId,
              active: true,
              stock: {
                gte: item.quantity,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          if (actualizacao.count !== 1) {
            throw new Error("STOCK_INSUFICIENTE");
          }
        }

        return novaEncomenda;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 20000,
      }
    );

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
    if (error instanceof Error) {
      if (error.message === "PRODUTO_INDISPONIVEL") {
        return NextResponse.json(
          { error: "Um ou mais produtos já não estão disponíveis." },
          { status: 409 }
        );
      }

      if (error.message.startsWith("STOCK_INSUFICIENTE")) {
        return NextResponse.json(
          { error: "Stock insuficiente para um ou mais produtos." },
          { status: 409 }
        );
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Conflito ao processar a encomenda. Tente novamente." },
        { status: 409 }
      );
    }

    console.error("ERRO AO REGISTAR ENCOMENDA:", error);

    return NextResponse.json(
      { error: "Não foi possível registar a encomenda." },
      { status: 500 }
    );
  }
}
