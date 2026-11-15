
"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const imagensValidas = images.filter(
    (imagem) =>
      typeof imagem === "string" &&
      imagem.trim().length > 0
  );

  const galeria =
    imagensValidas.length > 0
      ? [...new Set(imagensValidas)]
      : ["/images/produto-sem-imagem.png"];

  const [imagemAtual, setImagemAtual] = useState(0);

  const imagemAnterior = () => {
    setImagemAtual((atual) =>
      atual === 0 ? galeria.length - 1 : atual - 1
    );
  };

  const imagemSeguinte = () => {
    setImagemAtual((atual) =>
      atual === galeria.length - 1 ? 0 : atual + 1
    );
  };

  return (
    <section className="w-full min-w-0">
      <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:gap-4">

        {/* IMAGEM PRINCIPAL */}
        <div
          className="
            order-1 relative
            h-[360px] w-full min-w-0 shrink-0
            overflow-hidden rounded-xl
            border border-gray-200 bg-white
            sm:h-[460px]
            lg:order-2 lg:h-[560px] lg:flex-1
            xl:h-[620px]
          "
        >
          <Image
            key={galeria[imagemAtual]}
            src={galeria[imagemAtual]}
            alt={productName}
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 60vw"
            quality={95}
            className="
              object-contain
              p-2
              sm:p-4
              lg:p-6
            "
          />

          {/* SETA ANTERIOR */}
          {galeria.length > 1 && (
            <>
              <button
                type="button"
                onClick={imagemAnterior}
                aria-label="Imagem anterior"
                className="
                  absolute left-2 top-1/2 z-10
                  flex h-10 w-10 -translate-y-1/2
                  items-center justify-center
                  rounded-full border border-gray-200
                  bg-white/95 text-[#071B2D]
                  shadow-md transition
                  hover:bg-cyan-100
                  sm:left-3 sm:h-12 sm:w-12
                "
              >
                <ChevronLeft size={24} />
              </button>

              {/* SETA SEGUINTE */}
              <button
                type="button"
                onClick={imagemSeguinte}
                aria-label="Imagem seguinte"
                className="
                  absolute right-2 top-1/2 z-10
                  flex h-10 w-10 -translate-y-1/2
                  items-center justify-center
                  rounded-full border border-gray-200
                  bg-white/95 text-[#071B2D]
                  shadow-md transition
                  hover:bg-cyan-100
                  sm:right-3 sm:h-12 sm:w-12
                "
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* CONTADOR */}
          {galeria.length > 1 && (
            <div
              className="
                absolute bottom-3 right-3 z-10
                rounded-full bg-[#071B2D]/85
                px-3 py-1.5 text-xs
                font-bold text-white
              "
            >
              {imagemAtual + 1} / {galeria.length}
            </div>
          )}
        </div>

        {/* MINIATURAS */}
        {galeria.length > 1 && (
          <div
            className="
              order-2 flex w-full min-w-0
              shrink-0 gap-2 overflow-x-auto
              pb-2
              lg:order-1 lg:w-[92px]
              lg:flex-col lg:overflow-x-hidden
              lg:overflow-y-auto lg:pb-0
              xl:w-[105px]
            "
          >
            {galeria.map((imagem, index) => (
              <button
                key={`${imagem}-${index}`}
                type="button"
                onClick={() => setImagemAtual(index)}
                aria-label={`Ver imagem ${index + 1}`}
                aria-pressed={imagemAtual === index}
                className={`
                  relative h-[76px] w-[76px]
                  shrink-0 overflow-hidden
                  rounded-lg border-2 bg-white
                  transition
                  sm:h-[90px] sm:w-[90px]
                  lg:h-[86px] lg:w-full
                  xl:h-[100px]
                  ${
                    imagemAtual === index
                      ? "border-cyan-600 ring-2 ring-cyan-100"
                      : "border-gray-200 hover:border-cyan-400"
                  }
                `}
              >
                <Image
                  src={imagem}
                  alt={`${productName} - imagem ${index + 1}`}
                  fill
                  sizes="105px"
                  quality={85}
                  className="object-contain p-1"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
