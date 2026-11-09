import { NextResponse } from "next/server";
import { verificarSessaoGestor } from "@/lib/auth-gestor";



export async function GET() {
  const sessao = await verificarSessaoGestor();

  return NextResponse.json(
    {
      autenticado: Boolean(sessao),
      role: sessao ? "GESTOR" : null,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
