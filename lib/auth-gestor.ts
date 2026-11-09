
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "msw_gestor_session";

interface SessaoGestor {
  email: string;
  role: "GESTOR";
  exp: number;
}

function compararAssinaturas(
  assinaturaRecebida: string,
  assinaturaEsperada: string
): boolean {
  const a = Buffer.from(assinaturaRecebida, "base64url");
  const b = Buffer.from(assinaturaEsperada, "base64url");

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

function validarToken(token: string): SessaoGestor | null {
  try {
    const secret = process.env.AUTH_SECRET;
    const gestorEmail = process.env.GESTOR_EMAIL?.trim().toLowerCase();

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
      .digest("base64url");

    if (!compararAssinaturas(assinatura, assinaturaEsperada)) {
      return null;
    }

    const dados = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<SessaoGestor>;

    if (
      typeof dados.email !== "string" ||
      dados.role !== "GESTOR" ||
      typeof dados.exp !== "number"
    ) {
      return null;
    }

    if (dados.exp <= Date.now()) {
      return null;
    }

    if (dados.email.toLowerCase() !== gestorEmail) {
      return null;
    }

    return {
      email: dados.email,
      role: "GESTOR",
      exp: dados.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica a sessão do gestor.
 * Retorna os dados da sessão ou null.
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
 * Redireciona para o login se não estiver autenticado.
 */
export async function exigirGestor(): Promise<SessaoGestor> {
  const sessao = await verificarSessaoGestor();

  if (!sessao) {
    redirect("/minha-conta");
  }

  return sessao;
}

/**
 * Verifica se o utilizador tem uma sessão válida de gestor.
 */
export async function gestorAutenticado(): Promise<boolean> {
  const sessao = await verificarSessaoGestor();
  return sessao !== null;
}
