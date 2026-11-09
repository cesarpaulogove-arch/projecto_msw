
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";

export interface ConteudoCardProps {
  title: string;
  summary?: string | null;
  content?: string | null;
  image?: string | null;
  images?: string[];
}

export default function ConteudoCard({
  title,
  summary,
  content,
  image,
  images = [],
}: ConteudoCardProps) {
  const [indice, setIndice] = useState(0);

  // Organizar as imagens e eliminar duplicados
  const galeria = useMemo(() => {
    return Array.from(
      new Set(
        [image, ...images].filter(
          (url): url is string =>
            typeof url === "string" && url.trim() !== ""
        )
      )
    );
  }, [image, images]);

  // Reiniciar o índice quando a quantidade de imagens mudar
  useEffect(() => {
    setIndice(0);
  }, [galeria.length]);

  // Rotação automática
  useEffect(() => {
    if (galeria.length <= 1) return;

    const intervalo = window.setInterval(() => {
      setIndice((actual) => (actual + 1) % galeria.length);
    }, 4000);

    return () => window.clearInterval(intervalo);
  }, [galeria.length]);

  function anterior() {
    setIndice((actual) =>
      actual === 0 ? galeria.length - 1 : actual - 1
    );
  }

  function seguinte() {
    setIndice((actual) => (actual + 1) % galeria.length);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      {/* Galeria de imagens */}
      <div className="group relative h-52 overflow-hidden bg-gray-100">

        {galeria.length > 0 ? (
          galeria.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={`${title} - imagem ${index + 1}`}
              draggable={false}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                indice === index
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            />
          ))
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Controlos */}
        {galeria.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Imagem anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-100 transition hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={seguinte}
              aria-label="Imagem seguinte"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-100 transition hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>

            {/* Indicadores */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {galeria.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setIndice(index)}
                  aria-label={`Ver imagem ${index + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    indice === index
                      ? "w-6 bg-lime-400"
                      : "w-2 bg-white/70"
                  }`}
                />
              ))}
            </div>

            {/* Contador */}
            <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
              {indice + 1}/{galeria.length}
            </span>
          </>
        )}
      </div>

      {/* Informação */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900">
          {title}
        </h2>

        {summary && (
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {summary}
          </p>
        )}

        {content && (
          <div className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-700">
            {content}
          </div>
        )}
      </div>
    </article>
  );
}
