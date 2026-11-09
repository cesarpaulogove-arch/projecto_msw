
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Wrench, ArrowLeft } from "lucide-react";

async function ListaServicos() {
  const servicos = await prisma.siteContent.findMany({
    where: {
      type: "SERVICOS",
      status: "PUBLICADO",
    },
    orderBy: [
      { order: "asc" },
      { publishedAt: "desc" },
    ],
    take: 4,
  });

  if (servicos.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <Wrench className="mx-auto mb-4 h-12 w-12 text-gray-400" />

        <h2 className="text-xl font-semibold text-gray-900">
          Serviços em preparação
        </h2>

        <p className="mt-2 text-gray-500">
          Estamos a preparar os nossos serviços.
          Em breve teremos novidades.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 items-start">
      {servicos.map((servico, index) => {
        const itens = (servico.content || "")
          .split(/\r?\n/)
          .map((item) => item.replace(/^[-•*]\s*/, "").trim())
          .filter(Boolean);

        return (
          <article
  key={servico.id}
  className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:border-lime-400 hover:shadow-lg"
>
  {/* Caixa do título */}
  <div className="flex min-h-20 items-center justify-center bg-lime-100 px-4 py-5 text-center">
    <h2 className="text-lg font-bold leading-snug text-gray-900">
      {servico.title}
    </h2>
  </div>

  {/* Descrição */}
  <div className="p-6">
    {servico.summary && (
      <p className="text-sm leading-6 text-gray-500">
        {servico.summary}
      </p>
    )}

    {itens.length > 0 && (
      <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-6 text-gray-700 marker:text-lime-600">
        {itens.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    )}
  </div>
</article>
        );
      })}
    </div>
  );
}

export default function ServicosPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Banner */}
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
            Os nossos serviços
          </h1>
        </div>
      </section>

      {/* Blocos de serviços */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
        <Suspense
          fallback={
            <p className="text-center text-gray-500">
              A carregar serviços...
            </p>
          }
        >
          <ListaServicos />
        </Suspense>
      </section>

    </div>
  );
}
