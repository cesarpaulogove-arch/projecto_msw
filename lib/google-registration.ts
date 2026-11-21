
import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export const GOOGLE_REGISTRATION_COOKIE = "msw_google_registration";
export const GOOGLE_REGISTRATION_DURATION = 10 * 60;

export interface GoogleRegistrationData {
  googleId: string;
  email: string;
  name: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET deve conter pelo menos 32 caracteres."
    );
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

export function createGoogleRegistrationToken(data: {
  googleId: string;
  email: string;
  name: string;
}): string {
  const payload: GoogleRegistrationData = {
    googleId: data.googleId,
    email: data.email.trim().toLowerCase(),
    name: data.name.trim(),
    exp: Date.now() + GOOGLE_REGISTRATION_DURATION * 1000,
  };

  const encodedPayload = Buffer
    .from(JSON.stringify(payload))
    .toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyGoogleRegistrationToken(
  token: string
): GoogleRegistrationData | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, signature] = parts;

    if (!safeCompare(signature, sign(encodedPayload))) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as GoogleRegistrationData;

    if (
      !payload.googleId ||
      !payload.email ||
      !payload.name ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
