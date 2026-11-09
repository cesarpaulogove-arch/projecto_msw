
import Link from "next/link";
import { Wrench, Cpu, Lightbulb, ArrowRight } from "lucide-react";

const blocks = [
  {
    title: "SERVIÇOS",
    description: "Assistência técnica e reparação electrónica",
    icon: Wrench,
    href: "/servicos",
  },
  {
    title: "PROJECTOS",
    description: "Prototipagem, robótica e automação",
    icon: Cpu,
    href: "/projectos",
  },
  {
    title: "SOLUÇÕES",
    description: "Tecnologia, componentes e inovação",
    icon: Lightbulb,
    href: "/solucoes",
  },
];

export default function InfoBlocks() {
  return (
    <section className="w-full border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-5">
        <div className="grid grid-cols-1 items-center md:grid-cols-3">
          {blocks.map((block, index) => {
            const Icon = block.icon;

            return (
              <Link
                key={block.title}
                href={block.href}
                aria-label={`${block.title}: ${block.description}`}
                className={`group flex items-center justify-center gap-4 rounded-xl py-4 transition-all duration-300 hover:bg-cyan-50 md:py-4 ${
                  index !== 2
                    ? "md:border-r md:border-gray-200 md:rounded-none"
                    : ""
                }`}
              >
                <Icon
                  size={30}
                  className="shrink-0 text-cyan-500 transition-transform duration-300 group-hover:scale-110 group-hover:text-cyan-700"
                  strokeWidth={1.8}
                />

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-[#071B2D]">
                    {block.title}

                    <ArrowRight
                      size={14}
                      className="opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                    />
                  </h3>

                  <p className="mt-1 text-xs text-gray-500 transition-colors group-hover:text-cyan-700">
                    {block.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
