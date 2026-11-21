
import "server-only";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const CLIENT_SESSION_COOKIE = "msw_cliente_session";
export const CLIENT_SESSION_DURATION = 8 * 60 * 60;

export interface ClientSession {
  userId: string;
  phone: string | null;
  email: string | null;
  role: "CLIENTE";
  exp: number;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET deve ter pelo menos 32 caracteres.");
  }

  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Cria o token de sessão do cliente.
 * Mantém o mesmo formato utilizado no endpoint de login.
 */
export function createClientSessionToken(user: {
  id: string;
  phone: string | null;
  email: string | null;
}): string {
  const payload: ClientSession = {
    userId: user.id,
    phone: user.phone,
    email: user.email,
    role: "CLIENTE",
    exp: Date.now() + CLIENT_SESSION_DURATION * 1000,
  };

  const encodedPayload = Buffer
    .from(JSON.stringify(payload))
    .toString("base64url");

  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

/**
 * Lê e valida a sessão do cliente.
 * Devolve null quando não existe uma sessão válida.
 */
export async function getClientSession(): Promise<ClientSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;

    if (!token) return null;

    const parts = token.split(".");

    if (parts.length !== 2) return null;

    const [encodedPayload, receivedSignature] = parts;

    const expectedSignature = sign(encodedPayload);

    if (!safeCompare(receivedSignature, expectedSignature)) {
      return null;
    }

    const decodedPayload = Buffer
      .from(encodedPayload, "base64url")
      .toString("utf8");

    const session = JSON.parse(decodedPayload) as ClientSession;

    if (
      !session.userId ||
      session.role !== "CLIENTE" ||
      typeof session.exp !== "number" ||
      session.exp <= Date.now()
    ) {
      return null;
    }

    // Confirma que o cliente ainda existe e continua activo.
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active || user.role !== "CLIENTE") {
      return null;
    }

    // Usa os dados actuais da base de dados.
    return {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      role: "CLIENTE",
      exp: session.exp,
    };
  } catch {
    return null;
  }
}
