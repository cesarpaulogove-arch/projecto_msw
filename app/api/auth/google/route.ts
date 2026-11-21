
import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "crypto";

function validarRedirect(valor: string | null): string {
  if (!valor) return "/";

  try {
    const destino = new URL(valor, "http://localhost");

    if (
      destino.origin !== "http://localhost" ||
      !destino.pathname.startsWith("/") ||
      destino.pathname.startsWith("//")
    ) {
      return "/";
    }

    return `${destino.pathname}${destino.search}${destino.hash}`;
  } catch {
    return "/";
  }
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { success: false, message: "Configuração Google OAuth incompleta." },
      { status: 500 }
    );
  }

  const oauthClient = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  // Protege o início do processo OAuth contra ataques CSRF.
  const state = randomBytes(32).toString("hex");

  // Guarda o destino para recuperar depois do callback Google.
  const destino = validarRedirect(
    request.nextUrl.searchParams.get("redirect")
  );

  const authorizationUrl = oauthClient.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
    response_type: "code",
  });

  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set("msw_google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  response.cookies.set("msw_google_oauth_redirect", destino, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
