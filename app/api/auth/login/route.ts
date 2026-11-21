
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

import {
  createClientSessionToken,
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_DURATION,
} from "@/lib/client-session";

const ADMIN_SESSION_DURATION = 8 * 60 * 60;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET deve conter pelo menos 32 caracteres."
    );
  }

  return secret;
}

function safeCompare(a: string, b: string): boolean {
  const secret = getSecret();

  const hashA = createHmac("sha256", secret)
    .update(a)
    .digest();

  const hashB = createHmac("sha256", secret)
    .update(b)
    .digest();

  return timingSafeEqual(hashA, hashB);
}

function normalizarTelefone(phone: string): string {
  return phone.replace(/[\s()-]/g, "");
}

function criarSessaoGestor(email: string): string {
  const expiresAt = Date.now() + ADMIN_SESSION_DURATION * 1000;

  const payload = Buffer.from(
    JSON.stringify({ email, expiresAt })
  ).toString("base64url");

  const signature = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

function erro(mensagem: string, status: number) {
  return NextResponse.json(
    { success: false, error: mensagem },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return erro("Pedido inválido.", 400);
    }

    getSecret();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const telefone =
      typeof body.telefone === "string"
        ? normalizarTelefone(body.telefone)
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const pin =
      typeof body.pin === "string"
        ? body.pin
        : "";

    if (email && telefone) {
      return erro(
        "Envia apenas o email ou o número de telemóvel.",
        400
      );
    }

    if (!email && !telefone) {
      return erro(
        "Introduz o teu email ou número de telemóvel.",
        400
      );
    }

    // ==========================================
    // 1. LOGIN DO GESTOR PELO .ENV
    // ==========================================

    const gestorEmail = process.env.GESTOR_EMAIL
      ?.trim()
      .toLowerCase();

    const gestorPassword = process.env.GESTOR_PASSWORD;

    if (email && gestorEmail && safeCompare(email, gestorEmail)) {
      if (!gestorPassword) {
        return erro(
          "GESTOR_PASSWORD não está configurada no servidor.",
          500
        );
      }

      if (!password) {
        return erro(
          "Introduz a palavra-passe do gestor.",
          400
        );
      }

      if (password.length > 128) {
        return erro("Palavra-passe inválida.", 400);
      }

      if (!safeCompare(password, gestorPassword)) {
        return erro(
          "Email ou palavra-passe incorrectos.",
          401
        );
      }

      const token = criarSessaoGestor(gestorEmail);

      const response = NextResponse.json({
        success: true,
        role: "GESTOR",
        message: "Autenticação do gestor efectuada com sucesso.",
      });

      response.cookies.set("msw_admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: ADMIN_SESSION_DURATION,
      });

      // Limpar sessão anterior do cliente.
      response.cookies.set(CLIENT_SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    // ==========================================
    // 2. LOGIN DO CLIENTE
    // ==========================================

    const usaPassword = password.length > 0;
    const usaPinAntigo = pin.length > 0;

    if (usaPassword === usaPinAntigo) {
      return erro("Introduz a tua palavra-passe.", 400);
    }

    if (usaPassword && password.length > 128) {
      return erro("Palavra-passe inválida.", 400);
    }

    if (usaPinAntigo && !/^\d{4}$/.test(pin)) {
      return erro(
        "O PIN antigo deve conter exactamente 4 dígitos.",
        400
      );
    }

    if (
      telefone &&
      !/^\+[1-9]\d{7,14}$/.test(telefone)
    ) {
      return erro(
        "Número de telemóvel inválido. Usa o indicativo internacional.",
        400
      );
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return erro("Email inválido.", 400);
    }

    if (usaPinAntigo && !telefone) {
      return erro(
        "O PIN antigo só pode ser utilizado com o número de telemóvel.",
        400
      );
    }

    // ==========================================
    // 3. LOCALIZAR CLIENTE NO PRISMA
    // ==========================================

    const cliente = await prisma.user.findUnique({
      where: email
        ? { email }
        : { phone: telefone },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        password: true,
        pinHash: true,
        active: true,
        role: true,
      },
    });

    if (
      !cliente ||
      !cliente.active ||
      cliente.role !== "CLIENTE"
    ) {
      return erro("Dados de acesso incorrectos.", 401);
    }

    // ==========================================
    // 4. VALIDAR CREDENCIAIS DO CLIENTE
    // ==========================================

    let credenciaisValidas = false;

    if (usaPassword && cliente.password) {
      credenciaisValidas = await bcrypt.compare(
        password,
        cliente.password
      );
    } else if (usaPinAntigo && cliente.pinHash) {
      credenciaisValidas = await bcrypt.compare(
        pin,
        cliente.pinHash
      );
    }

    if (!credenciaisValidas) {
      return erro("Dados de acesso incorrectos.", 401);
    }

    // ==========================================
    // 5. CRIAR SESSÃO DO CLIENTE
    // ==========================================

    const token = createClientSessionToken({
      id: cliente.id,
      phone: cliente.phone,
      email: cliente.email,
    });

    const response = NextResponse.json({
      success: true,
      role: "CLIENTE",
      message: "Login efectuado com sucesso.",
      cliente: {
        id: cliente.id,
        nome: cliente.name,
        telefone: cliente.phone,
      },
    });

    response.cookies.set(CLIENT_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CLIENT_SESSION_DURATION,
    });

    // Limpar sessão anterior do gestor.
    response.cookies.set("msw_admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;

  } catch (error) {
    console.error("Erro no login:", error);

    return erro(
      "Não foi possível efectuar o login.",
      500
    );
  }
}
