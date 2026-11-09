import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Archive,
  Search,
  Eye,
} from "lucide-react";
const estados = [
  { value: "TODOS", label: "Todos" },
  { value: "NOVA", label: "Novas" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "RESPONDIDA", label: "Respondidas" },
  { value: "ARQUIVADA", label: "Arquivadas" },
];

const estadoStyle: Record<string, string> = {
  NOVA: "bg-blue-100 text-blue-700",
  EM_ANALISE: "bg-amber-100 text-amber-700",
  RESPONDIDA: "bg-green-100 text-green-700",
  ARQUIVADA: "bg-gray-100 text-gray-600",
};

const estadoLabel: Record<string, string> = {
  NOVA: "Nova",
  EM_ANALISE: "Em análise",
  RESPONDIDA: "Respondida",
  ARQUIVADA: "Arquivada",
};

interface Props {
  searchParams: Promise<{
    estado?: string;
    q?: string;
  }>;
}

export default function ContactosPage({ searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-gray-500">
            A carregar mensagens recebidas...
          </p>
        </div>
      }
    >
      <ContactosConteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function ContactosConteudo({ searchParams }: Props) {
  const params = await searchParams;
  const estado = params.estado || "TODOS";
  const q = params.q?.trim() || "";

  const where = {
    ...(estado !== "TODOS" &&
      estados.some((item) => item.value === estado && item.value !== "TODOS")
      ? {
          status: estado as
            | "NOVA"
            | "EM_ANALISE"
            | "RESPONDIDA"
            | "ARQUIVADA",
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { subject: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [contactos, total, novas, analise, respondidas, arquivadas] =
    await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: "NOVA" } }),
      prisma.contactMessage.count({ where: { status: "EM_ANALISE" } }),
      prisma.contactMessage.count({ where: { status: "RESPONDIDA" } }),
      prisma.contactMessage.count({ where: { status: "ARQUIVADA" } }),
    ]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-MZ", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Africa/Maputo",
    }).format(date);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-black text-gray-800">
          Gestão de contactos
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Consulte e faça a gestão das mensagens recebidas pela MSW BUSINESS.
        </p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total", value: total, icon: MessageSquare, color: "text-gray-700" },
          { label: "Novas", value: novas, icon: MessageSquare, color: "text-blue-600" },
          { label: "Em análise", value: analise, icon: Clock, color: "text-amber-600" },
          { label: "Respondidas", value: respondidas, icon: CheckCircle2, color: "text-green-600" },
          { label: "Arquivadas", value: arquivadas, icon: Archive, color: "text-gray-500" },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{item.label}</span>
                <Icon size={20} className={item.color} />
              </div>
              <p className="mt-3 text-2xl font-black text-gray-800">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pesquisa e filtros */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <form
          action="/admin/dashboard/contactos"
          method="GET"
          className="flex flex-col gap-4 md:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Pesquisar nome, email ou assunto..."
              className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-500"
            />
          </div>

          <select
            name="estado"
            defaultValue={estado}
            className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
          >
            {estados.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-[#071B2D] px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="font-bold text-gray-800">
            Mensagens recebidas ({contactos.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Remetente</th>
                <th className="px-5 py-4">Assunto</th>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Acção</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {contactos.map((contacto) => (
                <tr key={contacto.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800">
                      {contacto.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {contacto.email}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {contacto.subject}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                    {formatDate(contacto.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoStyle[contacto.status]}`}
                    >
                      {estadoLabel[contacto.status]}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/dashboard/contactos/${contacto.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#071B2D] px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                    >
                      <Eye size={15} />
                      Consultar
                    </Link>
                  </td>
                </tr>
              ))}

              {contactos.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Nenhuma mensagem encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
