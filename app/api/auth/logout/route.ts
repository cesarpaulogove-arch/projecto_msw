
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Sessão terminada com sucesso.",
    });

    response.cookies.set("msw_gestor_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Erro ao terminar sessão:", error);

    return NextResponse.json(
      { error: "Não foi possível terminar a sessão." },
      { status: 500 }
    );
  }
}
