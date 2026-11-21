
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/client-session";

const ASSUNTOS_VALIDOS = [
  "Informações sobre produtos",
  "Encomendas",
  "Assistência técnica",
  "Projectos",
  "Parcerias",
  "Outros",
];

// Verifica se existe uma sessão de cliente activa
export async function GET() {
  try {
    const session = await getClientSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
    });
  } catch (error) {
    console.error("Erro ao verificar sessão de contacto:", error);

    return NextResponse.json(
      { error: "Não foi possível verificar a sessão." },
      { status: 500 }
    );
  }
}

// Envia uma mensagem apenas para clientes autenticados
export async function POST(request: NextRequest) {
  try {
    const session = await getClientSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Inicie sessão na sua conta antes de enviar uma mensagem.",
          authenticated: false,
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Apenas estes campos são recebidos do formulário
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Preencha o assunto e a mensagem." },
        { status: 400 }
      );
    }

    if (subject.length > 100 || message.length > 3000) {
      return NextResponse.json(
        { error: "Um ou mais campos ultrapassam o limite permitido." },
        { status: 400 }
      );
    }

    if (!ASSUNTOS_VALIDOS.includes(subject)) {
      return NextResponse.json(
        { error: "Seleccione um assunto válido." },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "A mensagem deve conter pelo menos 10 caracteres." },
        { status: 400 }
      );
    }

    // Os dados pessoais vêm sempre da conta autenticada
    const cliente = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        name: true,
        email: true,
        phone: true,
        active: true,
        role: true,
      },
    });

    if (
      !cliente ||
      !cliente.active ||
      cliente.role !== "CLIENTE"
    ) {
      return NextResponse.json(
        { error: "A sua conta não está autorizada a enviar mensagens." },
        { status: 403 }
      );
    }

    const contacto = await prisma.contactMessage.create({
      data: {
        name: cliente.name,
        email: cliente.email ?? "",
        phone: cliente.phone,
        subject,
        message,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Mensagem enviada com sucesso.",
        contactId: contacto.id,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erro ao receber contacto:", error);

    return NextResponse.json(
      { error: "Não foi possível processar a mensagem. Tente novamente." },
      { status: 500 }
    );
  }
}
