
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";

import { prisma } from "@/lib/prisma";
import GaleriaProjecto from "@/app/components/conteudos/GaleriaProjecto";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function ConteudoProjecto({ id }: { id: string }) {
  const projecto = await prisma.siteContent.findFirst({
    where: {
      id,
      type: "PROJECTOS",
      status: "PUBLICADO",
    },
  });

  if (!projecto) {
    notFound();
  }

  const imagens = Array.from(
    new Set(
      [projecto.image, ...projecto.images].filter(
        (imagem): imagem is string =>
          typeof imagem === "string" && imagem.trim() !== ""
      )
    )
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* CABEÇALHO */}
      {/* CABEÇALHO */}
        <section className="bg-gray-950 px-5 py-6 text-white sm:py-8">
        <div className="mx-auto max-w-7xl">
            <Link
            href="/projectos"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-lime-400"
            >
            <ArrowLeft size={17} />
            Voltar aos projectos
            </Link>

            <div className="flex items-center gap-2 text-sm text-lime-400">
            <FolderOpen size={16} />
            <span>Projectos</span>
            </div>

            <h1 className="mt-2 max-w-4xl text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            {projecto.title}
            </h1>

            {projecto.summary && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300 sm:text-base">
                {projecto.summary}
            </p>
            )}
        </div>
        </section>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <GaleriaProjecto
          imagens={imagens}
          titulo={projecto.title}
          videoUrl={projecto.videoUrl}
        />

        {/* DESCRIÇÃO */}
        {projecto.content && (
          <article className="mt-12 max-w-5xl">
            <div className="mb-5">
              <span className="text-sm font-semibold uppercase tracking-wider text-lime-700">
                Sobre o projecto
              </span>

              <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                Conheça os detalhes
              </h2>
            </div>

            <div className="whitespace-pre-line text-base leading-8 text-gray-600">
              {projecto.content}
            </div>
          </article>
        )}

        <div className="mt-12 border-t border-gray-200 pt-8">
          <Link
            href="/projectos"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-lime-600"
          >
            <ArrowLeft size={17} />
            Ver todos os projectos
          </Link>
        </div>
      </section>
    </main>
  );
}

// Resolver params dentro do Suspense
async function ProjectoComParametros({ params }: PageProps) {
  const { id } = await params;

  return <ConteudoProjecto id={id} />;
}

export default function ProjectoDetalhe({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-gray-500">
            A carregar projecto...
          </p>
        </div>
      }
    >
      <ProjectoComParametros params={params} />
    </Suspense>
  );
}
