
"use client";

import { useEffect, useState } from "react";

const imagens = [
  {
    src: "/imagem 1.png",
    alt: "MSW BUSINESS - imagem 1",
  },
  {
    src: "/imagem 2.png",
    alt: "MSW BUSINESS - imagem 2",
  },
  {
    src: "/imagem 3.png",
    alt: "MSW BUSINESS - imagem 3",
  },
];

export default function Hero() {
  const [indice, setIndice] = useState(0);

  function anterior() {
    setIndice((actual) =>
      actual === 0 ? imagens.length - 1 : actual - 1
    );
  }

  function seguinte() {
    setIndice((actual) => (actual + 1) % imagens.length);
  }

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setIndice((actual) => (actual + 1) % imagens.length);
    }, 4000);

    return () => window.clearInterval(intervalo);
  }, []);

  return (
    <section className="w-full overflow-hidden bg-[#071B2D]">
      <div className="relative h-[145px] w-full overflow-hidden sm:h-[175px] md:h-[210px] lg:h-[240px]">

        {/* Carrossel */}
        {imagens.map((imagem, index) => (
          <img
            key={imagem.src}
            src={imagem.src}
            alt={imagem.alt}
            draggable={false}
            className={`absolute inset-0 h-full w-full object-fill transition-opacity duration-700 ease-in-out ${
            indice === index
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          />
        ))}

      </div>
    </section>
  );
}
