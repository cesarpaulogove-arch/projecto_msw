
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nome =
      typeof body.nome === "string" ? body.nome.trim() : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!nome || !email || !password) {
      return NextResponse.json(
        { error: "Preenche todos os campos." },
        { status: 400 }
      );
    }

    if (nome.length < 2 || nome.length > 100) {
      return NextResponse.json(
        { error: "Nome inválido." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "A palavra-passe deve ter entre 8 e 128 caracteres." },
        { status: 400 }
      );
    }

    // O email do gestor não pode ser registado como cliente.
    const gestorEmail = process.env.GESTOR_EMAIL
      ?.trim()
      .toLowerCase();

    if (gestorEmail && email === gestorEmail) {
      return NextResponse.json(
        { error: "Este email está reservado." },
        { status: 403 }
      );
    }

    const existente = await prisma.user.findUnique({
      where: { email },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Este email já está registado." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const cliente = await prisma.user.create({
      data: {
        name: nome,
        email,
        password: passwordHash,
        role: "CLIENTE",
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada com sucesso.",
        cliente,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Este email já está registado." },
        { status: 409 }
      );
    }

    console.error("Erro no registo:", error);

    return NextResponse.json(
      { error: "Não foi possível criar a conta." },
      { status: 500 }
    );
  }
}
