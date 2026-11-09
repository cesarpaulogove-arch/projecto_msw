
import Link from "next/link";
import { Suspense } from "react";
import {
  Plus,
  FileText,
  Eye,
  EyeOff,
  Pencil,
  FolderOpen,
  Wrench,
  Cpu,
  Lightbulb,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

const tipos = [
  {
    value: "SERVICOS",
    label: "Serviços",
    icon: Wrench,
  },
  {
    value: "PROJECTOS",
    label: "Projectos",
    icon: Cpu,
  },
  {
    value: "SOLUCOES",
    label: "Soluções",
    icon: Lightbulb,
  },
];

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(data);
}

async function ListaConteudos() {
  const [conteudos, total, publicados, rascunhos] =
    await Promise.all([
      prisma.siteContent.findMany({
        orderBy: [
          { updatedAt: "desc" },
          { order: "asc" },
        ],
      }),
      prisma.siteContent.count(),
      prisma.siteContent.count({
        where: { status: "PUBLICADO" },
      }),
      prisma.siteContent.count({
        where: { status: "RASCUNHO" },
      }),
    ]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Total de conteúdos
            </p>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-3 text-3xl font-bold">{total}</p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Publicados
            </p>
            <Eye className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-green-700">
            {publicados}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Rascunhos
            </p>
            <EyeOff className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-700">
            {rascunhos}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border bg-white">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Conteúdos registados
            </h2>
            <p className="text-sm text-gray-500">
              Gere os conteúdos que serão apresentados no site.
            </p>
          </div>

          <Link
            href="/admin/dashboard/conteudos/novo"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime-500 px-4 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-lime-400"
          >
            <Plus size={18} />
            Novo conteúdo
          </Link>
        </div>

        {conteudos.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-gray-300" />

            <h3 className="font-semibold text-gray-800">
              Ainda não existem conteúdos
            </h3>

            <p className="mt-2 max-w-md text-sm text-gray-500">
              Crie o primeiro conteúdo para Serviços,
              Projectos ou Soluções.
            </p>

            <Link
              href="/admin/dashboard/conteudos/novo"
              className="mt-5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              Criar primeiro conteúdo
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {conteudos.map((conteudo) => {
              const tipo = tipos.find(
                (item) => item.value === conteudo.type
              );

              const Icone = tipo?.icon ?? FileText;

              return (
                <div
                  key={conteudo.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="rounded-lg bg-gray-100 p-3">
                      <Icone className="h-5 w-5 text-gray-700" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {conteudo.title}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            conteudo.status === "PUBLICADO"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {conteudo.status === "PUBLICADO"
                            ? "Publicado"
                            : "Rascunho"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {tipo?.label ?? conteudo.type}
                        {" · "}
                        Actualizado em {formatarData(conteudo.updatedAt)}
                      </p>

                      {conteudo.summary && (
                        <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-gray-600">
                          {conteudo.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/dashboard/conteudos/${conteudo.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <Pencil size={16} />
                      Editar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function ConteudosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-lime-700">
            MSW BUSINESS
          </p>

          <h1 className="text-2xl font-bold text-gray-900">
            Gestão de conteúdos
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Crie, organize e publique os conteúdos do site.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
            A carregar conteúdos...
          </div>
        }
      >
        <ListaConteudos />
      </Suspense>
    </div>
  );
}
