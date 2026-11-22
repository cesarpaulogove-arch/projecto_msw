
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "msw_admin_session";

interface SessaoGestor {
  email: string;
  expiresAt: number;
  role: "GESTOR";
}

function getSecret(): string | null {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    return null;
  }

  return secret;
}

function compararAssinaturas(
  recebida: string,
  esperada: string
): boolean {
  try {
    const a = Buffer.from(recebida, "hex");
    const b = Buffer.from(esperada, "hex");

    if (a.length !== b.length || a.length === 0) {
      return false;
    }

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function validarToken(token: string): SessaoGestor | null {
  try {
    const secret = getSecret();

    const gestorEmail = process.env.GESTOR_EMAIL
      ?.trim()
      .toLowerCase();

    if (!secret || !gestorEmail) {
      return null;
    }

    const partes = token.split(".");

    if (partes.length !== 2) {
      return null;
    }

    const [payload, assinatura] = partes;

    if (!payload || !assinatura) {
      return null;
    }

    const assinaturaEsperada = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (!compararAssinaturas(
      assinatura,
      assinaturaEsperada
    )) {
      return null;
    }

    const dados = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<SessaoGestor>;

    if (
      typeof dados.email !== "string" ||
      typeof dados.expiresAt !== "number"
    ) {
      return null;
    }

    if (dados.expiresAt <= Date.now()) {
      return null;
    }

    if (dados.email.trim().toLowerCase() !== gestorEmail) {
      return null;
    }

    return {
      email: gestorEmail,
      expiresAt: dados.expiresAt,
      role: "GESTOR",
    };

  } catch {
    return null;
  }
}

/**
 * Verifica a sessão do gestor.
 */
export async function verificarSessaoGestor(): Promise<SessaoGestor | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return validarToken(token);
}

/**
 * Exige uma sessão válida de gestor.
 */
export async function exigirGestor(): Promise<SessaoGestor> {
  const sessao = await verificarSessaoGestor();

  if (!sessao) {
    redirect("/minha-conta");
  }

  return sessao;
}

/**
 * Verifica se existe uma sessão válida.
 */
export async function gestorAutenticado(): Promise<boolean> {
  return (await verificarSessaoGestor()) !== null;
}
