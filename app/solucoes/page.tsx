
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Lightbulb, ArrowLeft } from "lucide-react";

async function ListaSolucoes() {
  const solucoes = await prisma.siteContent.findMany({
    where: {
      type: "SOLUCOES",
      status: "PUBLICADO",
    },
    orderBy: [
      { order: "asc" },
      { publishedAt: "desc" },
    ],
  });

  if (solucoes.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <Lightbulb className="mx-auto mb-4 h-12 w-12 text-gray-400" />

        <h2 className="text-xl font-semibold text-gray-900">
          Soluções em preparação
        </h2>

        <p className="mt-2 text-gray-500">
          Estamos a preparar as nossas soluções tecnológicas.
          Em breve teremos novidades.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {solucoes.map((solucao) => (
        <article
          key={solucao.id}
          className="overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-1 hover:shadow-lg"
        >
          {solucao.image && (
            <img
              src={solucao.image}
              alt={solucao.title}
              className="h-52 w-full object-cover"
            />
          )}

          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">
              {solucao.title}
            </h2>

            {solucao.summary && (
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {solucao.summary}
              </p>
            )}

            <div className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-700">
              {solucao.content}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function SolucoesPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Banner compacto */}
      <section className="bg-gray-950 px-5 py-10 text-white sm:py-12">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-lime-400"
          >
            <ArrowLeft size={17} />
            Voltar ao início
          </Link>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            As nossas soluções
          </h1>
        </div>
      </section>

      {/* Lista de soluções */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
        <Suspense
          fallback={
            <p className="text-center text-gray-500">
              A carregar soluções...
            </p>
          }
        >
          <ListaSolucoes />
        </Suspense>
      </section>

    </div>
  );
}
