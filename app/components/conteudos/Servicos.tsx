
import { prisma } from "@/lib/prisma";
import { BriefcaseBusiness } from "lucide-react";
import ConteudoCard from "./ConteudoCard";


export default async function Servicos() {
  const servicos = await prisma.siteContent.findMany({
    where: {
      type: "SERVICOS",
      status: "PUBLICADO",
    },
    orderBy: [
      { order: "asc" },
      { publishedAt: "desc" },
    ],
  });

  if (servicos.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <BriefcaseBusiness className="mx-auto mb-4 h-12 w-12 text-gray-400" />
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
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {servicos.map((servico) => (
        <ConteudoCard
          key={servico.id}
          title={servico.title}
          summary={servico.summary}
          content={servico.content}
          image={servico.image}
          images={servico.images}
        />
      ))}
    </div>
  );
}
