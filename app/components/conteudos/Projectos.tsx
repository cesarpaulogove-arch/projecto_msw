
import { prisma } from "@/lib/prisma";
import { Cpu } from "lucide-react";
import ConteudoCard from "./ConteudoCard";


export default async function Projectos() {
  const projectos = await prisma.siteContent.findMany({
    where: {
      type: "PROJECTOS",
      status: "PUBLICADO",
    },
    orderBy: [
      { order: "asc" },
      { publishedAt: "desc" },
    ],
  });

  if (projectos.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <Cpu className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">
          Projectos em preparação
        </h2>
        <p className="mt-2 text-gray-500">
          Estamos a preparar os nossos projectos.
          Em breve teremos novidades.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projectos.map((projecto) => (
        <ConteudoCard
          key={projecto.id}
          title={projecto.title}
          summary={projecto.summary}
          content={projecto.content}
          image={projecto.image}
          images={projecto.images}
        />
      ))}
    </div>
  );
}
