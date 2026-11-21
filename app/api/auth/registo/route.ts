
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import {
  createClientSessionToken,
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_DURATION,
} from "@/lib/client-session";

import {
  verifyGoogleRegistrationToken,
  GOOGLE_REGISTRATION_COOKIE,
} from "@/lib/google-registration";

function normalizarTelefone(phone: string): string {
  return phone.replace(/[\s()-]/g, "");
}

function erro(mensagem: string, status: number) {
  return NextResponse.json(
    { success: false, error: mensagem },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validar a origem do pedido para protecção CSRF.
    const origin = request.headers.get("origin");

    if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
      return erro("Pedido não autorizado.", 403);
    }

    // 2. Confirmar a autorização temporária emitida pelo Google.
    const registrationToken = request.cookies.get(
      GOOGLE_REGISTRATION_COOKIE
    )?.value;

    if (!registrationToken) {
      return erro(
        "A autorização de registo expirou. Volta a entrar com o Google.",
        401
      );
    }

    const googleData = verifyGoogleRegistrationToken(
      registrationToken
    );

    if (!googleData) {
      return erro(
        "A autorização de registo é inválida ou expirou. Volta a entrar com o Google.",
        401
      );
    }

    // 3. Receber os dados do formulário.
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return erro("Dados inválidos.", 400);
    }

    const nome =
      typeof body.nome === "string"
        ? body.nome.trim()
        : "";

    const telefone =
      typeof body.telefone === "string"
        ? normalizarTelefone(body.telefone)
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const confirmarPassword =
      typeof body.confirmarPassword === "string"
        ? body.confirmarPassword
        : "";

    // 4. Validar os campos.
    if (!nome || !telefone || !password || !confirmarPassword) {
      return erro("Preenche todos os campos.", 400);
    }

    if (nome.length < 2 || nome.length > 100) {
      return erro(
        "O nome deve ter entre 2 e 100 caracteres.",
        400
      );
    }

    if (!/^\+[1-9]\d{7,14}$/.test(telefone)) {
      return erro(
        "Introduz um número válido com indicativo internacional. Exemplo: +258841234567.",
        400
      );
    }

    if (password.length < 8) {
      return erro(
        "A palavra-passe deve conter pelo menos 8 caracteres.",
        400
      );
    }

    if (password.length > 128) {
      return erro(
        "A palavra-passe não pode ultrapassar 128 caracteres.",
        400
      );
    }

    if (password !== confirmarPassword) {
      return erro(
        "As palavras-passe não coincidem.",
        400
      );
    }

    // 5. Verificar se o telefone já pertence a outra conta.
    const telefoneExistente = await prisma.user.findUnique({
      where: { phone: telefone },
      select: { id: true },
    });

    if (telefoneExistente) {
      return erro(
        "Este número de telemóvel já está associado a outra conta.",
        409
      );
    }

    // 6. Verificar a conta Google existente.
    const contaGoogle = await prisma.user.findUnique({
      where: {
        googleId: googleData.googleId,
      },
      select: {
        id: true,
        email: true,
        googleId: true,
        phone: true,
        password: true,
        role: true,
        active: true,
      },
    });

    if (contaGoogle) {
      if (
        contaGoogle.role !== "CLIENTE" ||
        !contaGoogle.active
      ) {
        return erro(
          "Esta conta não está disponível.",
          403
        );
      }

      // Não permitir alterar o perfil através deste processo
      // se a conta já estiver completa.
      if (contaGoogle.phone && contaGoogle.password) {
        return erro(
          "Esta conta já está registada. Entra normalmente.",
          409
        );
      }

      // O email da conta Google não pode pertencer
      // a outro utilizador.
      const emailExistente = await prisma.user.findUnique({
        where: {
          email: googleData.email,
        },
        select: { id: true },
      });

      if (
        emailExistente &&
        emailExistente.id !== contaGoogle.id
      ) {
        return erro(
          "Este email já está associado a outra conta.",
          409
        );
      }
    } else {
      // Se não existe Google ID, não associar automaticamente
      // uma conta apenas por coincidência de email.
      const emailExistente = await prisma.user.findUnique({
        where: {
          email: googleData.email,
        },
        select: { id: true },
      });

      if (emailExistente) {
        return erro(
          "Já existe uma conta com este email. Entra com os dados dessa conta.",
          409
        );
      }
    }

    // 7. Proteger a palavra-passe.
    const passwordHash = await bcrypt.hash(password, 12);

    // 8. Criar ou completar a conta.
    const cliente = contaGoogle
      ? await prisma.user.update({
          where: {
            id: contaGoogle.id,
          },
          data: {
            name: nome,
            phone: telefone,
            password: passwordHash,
            email: googleData.email,
            emailVerifiedAt: new Date(),
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
          },
        })
      : await prisma.user.create({
          data: {
            name: nome,
            email: googleData.email,
            emailVerifiedAt: new Date(),
            googleId: googleData.googleId,
            phone: telefone,
            password: passwordHash,
            phoneVerifiedAt: null,
            pinHash: null,
            role: "CLIENTE",
            active: true,
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
          },
        });

    // 9. Criar a sessão apenas depois de completar o perfil.
    const sessionToken = createClientSessionToken({
      id: cliente.id,
      phone: cliente.phone,
      email: cliente.email,
    });

    const response = NextResponse.json(
      {
        success: true,
        role: "CLIENTE",
        message: "Conta criada com sucesso.",
        cliente: {
          id: cliente.id,
          nome: cliente.name,
          telefone: cliente.phone,
        },
      },
      { status: contaGoogle ? 200 : 201 }
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

    // Remover a autorização temporária e a sessão administrativa.
    response.cookies.delete(GOOGLE_REGISTRATION_COOKIE);
    response.cookies.delete("msw_google_oauth_state");
    response.cookies.delete("msw_admin_session");

    return response;

  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return erro(
        "O email ou número de telemóvel já está associado a outra conta.",
        409
      );
    }

    console.error("Erro na conclusão do registo:", error);

    return erro(
      "Não foi possível concluir o registo. Tenta novamente.",
      500
    );
  }
}
