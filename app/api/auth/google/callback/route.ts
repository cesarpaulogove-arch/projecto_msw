
import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { timingSafeEqual } from "crypto";

import { prisma } from "@/lib/prisma";
import {
  createClientSessionToken,
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_DURATION,
} from "@/lib/client-session";

import {
  createGoogleRegistrationToken,
  GOOGLE_REGISTRATION_COOKIE,
  GOOGLE_REGISTRATION_DURATION,
} from "@/lib/google-registration";

const STATE_COOKIE = "msw_google_oauth_state";
const REDIRECT_COOKIE = "msw_google_oauth_redirect";

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Configuração Google OAuth incompleta.");
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

function obterDestino(request: NextRequest): string {
  const valor = request.cookies.get(REDIRECT_COOKIE)?.value;

  if (!valor) return "/";

  try {
    const destino = new URL(valor, request.nextUrl.origin);

    if (destino.origin !== request.nextUrl.origin) {
      return "/";
    }

    return `${destino.pathname}${destino.search}${destino.hash}`;
  } catch {
    return "/";
  }
}

function limparCookiesOAuth(response: NextResponse) {
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(REDIRECT_COOKIE);
}

function redirectWithError(
  request: NextRequest,
  error: string
) {
  const response = NextResponse.redirect(
    new URL(`/?googleError=${encodeURIComponent(error)}`, request.url)
  );

  limparCookiesOAuth(response);
  response.cookies.delete(GOOGLE_REGISTRATION_COOKIE);

  return response;
}

function prepararConclusaoRegisto(
  request: NextRequest,
  data: {
    googleId: string;
    email: string;
    name: string;
  }
) {
  const token = createGoogleRegistrationToken(data);
  const destino = obterDestino(request);

  const response = NextResponse.redirect(
    new URL(
      `/completar-registo?redirect=${encodeURIComponent(destino)}`,
      request.url
    )
  );

  response.cookies.set(
    GOOGLE_REGISTRATION_COOKIE,
    token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: GOOGLE_REGISTRATION_DURATION,
    }
  );

  limparCookiesOAuth(response);
  response.cookies.delete(CLIENT_SESSION_COOKIE);
  response.cookies.delete("msw_admin_session");

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const returnedState = request.nextUrl.searchParams.get("state");
    const googleError = request.nextUrl.searchParams.get("error");

    if (googleError) {
      return redirectWithError(request, "cancelled");
    }

    const storedState = request.cookies.get(STATE_COOKIE)?.value;

    if (
      !code ||
      !returnedState ||
      !storedState ||
      !safeCompare(returnedState, storedState)
    ) {
      return redirectWithError(request, "invalid_state");
    }

    const destino = obterDestino(request);

    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      return redirectWithError(request, "invalid_token");
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return redirectWithError(request, "email_not_verified");
    }

    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();
    const name = payload.name?.trim() || "Cliente Google";

    const existingGoogleUser = await prisma.user.findUnique({
      where: { googleId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        password: true,
        role: true,
        active: true,
      },
    });

    if (existingGoogleUser) {
      if (
        existingGoogleUser.role !== "CLIENTE" ||
        !existingGoogleUser.active
      ) {
        return redirectWithError(request, "account_unavailable");
      }

      if (
        !existingGoogleUser.phone ||
        !existingGoogleUser.password
      ) {
        return prepararConclusaoRegisto(request, {
          googleId,
          email: existingGoogleUser.email || email,
          name: existingGoogleUser.name || name,
        });
      }

      const sessionToken = createClientSessionToken({
        id: existingGoogleUser.id,
        phone: existingGoogleUser.phone,
        email: existingGoogleUser.email,
      });

      const response = NextResponse.redirect(
        new URL(destino, request.url)
      );

      response.cookies.set(
        CLIENT_SESSION_COOKIE,
        sessionToken,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: CLIENT_SESSION_DURATION,
        }
      );

      limparCookiesOAuth(response);
      response.cookies.delete(GOOGLE_REGISTRATION_COOKIE);
      response.cookies.delete("msw_admin_session");

      return response;
    }

    // Não associar automaticamente uma conta antiga
    // apenas porque tem o mesmo endereço de email.
    const existingEmailUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmailUser) {
      return redirectWithError(request, "account_exists");
    }

    return prepararConclusaoRegisto(request, {
      googleId,
      email,
      name,
    });
  } catch (error) {
    console.error("Erro no callback Google OAuth:", error);
    return redirectWithError(request, "authentication_failed");
  }
}
