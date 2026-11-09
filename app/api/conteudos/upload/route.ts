
import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_IMAGENS = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const ficheiros = formData.getAll("images");

    if (!ficheiros.length || ficheiros.length > MAX_IMAGENS) {
      return NextResponse.json(
        { error: "Seleccione entre 1 e 10 imagens." },
        { status: 400 }
      );
    }

    // Validar todos os ficheiros antes de guardar
    for (const ficheiro of ficheiros) {
      if (!(ficheiro instanceof File)) {
        return NextResponse.json(
          { error: "Ficheiro inválido." },
          { status: 400 }
        );
      }

      if (!TIPOS_PERMITIDOS[ficheiro.type]) {
        return NextResponse.json(
          { error: "Formato não permitido. Utilize JPG, PNG, WEBP ou GIF." },
          { status: 400 }
        );
      }

      if (ficheiro.size === 0 || ficheiro.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Cada imagem deve ter entre 1 byte e 5 MB." },
          { status: 400 }
        );
      }
    }

    const pasta = path.join(
      process.cwd(),
      "public",
      "uploads",
      "conteudos"
    );

    await mkdir(pasta, { recursive: true });

    const imagens: string[] = [];

    for (const ficheiro of ficheiros as File[]) {
      const extensao = TIPOS_PERMITIDOS[ficheiro.type];
      const nome = `${randomUUID()}${extensao}`;
      const caminho = path.join(pasta, nome);

      const buffer = Buffer.from(await ficheiro.arrayBuffer());

      await writeFile(caminho, buffer);

      imagens.push(`/uploads/conteudos/${nome}`);
    }

    return NextResponse.json(
      {
        message: "Imagens carregadas com sucesso.",
        images: imagens,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no carregamento das imagens:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar as imagens." },
      { status: 500 }
    );
  }
}
