
import Link from "next/link";
import { Suspense } from "react";
import {
  Search,
  FileCheck,
  Eye,
  Printer,
  CalendarDays,
  User,
  Phone,
  Building2,
  Package,
  Filter,
  ArrowLeft,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    estado?: string;
  }>;
}

const estadosCotacao: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EMITIDA: "Emitida",
  ACEITE: "Aceite",
  REJEITADA: "Rejeitada",
  EXPIRADA: "Expirada",
};

const coresEstado: Record<string, string> = {
  RASCUNHO: "bg-gray-100 text-gray-700",
  EMITIDA: "bg-blue-50 text-blue-700",
  ACEITE: "bg-green-50 text-green-700",
  REJEITADA: "bg-red-50 text-red-700",
  EXPIRADA: "bg-orange-50 text-orange-700",
};

function formatarMoeda(valor: number | string) {
  return `${Number(valor).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;
}

function formatarData(data: Date) {
  return new Date(data).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function CotacoesConteudo({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  const params = await searchParams;

  const pesquisa = params.q?.trim() ?? "";
  const estado = params.estado ?? "";

  const estadosValidos = [
    "RASCUNHO",
    "EMITIDA",
    "ACEITE",
    "REJEITADA",
    "EXPIRADA",
  ];

  const filtroEstado = estadosValidos.includes(estado)
    ? estado
    : undefined;

  const where = {
    ...(pesquisa
      ? {
          OR: [
            {
              quoteNumber: {
                contains: pesquisa,
                mode: "insensitive" as const,
              },
            },
            {
              customerName: {
                contains: pesquisa,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: pesquisa,
              },
            },
            {
              company: {
                contains: pesquisa,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(filtroEstado ? { status: filtroEstado as never } : {}),
  };

  const [
    cotacoes,
    totalCotacoes,
    totalRascunhos,
    totalEmitidas,
    totalAceites,
    totalRejeitadas,
  ] = await Promise.all([
    prisma.quotation.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
            ivaAmount: true,
            total: true,
          },
        },
      },
    }),

    prisma.quotation.count(),

    prisma.quotation.count({
      where: { status: "RASCUNHO" },
    }),

    prisma.quotation.count({
      where: { status: "EMITIDA" },
    }),

    prisma.quotation.count({
      where: { status: "ACEITE" },
    }),

    prisma.quotation.count({
      where: { status: "REJEITADA" },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-cyan-600"
          >
            <ArrowLeft size={16} />
            Voltar ao dashboard
          </Link>

          <h1 className="text-2xl font-black text-[#071B2D]">
            Gestão de cotações
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Consulte os pedidos de cotação, produtos, clientes e valores.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-[#071B2D] px-5 py-3 text-white">
          <FileCheck size={20} />
          <span className="text-sm font-bold">
            {totalCotacoes} cotações
          </span>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total",
            value: totalCotacoes,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Rascunhos",
            value: totalRascunhos,
            color: "bg-gray-100 text-gray-700",
          },
          {
            label: "Emitidas",
            value: totalEmitidas,
            color: "bg-cyan-50 text-cyan-700",
          },
          {
            label: "Aceites",
            value: totalAceites,
            color: "bg-green-50 text-green-700",
          },
          {
            label: "Rejeitadas",
            value: totalRejeitadas,
            color: "bg-red-50 text-red-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${item.color}`}>
              {item.label}
            </span>

            <p className="mt-4 text-3xl font-black text-[#071B2D]">
              {item.value.toLocaleString("pt-MZ")}
            </p>
          </div>
        ))}
      </section>

      {/* Pesquisa e filtros */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <form
          method="GET"
          className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_auto]"
        >
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              name="q"
              defaultValue={pesquisa}
              placeholder="Pesquisar referência, cliente, telefone..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div className="relative">
            <Filter
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              name="estado"
              defaultValue={estado}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-cyan-500"
            >
              <option value="">Todos os estados</option>
              {Object.entries(estadosCotacao).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#071B2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
          >
            Filtrar
          </button>
        </form>

        {(pesquisa || estado) && (
          <div className="mt-4">
            <Link
              href="/admin/dashboard/cotacoes"
              className="text-sm font-semibold text-cyan-600 hover:text-cyan-700"
            >
              Limpar filtros
            </Link>
          </div>
        )}
      </section>

      {/* Lista de cotações */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h2 className="font-bold text-[#071B2D]">
              Registo de cotações
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {cotacoes.length} resultado(s) encontrado(s)
            </p>
          </div>
        </div>

        {cotacoes.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck
              size={42}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 font-bold text-gray-700">
              Nenhuma cotação encontrada
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Experimente alterar os termos de pesquisa ou o estado seleccionado.
            </p>

            <Link
              href="/admin/dashboard/cotacoes"
              className="mt-5 inline-flex rounded-xl bg-[#071B2D] px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700"
            >
              Limpar pesquisa
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cotacoes.map((cotacao) => (
              <article
                key={cotacao.id}
                className="p-5 transition hover:bg-gray-50/70"
              >
                {/* Cabeçalho da cotação */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-black text-[#071B2D]">
                        {cotacao.quoteNumber}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          coresEstado[cotacao.status] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {estadosCotacao[cotacao.status] ??
                          cotacao.status}
                      </span>
                    </div>

                    <p className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <CalendarDays size={14} />
                      Registada em {formatarData(cotacao.createdAt)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-gray-400">
                      Valor total
                    </p>

                    <p className="mt-1 text-xl font-black text-[#071B2D]">
                      {formatarMoeda(String(cotacao.total))}
                    </p>
                  </div>
                </div>

                {/* Dados do cliente */}
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                    <User
                      size={17}
                      className="mt-0.5 text-cyan-600"
                    />

                    <div>
                      <p className="text-xs text-gray-400">
                        Cliente
                      </p>

                      <p className="text-sm font-semibold text-[#071B2D]">
                        {cotacao.customerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                    <Phone
                      size={17}
                      className="mt-0.5 text-cyan-600"
                    />

                    <div>
                      <p className="text-xs text-gray-400">
                        Telefone
                      </p>

                      <p className="text-sm font-semibold text-[#071B2D]">
                        {cotacao.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                    <Building2
                      size={17}
                      className="mt-0.5 text-cyan-600"
                    />

                    <div>
                      <p className="text-xs text-gray-400">
                        Empresa
                      </p>

                      <p className="text-sm font-semibold text-[#071B2D]">
                        {cotacao.company || "Cliente particular"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Produtos cotados */}
                <div className="mt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Package
                      size={17}
                      className="text-cyan-600"
                    />

                    <h4 className="text-sm font-bold text-[#071B2D]">
                      Produtos cotados ({cotacao.items.length})
                    </h4>
                  </div>

                  {cotacao.items.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      Não existem produtos associados.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full min-w-[500px] text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Produto</th>
                            <th className="px-4 py-3">Quantidade</th>
                            <th className="px-4 py-3">Preço unitário</th>
                            <th className="px-4 py-3">Subtotal</th>
                            <th className="px-4 py-3">IVA</th>
                            <th className="px-4 py-3">Total</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                          {cotacao.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 font-semibold text-[#071B2D]">
                                {item.productName}
                              </td>

                              <td className="px-4 py-3 text-gray-600">
                                {item.quantity}
                              </td>

                              <td className="px-4 py-3 text-gray-600">
                                {formatarMoeda(String(item.unitPrice))}
                              </td>

                              <td className="px-4 py-3 text-gray-600">
                                {formatarMoeda(String(item.subtotal))}
                              </td>

                              <td className="px-4 py-3 text-gray-600">
                                {formatarMoeda(String(item.ivaAmount))}
                              </td>

                              <td className="px-4 py-3 font-bold text-[#071B2D]">
                                {formatarMoeda(String(item.total))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Observações */}
                {cotacao.notes && (
                  <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-bold text-amber-800">
                      Observações
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">
                      {cotacao.notes}
                    </p>
                  </div>
                )}

                {/* Acções */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-400">
                    {cotacao.items.reduce(
                      (total, item) => total + item.quantity,
                      0
                    )}{" "}
                    unidade(s) cotada(s)
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/cotacoes/${cotacao.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-[#071B2D] transition hover:border-cyan-500 hover:text-cyan-700"
                    >
                      <Eye size={15} />
                      Consultar
                    </Link>

                    <Link
                      href={`/cotacoes/${cotacao.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#071B2D] px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-700"
                    >
                      <Printer size={15} />
                      Ver / imprimir
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function CotacoesPage({
  searchParams,
}: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-5 p-6">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>

          <div className="h-96 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      }
    >
      <CotacoesConteudo searchParams={searchParams} />
    </Suspense>
  );
}
