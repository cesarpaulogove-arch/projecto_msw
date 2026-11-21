
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ArrowUpRight,
} from "lucide-react";

export interface ConteudoCardProps {
  id: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  image?: string | null;
  images?: string[];
}

export default function ConteudoCard({
  id,
  title,
  image,
  images = [],
}: ConteudoCardProps) {
  const [indice, setIndice] = useState(0);

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

  useEffect(() => {
    setIndice(0);
  }, [galeria.length]);

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
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-lime-400 hover:shadow-xl">

      <Link
        href={`/projectos/${id}`}
        className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        aria-label={`Ver projecto: ${title}`}
      >
        {/* Galeria de imagens */}
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {galeria.length > 0 ? (
            galeria.map((url, index) => (
              <img
                key={url}
                src={url}
                alt={`${title} - imagem ${index + 1}`}
                draggable={false}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                  indice === index
                    ? "scale-100 opacity-100"
                    : "scale-105 opacity-0"
                }`}
              />
            ))
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-gray-300" />
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full bg-gray-950/70 px-3 py-1 text-xs font-medium text-white">
            Projecto
          </span>
        </div>

        {/* Apenas o título e o acesso aos detalhes */}
        <div className="flex flex-1 flex-col p-4 lg:p-4 xl:p-5">
          <h2 className="text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-lime-700">
            {title}
          </h2>

          <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-lime-700">
            Conhecer projecto
            <ArrowUpRight
              size={17}
              className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </div>
        </div>
      </Link>

      {/* Controlos da galeria */}
      {galeria.length > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={anterior}
            aria-label="Imagem anterior"
            className="rounded-full p-2 text-gray-600 transition hover:bg-lime-100 hover:text-lime-700"
          >
            <ChevronLeft size={19} />
          </button>

          <div className="flex items-center gap-2">
            {galeria.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setIndice(index)}
                aria-label={`Ver imagem ${index + 1}`}
                aria-pressed={indice === index}
                className={`h-2 rounded-full transition-all ${
                  indice === index
                    ? "w-6 bg-lime-500"
                    : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          <span className="text-xs text-gray-500">
            {indice + 1}/{galeria.length}
          </span>

          <button
            type="button"
            onClick={seguinte}
            aria-label="Imagem seguinte"
            className="rounded-full p-2 text-gray-600 transition hover:bg-lime-100 hover:text-lime-700"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      )}
    </article>
  );
}
