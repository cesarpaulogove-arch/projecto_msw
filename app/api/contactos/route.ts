
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ASSUNTOS_VALIDOS = [
  "Informações sobre produtos",
  "Encomendas",
  "Assistência técnica",
  "Projectos",
  "Parcerias",
  "Outros",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 254 || phone.length > 30 ||
        subject.length > 100 || message.length > 3000) {
      return NextResponse.json(
        { error: "Um ou mais campos ultrapassam o limite permitido." },
        { status: 400 }
      );
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
      return NextResponse.json(
        { error: "Introduza um endereço de email válido." },
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

    const contacto = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
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
