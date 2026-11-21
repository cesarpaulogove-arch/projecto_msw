
import Link from "next/link";
import { Suspense } from "react";
import {
  Package,
  Layers,
  ShoppingBag,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Tag,
  ClipboardList,
  Clock,
  MessageSquareText,
  FileText,
  Eye,
  EyeOff,
  FileCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

// ==========================================
// FORMATADORES
// ==========================================

const formatarMoeda = (valor: number | string) =>
  `${Number(valor).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;

const formatarData = (data: Date) =>
  new Date(data).toLocaleDateString("pt-MZ");

const formatarEstado = (estado: string) => {
  const estados: Record<string, string> = {
    PENDENTE: "Pendente",
    CONFIRMADA: "Confirmada",
    EM_PREPARACAO: "Em preparação",
    ENVIADA: "Enviada",
    ENTREGUE: "Entregue",
    CANCELADA: "Cancelada",
  };

  return estados[estado] ?? estado;
};

const corEstado = (estado: string) => {
  const cores: Record<string, string> = {
    PENDENTE: "bg-yellow-50 text-yellow-700",
    CONFIRMADA: "bg-blue-50 text-blue-700",
    EM_PREPARACAO: "bg-purple-50 text-purple-700",
    ENVIADA: "bg-cyan-50 text-cyan-700",
    ENTREGUE: "bg-green-50 text-green-700",
    CANCELADA: "bg-red-50 text-red-700",
  };

  return cores[estado] ?? "bg-gray-100 text-gray-600";
};

const formatarEstadoCotacao = (estado: string) => {
  const estados: Record<string, string> = {
    RASCUNHO: "Rascunho",
    EMITIDA: "Emitida",
    ACEITE: "Aceite",
    REJEITADA: "Rejeitada",
    EXPIRADA: "Expirada",
  };

  return estados[estado] ?? estado;
};

const corEstadoCotacao = (estado: string) => {
  const cores: Record<string, string> = {
    RASCUNHO: "bg-gray-100 text-gray-600",
    EMITIDA: "bg-blue-50 text-blue-700",
    ACEITE: "bg-green-50 text-green-700",
    REJEITADA: "bg-red-50 text-red-700",
    EXPIRADA: "bg-orange-50 text-orange-700",
  };

  return cores[estado] ?? "bg-gray-100 text-gray-600";
};

// ==========================================
// CABEÇALHO DAS SECÇÕES
// ==========================================

function SectionHeader({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <h3 className="font-bold text-[#071B2D]">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>

      <Link
        href={href}
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-cyan-600 hover:text-cyan-700"
      >
        Ver todas
        <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}

// ==========================================
// CONTEÚDO DO DASHBOARD
// ==========================================

async function DashboardConteudo() {
  const [
    totalProdutos,
    totalCategorias,
    produtosPublicados,
    stockBaixo,
    produtosRecentes,
    totalEncomendas,
    encomendasPendentes,
    encomendasRecentes,
    totalConteudos,
    conteudosPublicados,
    conteudosRascunho,
    totalCotacoes,
    cotacoesEmitidas,
    cotacoesAceites,
    cotacoesRecentes,
  ] = await Promise.all([
    prisma.product.count(),

    prisma.category.count(),

    prisma.product.count({
      where: { active: true },
    }),

    prisma.product.count({
      where: { inStock: false },
    }),

    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
      },
    }),

    prisma.order.count(),

    prisma.order.count({
      where: { status: "PENDENTE" },
    }),

    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        phone: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),

    prisma.siteContent.count(),

    prisma.siteContent.count({
      where: { status: "PUBLICADO" },
    }),

    prisma.siteContent.count({
      where: { status: "RASCUNHO" },
    }),

    prisma.quotation.count(),

    prisma.quotation.count({
      where: { status: "EMITIDA" },
    }),

    prisma.quotation.count({
      where: { status: "ACEITE" },
    }),

    prisma.quotation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        quoteNumber: true,
        customerName: true,
        company: true,
        phone: true,
        total: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        },
      },
    }),
  ]);

  // ==========================================
  // INDICADORES
  // ==========================================

  const stats = [
    {
      title: "Total de produtos",
      value: totalProdutos,
      icon: Package,
      color: "bg-blue-50 text-blue-600",
      href: "/admin/dashboard/produtos",
    },
    {
      title: "Categorias",
      value: totalCategorias,
      icon: Layers,
      color: "bg-purple-50 text-purple-600",
      href: "/admin/dashboard/categorias",
    },
    {
      title: "Produtos publicados",
      value: produtosPublicados,
      icon: ShoppingBag,
      color: "bg-green-50 text-green-600",
      href: "/admin/dashboard/produtos",
    },
    {
      title: "Produtos indisponíveis",
      value: stockBaixo,
      icon: AlertTriangle,
      color: "bg-orange-50 text-orange-600",
      href: "/admin/dashboard/produtos",
    },
    {
      title: "Total de encomendas",
      value: totalEncomendas,
      icon: ClipboardList,
      color: "bg-cyan-50 text-cyan-700",
      href: "/admin/dashboard/encomendas",
    },
    {
      title: "Encomendas pendentes",
      value: encomendasPendentes,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-700",
      href: "/admin/dashboard/encomendas",
    },
    {
      title: "Cotações registadas",
      value: totalCotacoes,
      icon: FileCheck,
      color: "bg-indigo-50 text-indigo-600",
      href: "/admin/dashboard/cotacoes",
    },
    {
      title: "Cotações emitidas",
      value: cotacoesEmitidas,
      icon: FileText,
      color: "bg-cyan-50 text-cyan-700",
      href: "/admin/dashboard/cotacoes",
    },
    {
      title: "Cotações aceites",
      value: cotacoesAceites,
      icon: ClipboardList,
      color: "bg-emerald-50 text-emerald-700",
      href: "/admin/dashboard/cotacoes",
    },
    {
      title: "Conteúdos registados",
      value: totalConteudos,
      icon: FileText,
      color: "bg-indigo-50 text-indigo-600",
      href: "/admin/dashboard/conteudos",
    },
    {
      title: "Conteúdos publicados",
      value: conteudosPublicados,
      icon: Eye,
      color: "bg-emerald-50 text-emerald-700",
      href: "/admin/dashboard/conteudos",
    },
    {
      title: "Rascunhos",
      value: conteudosRascunho,
      icon: EyeOff,
      color: "bg-amber-50 text-amber-700",
      href: "/admin/dashboard/conteudos",
    },
  ];

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">

      {/* BOAS-VINDAS */}
      <section className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-[#071B2D] sm:text-2xl">
            Bem-vindo à MSW TECH
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Acompanhe e administre a sua loja e os conteúdos do site.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex">
          <Link
            href="/admin/dashboard/conteudos/novo"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#071B2D] transition hover:border-lime-500 hover:bg-lime-50"
          >
            <FileText size={18} />
            Novo conteúdo
          </Link>

          <Link
            href="/admin/dashboard/produtos/novo"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#071B2D] px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-600"
          >
            <Plus size={18} />
            Adicionar produto
          </Link>
        </div>
      </section>

      {/* INDICADORES */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              href={stat.href}
              key={stat.title}
              className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md sm:rounded-2xl sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className={`rounded-lg p-2 sm:rounded-xl sm:p-3 ${stat.color}`}>
                  <Icon size={20} className="sm:h-[23px] sm:w-[23px]" />
                </div>

                <ArrowUpRight
                  size={17}
                  className="shrink-0 text-gray-400"
                />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-gray-500 sm:mt-5 sm:text-sm">
                {stat.title}
              </p>

              <h3 className="mt-1 break-words text-2xl font-black text-[#071B2D] sm:text-3xl">
                {stat.value.toLocaleString("pt-MZ")}
              </h3>
            </Link>
          );
        })}
      </section>

      {/* ACESSOS RÁPIDOS */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-[#071B2D]">
          Acessos rápidos
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">

          <Link
            href="/admin/dashboard/produtos/novo"
            className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-cyan-500 hover:shadow-md sm:gap-4 sm:p-5"
          >
            <div className="shrink-0 rounded-xl bg-cyan-50 p-3 text-cyan-600">
              <Plus size={22} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-[#071B2D]">Novo produto</h4>
              <p className="mt-1 text-xs text-gray-500">Cadastrar produtos na loja</p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/categorias"
            className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-cyan-500 hover:shadow-md sm:gap-4 sm:p-5"
          >
            <div className="shrink-0 rounded-xl bg-purple-50 p-3 text-purple-600">
              <Layers size={22} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-[#071B2D]">Categorias</h4>
              <p className="mt-1 text-xs text-gray-500">Organizar os produtos</p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/promocoes"
            className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-cyan-500 hover:shadow-md sm:gap-4 sm:p-5"
          >
            <div className="shrink-0 rounded-xl bg-orange-50 p-3 text-orange-600">
              <Tag size={22} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-[#071B2D]">Promoções</h4>
              <p className="mt-1 text-xs text-gray-500">Gerir preços promocionais</p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/encomendas"
            className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-cyan-500 hover:shadow-md sm:gap-4 sm:p-5"
          >
            <div className="shrink-0 rounded-xl bg-green-50 p-3 text-green-600">
              <ClipboardList size={22} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-[#071B2D]">Encomendas</h4>
              <p className="mt-1 text-xs text-gray-500">Gerir pedidos dos clientes</p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/cotacoes"
            className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-cyan-500 hover:shadow-md sm:gap-4 sm:p-5"
          >
            <div className="shrink-0 rounded-xl bg-cyan-50 p-3 text-cyan-700">
              <FileCheck size={22} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-[#071B2D]">Cotações</h4>
              <p className="mt-1 text-xs text-gray-500">Consultar e gerir cotações dos clientes</p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/contactos"
            className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-cyan-500 hover:shadow-md sm:gap-4 sm:p-5"
          >
            <div className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600">
              <MessageSquareText size={22} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-[#071B2D]">Mensagens recebidas</h4>
              <p className="mt-1 text-xs text-gray-500">Consultar e responder aos contactos</p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/conteudos"
            className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-lime-500 hover:shadow-md sm:gap-4 sm:p-5"
          >
            <div className="shrink-0 rounded-xl bg-lime-50 p-3 text-lime-700">
              <FileText size={22} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-[#071B2D]">Conteúdos do site</h4>
              <p className="mt-1 text-xs text-gray-500">Gerir serviços, projectos e soluções</p>
            </div>
          </Link>

        </div>
      </section>

      {/* ======================================
          COTAÇÕES RECENTES
      ====================================== */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          title="Cotações recentes"
          description="Consulte os produtos, clientes e valores cotados."
          href="/admin/dashboard/cotacoes"
        />

        {cotacoesRecentes.length === 0 ? (
          <div className="p-8 text-center sm:p-10">
            <FileCheck size={38} className="mx-auto text-gray-300" />
            <p className="mt-3 font-semibold text-gray-600">
              Ainda não existem cotações.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              As cotações realizadas aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            {/* VISTA MOBILE */}
            <div className="divide-y divide-gray-100 md:hidden">
              {cotacoesRecentes.map((cotacao) => (
                <article key={cotacao.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-bold text-[#071B2D]">
                        {cotacao.quoteNumber}
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-gray-700">
                        {cotacao.customerName}
                      </p>
                      {cotacao.company && (
                        <p className="mt-1 text-xs text-gray-400">
                          {cotacao.company}
                        </p>
                      )}
                    </div>

                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${corEstadoCotacao(cotacao.status)}`}>
                      {formatarEstadoCotacao(cotacao.status)}
                    </span>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      Produtos cotados
                    </p>

                    {cotacao.items.length > 0 ? (
                      <div className="space-y-2">
                        {cotacao.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between gap-2 text-xs">
                            <span className="min-w-0 break-words font-medium text-gray-700">
                              {item.productName}
                            </span>
                            <span className="shrink-0 text-gray-500">
                              × {item.quantity}
                            </span>
                          </div>
                        ))}

                        {cotacao.items.length > 3 && (
                          <p className="text-xs font-semibold text-cyan-600">
                            + {cotacao.items.length - 3} outros produtos
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        Sem produtos registados
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Telefone</p>
                      <p className="mt-1 break-all font-semibold text-gray-700">
                        {cotacao.phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Data</p>
                      <p className="mt-1 font-semibold text-gray-700">
                        {formatarData(cotacao.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-[11px] text-gray-400">Valor total</p>
                      <p className="text-base font-black text-[#071B2D]">
                        {formatarMoeda(String(cotacao.total))}
                      </p>
                    </div>

                    <Link
                      href={`/cotacoes/${cotacao.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#071B2D] px-4 text-xs font-bold text-white transition hover:bg-cyan-600"
                    >
                      Consultar
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* VISTA DESKTOP */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Referência</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Telefone</th>
                    <th className="px-5 py-4">Produtos cotados</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Data</th>
                    <th className="px-5 py-4">Acção</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {cotacoesRecentes.map((cotacao) => (
                    <tr key={cotacao.id} className="align-top">
                      <td className="px-5 py-4 font-bold text-[#071B2D]">
                        {cotacao.quoteNumber}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        <p className="font-semibold">{cotacao.customerName}</p>
                        {cotacao.company && (
                          <p className="mt-1 text-xs text-gray-400">
                            {cotacao.company}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {cotacao.phone}
                      </td>

                      <td className="min-w-[240px] px-5 py-4">
                        <div className="space-y-2">
                          {cotacao.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="text-xs text-gray-600">
                              <span className="font-semibold text-[#071B2D]">
                                {item.productName}
                              </span>
                              <span className="ml-2 text-gray-400">
                                × {item.quantity}
                              </span>
                            </div>
                          ))}

                          {cotacao.items.length > 3 && (
                            <p className="text-xs font-semibold text-cyan-600">
                              + {cotacao.items.length - 3} outros produtos
                            </p>
                          )}

                          {cotacao.items.length === 0 && (
                            <span className="text-xs text-gray-400">
                              Sem produtos registados
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-bold text-[#071B2D]">
                        {formatarMoeda(String(cotacao.total))}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${corEstadoCotacao(cotacao.status)}`}>
                          {formatarEstadoCotacao(cotacao.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {formatarData(cotacao.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/cotacoes/${cotacao.id}`}
                          className="font-semibold text-cyan-600 hover:text-cyan-700"
                        >
                          Consultar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ======================================
          ENCOMENDAS RECENTES
      ====================================== */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          title="Encomendas recentes"
          description="Últimas encomendas recebidas"
          href="/admin/dashboard/encomendas"
        />

        {encomendasRecentes.length === 0 ? (
          <div className="p-8 text-center sm:p-10">
            <ClipboardList size={38} className="mx-auto text-gray-300" />
            <p className="mt-3 font-semibold text-gray-600">
              Ainda não existem encomendas.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              As encomendas dos clientes aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            {/* VISTA MOBILE */}
            <div className="divide-y divide-gray-100 md:hidden">
              {encomendasRecentes.map((encomenda) => (
                <article key={encomenda.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-bold text-[#071B2D]">
                        {encomenda.orderNumber}
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-gray-700">
                        {encomenda.customerName}
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${corEstado(encomenda.status)}`}>
                      {formatarEstado(encomenda.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Telefone</p>
                      <p className="mt-1 break-all font-semibold text-gray-700">
                        {encomenda.phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Data</p>
                      <p className="mt-1 font-semibold text-gray-700">
                        {formatarData(encomenda.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-[11px] text-gray-400">Valor total</p>
                      <p className="text-base font-black text-[#071B2D]">
                        {formatarMoeda(String(encomenda.total))}
                      </p>
                    </div>

                    <Link
                      href={`/admin/dashboard/encomendas/${encomenda.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#071B2D] px-4 text-xs font-bold text-white transition hover:bg-cyan-600"
                    >
                      Consultar
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* VISTA DESKTOP */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Referência</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Telefone</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Data</th>
                    <th className="px-5 py-4">Acção</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {encomendasRecentes.map((encomenda) => (
                    <tr key={encomenda.id}>
                      <td className="px-5 py-4 font-bold text-[#071B2D]">
                        {encomenda.orderNumber}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {encomenda.customerName}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {encomenda.phone}
                      </td>

                      <td className="px-5 py-4 font-semibold text-[#071B2D]">
                        {formatarMoeda(String(encomenda.total))}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${corEstado(encomenda.status)}`}>
                          {formatarEstado(encomenda.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {formatarData(encomenda.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/dashboard/encomendas/${encomenda.id}`}
                          className="font-semibold text-cyan-600 hover:text-cyan-700"
                        >
                          Consultar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ======================================
          PRODUTOS RECENTES
      ====================================== */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          title="Produtos recentes"
          description="Últimos produtos cadastrados"
          href="/admin/dashboard/produtos"
        />

        {produtosRecentes.length === 0 ? (
          <div className="p-8 text-center sm:p-10">
            <Package size={38} className="mx-auto text-gray-300" />
            <p className="mt-3 font-semibold text-gray-600">
              Ainda não existem produtos.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Comece por cadastrar o primeiro produto.
            </p>
          </div>
        ) : (
          <>
            {/* VISTA MOBILE */}
            <div className="divide-y divide-gray-100 md:hidden">
              {produtosRecentes.map((product) => (
                <article key={product.id} className="space-y-3 p-4">
                  <div className="min-w-0">
                    <p className="break-words font-bold text-[#071B2D]">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.category.name}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black text-[#071B2D]">
                      {formatarMoeda(String(product.price))}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        product.inStock
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {product.inStock ? "Disponível" : "Indisponível"}
                      </span>

                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        product.active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {product.active ? "Publicado" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* VISTA DESKTOP */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Produto</th>
                    <th className="px-5 py-4">Categoria</th>
                    <th className="px-5 py-4">Preço</th>
                    <th className="px-5 py-4">Disponibilidade</th>
                    <th className="px-5 py-4">Estado</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {produtosRecentes.map((product) => (
                    <tr key={product.id}>
                      <td className="px-5 py-4 font-semibold text-[#071B2D]">
                        {product.name}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {product.category.name}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#071B2D]">
                        {formatarMoeda(String(product.price))}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                          product.inStock
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          {product.inStock ? "Disponível" : "Indisponível"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                          product.active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {product.active ? "Publicado" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-w-0 space-y-6 p-3 sm:p-6">
          <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-gray-200" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-gray-100 sm:h-36"
              />
            ))}
          </div>

          <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      }
    >
      <DashboardConteudo />
    </Suspense>
  );
}
