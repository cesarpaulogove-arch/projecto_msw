
import { prisma } from "@/lib/prisma";
import { Lightbulb } from "lucide-react";
import ConteudoCard from "./ConteudoCard";

export default async function Solucoes() {
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
          Estamos a preparar as nossas soluções.
          Em breve teremos novidades.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {solucoes.map((solucao) => (
        <ConteudoCard
          key={solucao.id}
          title={solucao.title}
          summary={solucao.summary}
          content={solucao.content}
          image={solucao.image}
          images={solucao.images}
        />
      ))}
    </div>
  );
}
