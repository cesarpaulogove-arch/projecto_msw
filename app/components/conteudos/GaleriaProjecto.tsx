
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";

interface GaleriaProjectoProps {
  imagens: string[];
  titulo: string;
  videoUrl?: string | null;
}

function obterVideoId(url: string): string | null {
  try {
    const endereco = new URL(url);
    const host = endereco.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    let id: string | null = null;

    if (host === "youtu.be" || host === "m.youtu.be") {
      id = endereco.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (endereco.pathname === "/watch") {
        id = endereco.searchParams.get("v");
      } else {
        const partes = endereco.pathname.split("/").filter(Boolean);

        if (
          ["embed", "shorts", "live"].includes(partes[0])
        ) {
          id = partes[1] ?? null;
        }
      }
    }

    return id && /^[a-zA-Z0-9_-]{11}$/.test(id)
      ? id
      : null;
  } catch {
    return null;
  }
}

export default function GaleriaProjecto({
  imagens,
  titulo,
  videoUrl,
}: GaleriaProjectoProps) {
  const [selecionada, setSelecionada] = useState(0);

  const videoId = videoUrl ? obterVideoId(videoUrl) : null;

  // Garantir que o índice continua válido quando a galeria muda.
  useEffect(() => {
    setSelecionada((atual) =>
      imagens.length === 0
        ? 0
        : Math.min(atual, imagens.length - 1)
    );
  }, [imagens]);

  function anterior() {
    setSelecionada((atual) =>
      atual <= 0 ? imagens.length - 1 : atual - 1
    );
  }

  function seguinte() {
    setSelecionada((atual) =>
      atual >= imagens.length - 1 ? 0 : atual + 1
    );
  }

  return (
    <div className="space-y-12">

      {/* GALERIA DE IMAGENS */}
      <section>
        {imagens.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[110px_minmax(0,1fr)] lg:grid-cols-[130px_minmax(0,1fr)]">

            {/* MINIATURAS */}
            <div className="order-2 flex gap-3 overflow-x-auto pb-2 md:order-1 md:max-h-[600px] md:flex-col md:overflow-x-hidden md:overflow-y-auto md:pr-2">
              {imagens.map((imagem, index) => (
                <button
                  key={`${imagem}-${index}`}
                  type="button"
                  onClick={() => setSelecionada(index)}
                  aria-label={`Ver imagem ${index + 1}`}
                  aria-pressed={selecionada === index}
                  className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all md:h-24 md:w-full ${
                    selecionada === index
                      ? "border-lime-500 ring-2 ring-lime-200"
                      : "border-gray-200 opacity-75 hover:border-lime-400 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={imagem}
                    alt={`${titulo} - miniatura ${index + 1}`}
                    fill
                    sizes="130px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            {/* IMAGEM AMPLIADA */}
                <div className="order-1 min-w-0 md:order-2">
                <div className="group relative aspect-[16/11] max-h-[520px] overflow-hidden rounded-2xl bg-gray-100 shadow-sm">

                    <Image
                    key={imagens[selecionada]}
                    src={imagens[selecionada]}
                    alt={`${titulo} - imagem ${selecionada + 1}`}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 80vw"
                    className="object-contain transition-opacity duration-300"
                    />

                    {imagens.length > 1 && (
                    <>
                        <button
                        type="button"
                        onClick={anterior}
                        aria-label="Imagem anterior"
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-gray-950/60 text-white transition hover:bg-lime-600"
                        >
                        <ChevronLeft size={22} />
                        </button>

                        <button
                        type="button"
                        onClick={seguinte}
                        aria-label="Imagem seguinte"
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-gray-950/60 text-white transition hover:bg-lime-600"
                        >
                        <ChevronRight size={22} />
                        </button>
                    </>
                    )}

                    <span className="absolute bottom-4 right-4 rounded-full bg-gray-950/70 px-3 py-1.5 text-xs font-medium text-white">
                    {selecionada + 1} / {imagens.length}
                    </span>
                </div>
                </div>
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-gray-100">
            <div className="text-center">
              <ImageIcon className="mx-auto h-16 w-16 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                Este projecto ainda não possui imagens.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* VÍDEO DO YOUTUBE */}
      {videoId && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-lime-600" />

              <h2 className="text-xl font-bold text-gray-900">
                Vídeo do projecto
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Assista à apresentação e demonstração deste projecto.
            </p>
          </div>

          <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-sm">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={`Vídeo do projecto ${titulo}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </section>
      )}

    </div>
  );
}
