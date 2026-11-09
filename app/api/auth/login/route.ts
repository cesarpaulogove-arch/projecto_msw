
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

function compararSeguro(a: string, b: string) {
  const hashA = createHmac("sha256", "msw-auth-comparison")
    .update(a)
    .digest();

  const hashB = createHmac("sha256", "msw-auth-comparison")
    .update(b)
    .digest();

  return timingSafeEqual(hashA, hashB);
}

function criarToken(email: string, role: "GESTOR" | "CLIENTE") {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET não está configurado.");
  }

  const payload = Buffer.from(
    JSON.stringify({
      email,
      role,
      exp: Date.now() + 8 * 60 * 60 * 1000,
    })
  ).toString("base64url");

  const assinatura = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${assinatura}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Introduz o email e a palavra-passe." },
        { status: 400 }
      );
    }

    // ==========================================
    // 1. VERIFICAR CONFIGURAÇÃO DO GESTOR
    // ==========================================

    const gestorEmail = process.env.GESTOR_EMAIL
      ?.trim()
      .toLowerCase();

    const gestorPassword = process.env.GESTOR_PASSWORD;
    const authSecret = process.env.AUTH_SECRET;

    if (!authSecret) {
      console.error("AUTH_SECRET não configurado.");

      return NextResponse.json(
        { error: "Serviço de autenticação não configurado." },
        { status: 500 }
      );
    }

    // ==========================================
    // 2. LOGIN DO GESTOR
    // ==========================================

    if (gestorEmail && gestorPassword) {
      const emailValido = compararSeguro(email, gestorEmail);
      const passwordValida = compararSeguro(password, gestorPassword);

      if (emailValido && passwordValida) {
        const token = criarToken(email, "GESTOR");

        const response = NextResponse.json({
          success: true,
          role: "GESTOR",
          message: "Autenticação do gestor efectuada com sucesso.",
        });

        response.cookies.set("msw_gestor_session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 8 * 60 * 60,
        });

        return response;
      }
    }

    // ==========================================
    // 3. LOGIN DO CLIENTE
    // ==========================================

    const cliente = await prisma.user.findUnique({
      where: { email },
    });

    if (!cliente || !cliente.active) {
      return NextResponse.json(
        { error: "Email ou palavra-passe incorrectos." },
        { status: 401 }
      );
    }

    if (cliente.role !== "CLIENTE") {
      return NextResponse.json(
        { error: "Não tens autorização para este acesso." },
        { status: 403 }
      );
    }

    const passwordValida = await bcrypt.compare(
      password,
      cliente.password
    );

    if (!passwordValida) {
      return NextResponse.json(
        { error: "Email ou palavra-passe incorrectos." },
        { status: 401 }
      );
    }

    // ==========================================
    // 4. CRIAR SESSÃO DO CLIENTE
    // ==========================================

    const token = criarToken(email, "CLIENTE");

    const response = NextResponse.json({
      success: true,
      role: "CLIENTE",
      message: "Login efectuado com sucesso.",
    });

    response.cookies.set("msw_cliente_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error("Erro no login:", error);

    return NextResponse.json(
      { error: "Não foi possível efectuar o login." },
      { status: 500 }
    );
  }
}
