
import { NextRequest, NextResponse } from "next/server";
import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";

import { verificarSessaoGestor } from "@/lib/auth-gestor";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(request: NextRequest) {
  try {
    // Confirmar que o token de armazenamento está disponível.
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN não está configurado.");

      return NextResponse.json(
        { error: "Configuração do armazenamento de imagens em falta." },
        { status: 500 }
      );
    }

    // Receber o pedido enviado pelo upload() do cliente.
    const body = (await request.json()) as HandleUploadBody;

    const resposta = await handleUpload({
      body,
      request,

      // Executado quando o cliente pede autorização para carregar uma imagem.
      onBeforeGenerateToken: async (pathname) => {
        const sessao = await verificarSessaoGestor();

        if (!sessao) {
          throw new Error("Sessão de gestor inválida ou expirada.");
        }

        if (!/^produtos\/[A-Za-z0-9._-]+$/.test(pathname)) {
          throw new Error("Caminho de imagem não permitido.");
        }

        return {
          allowedContentTypes: TIPOS_PERMITIDOS,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            email: sessao.email,
            role: "GESTOR",
          }),
        };
      },

      // Executado pelo Vercel Blob depois da conclusão do upload.
      // Não exigir aqui a sessão do gestor: é um callback do serviço.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.info("Upload concluído:", {
          url: blob.url,
          tokenPayload,
        });
      },
    });

    return NextResponse.json(resposta);
  } catch (error) {
    console.error("ERRO NA ROTA DE UPLOAD:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o token de upload.",
      },
      { status: 400 }
    );
  }
}
