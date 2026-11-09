
import Link from "next/link";
import { Suspense } from "react";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  PackageCheck,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import EncomendasTable from "@/app/components/admin/EncomendasTable";

interface EncomendasPageProps {
  searchParams: Promise<{
    pesquisa?: string;
    estado?: string;
  }>;
}

const ESTADOS = [
  "PENDENTE",
  "CONFIRMADA",
  "EM_PREPARACAO",
  "ENVIADA",
  "ENTREGUE",
  "CANCELADA",
] as const;

type EstadoEncomenda = (typeof ESTADOS)[number];

function formatarEstado(estado: string) {
  const estados: Record<string, string> = {
    PENDENTE: "Pendente",
    CONFIRMADA: "Confirmada",
    EM_PREPARACAO: "Em preparação",
    ENVIADA: "Enviada",
    ENTREGUE: "Entregue",
    CANCELADA: "Cancelada",
  };

  return estados[estado] ?? estado;
}

function CarregamentoEncomendas() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-24 rounded-2xl bg-gray-100" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 rounded-2xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>

      <div className="h-20 rounded-2xl bg-gray-100" />

      <div className="h-80 rounded-2xl border border-gray-200 bg-gray-100" />
    </div>
  );
}

export default function EncomendasPage({
  searchParams,
}: EncomendasPageProps) {
  return (
    <Suspense fallback={<CarregamentoEncomendas />}>
      <EncomendasConteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function EncomendasConteudo({
  searchParams,
}: EncomendasPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const pesquisa = params.pesquisa?.trim() ?? "";

  const estadoSelecionado = ESTADOS.includes(
    params.estado as EstadoEncomenda
  )
    ? (params.estado as EstadoEncomenda)
    : "";

  const where = {
    ...(estadoSelecionado
      ? {
          status: estadoSelecionado,
        }
      : {}),

    ...(pesquisa
      ? {
          OR: [
            {
              orderNumber: {
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
          ],
        }
      : {}),
  };

  const [
    totalEncomendas,
    pendentes,
    confirmadas,
    entregues,
    encomendas,
    somaValores,
  ] = await Promise.all([
    prisma.order.count(),

    prisma.order.count({
      where: { status: "PENDENTE" },
    }),

    prisma.order.count({
      where: { status: "CONFIRMADA" },
    }),

    prisma.order.count({
      where: { status: "ENTREGUE" },
    }),

    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          select: {
            quantity: true,
          },
        },
      },
    }),

    prisma.order.aggregate({
      where: {
        status: {
          not: "CANCELADA",
        },
      },
      _sum: {
        total: true,
      },
    }),
  ]);

  const indicadores = [
    {
      titulo: "Total de encomendas",
      valor: totalEncomendas,
      icon: ClipboardList,
      cor: "bg-blue-50 text-blue-600",
    },
    {
      titulo: "Pendentes",
      valor: pendentes,
      icon: Clock,
      cor: "bg-yellow-50 text-yellow-600",
    },
    {
      titulo: "Confirmadas",
      valor: confirmadas,
      icon: CheckCircle2,
      cor: "bg-purple-50 text-purple-600",
    },
    {
      titulo: "Entregues",
      valor: entregues,
      icon: PackageCheck,
      cor: "bg-green-50 text-green-600",
    },
  ];

  const formatarMoeda = (valor: number) =>
    `${valor.toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} MT`;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-cyan-600">
            MSW TECH / ADMINISTRAÇÃO
          </p>

          <h1 className="mt-2 text-2xl font-black text-[#071B2D]">
            Gestão de encomendas
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Acompanhe e administre os pedidos dos clientes.
          </p>
        </div>

        <div className="rounded-xl bg-[#071B2D] px-5 py-3 text-white">
          <p className="text-xs text-gray-300">
            Valor das encomendas não canceladas
          </p>

          <p className="mt-1 text-xl font-black">
            {formatarMoeda(Number(somaValores._sum.total ?? 0))}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.titulo}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className={`inline-flex rounded-xl p-3 ${item.cor}`}>
                <Icon size={23} />
              </div>

              <p className="mt-4 text-sm text-gray-500">
                {item.titulo}
              </p>

              <h2 className="mt-1 text-3xl font-black text-[#071B2D]">
                {item.valor.toLocaleString("pt-MZ")}
              </h2>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <form
          action="/admin/dashboard/encomendas"
          method="GET"
          className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_auto]"
        >
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              name="pesquisa"
              defaultValue={pesquisa}
              placeholder="Pesquisar referência, cliente ou telefone..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <select
            name="estado"
            defaultValue={estadoSelecionado}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-cyan-500"
          >
            <option value="">Todos os estados</option>

            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {formatarEstado(estado)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#071B2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-600"
          >
            <Search size={17} />
            Pesquisar
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h2 className="font-bold text-[#071B2D]">
              Lista de encomendas
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {encomendas.length} resultado(s) encontrado(s)
            </p>
          </div>

          {(pesquisa || estadoSelecionado) && (
            <Link
              href="/admin/dashboard/encomendas"
              className="text-sm font-semibold text-red-500 hover:text-red-600"
            >
              Limpar filtros
            </Link>
          )}
        </div>

        <EncomendasTable
          encomendas={encomendas.map((encomenda) => ({
            ...encomenda,
            total: Number(encomenda.total),
          }))}
        />
      </section>
    </div>
  );
}
