
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

// Conteúdo do dashboard: consultas à base de dados
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

    // Produtos indisponíveis
    prisma.product.count({
      where: {
        inStock: false,
      },
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
      where: {
        status: "PENDENTE",
      },
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
      where: {
        status: "PUBLICADO",
      },
    }),

    prisma.siteContent.count({
      where: {
        status: "RASCUNHO",
      },
    }),

    // Total de cotações
    prisma.quotation.count(),

    // Cotações emitidas
    prisma.quotation.count({
      where: {
        status: "EMITIDA",
      },
    }),

    // Cotações aceites
    prisma.quotation.count({
      where: {
        status: "ACEITE",
      },
    }),

    // Cotações recentes, incluindo os produtos cotados
    prisma.quotation.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
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

  // Estados das encomendas
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

  // Estados das cotações
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

  const formatarMoeda = (valor: number | string) => {
    return `${Number(valor).toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} MT`;
  };

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#071B2D]">
            Bem-vindo à MSW TECH
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Acompanhe e administre a sua loja e os conteúdos do site.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/dashboard/conteudos/novo"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#071B2D] transition hover:border-lime-500 hover:bg-lime-50"
          >
            <FileText size={18} />
            Novo conteúdo
          </Link>

          <Link
            href="/admin/dashboard/produtos/novo"
            className="flex items-center gap-2 rounded-xl bg-[#071B2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600"
          >
            <Plus size={18} />
            Adicionar produto
          </Link>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              href={stat.href}
              key={stat.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={23} />
                </div>

                <ArrowUpRight size={19} className="text-gray-400" />
              </div>

              <p className="mt-5 text-sm text-gray-500">
                {stat.title}
              </p>

              <h3 className="mt-1 text-3xl font-black text-[#071B2D]">
                {stat.value.toLocaleString("pt-MZ")}
              </h3>
            </Link>
          );
        })}
      </section>

      {/* Acessos rápidos */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-[#071B2D]">
          Acessos rápidos
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/admin/dashboard/produtos/novo"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-cyan-500 hover:shadow-md"
          >
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
              <Plus size={23} />
            </div>

            <div>
              <h4 className="font-bold text-[#071B2D]">
                Novo produto
              </h4>

              <p className="text-xs text-gray-500">
                Cadastrar produtos na loja
              </p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/categorias"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-cyan-500 hover:shadow-md"
          >
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Layers size={23} />
            </div>

            <div>
              <h4 className="font-bold text-[#071B2D]">
                Categorias
              </h4>

              <p className="text-xs text-gray-500">
                Organizar os produtos
              </p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/promocoes"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-cyan-500 hover:shadow-md"
          >
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <Tag size={23} />
            </div>

            <div>
              <h4 className="font-bold text-[#071B2D]">
                Promoções
              </h4>

              <p className="text-xs text-gray-500">
                Gerir preços promocionais
              </p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/encomendas"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-cyan-500 hover:shadow-md"
          >
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <ClipboardList size={23} />
            </div>

            <div>
              <h4 className="font-bold text-[#071B2D]">
                Encomendas
              </h4>

              <p className="text-xs text-gray-500">
                Gerir pedidos dos clientes
              </p>
            </div>
          </Link>

          {/* Gestão de cotações */}
          <Link
            href="/admin/dashboard/cotacoes"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-cyan-500 hover:shadow-md"
          >
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
              <FileCheck size={23} />
            </div>

            <div>
              <h4 className="font-bold text-[#071B2D]">
                Cotações
              </h4>

              <p className="text-xs text-gray-500">
                Consultar e gerir cotações dos clientes
              </p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/contactos"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-cyan-500 hover:shadow-md"
          >
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <MessageSquareText size={23} />
            </div>

            <div>
              <h4 className="font-bold text-[#071B2D]">
                Mensagens recebidas
              </h4>

              <p className="text-xs text-gray-500">
                Consultar e responder aos contactos
              </p>
            </div>
          </Link>

          {/* Gestão de conteúdos */}
          <Link
            href="/admin/dashboard/conteudos"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-lime-500 hover:shadow-md"
          >
            <div className="rounded-xl bg-lime-50 p-3 text-lime-700">
              <FileText size={23} />
            </div>

            <div>
              <h4 className="font-bold text-[#071B2D]">
                Conteúdos do site
              </h4>

              <p className="text-xs text-gray-500">
                Gerir serviços, projectos e soluções
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Cotações recentes */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h3 className="font-bold text-[#071B2D]">
              Cotações recentes
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Consulte os produtos, clientes e valores cotados.
            </p>
          </div>

          <Link
            href="/admin/dashboard/cotacoes"
            className="text-sm font-semibold text-cyan-600 hover:text-cyan-700"
          >
            Ver todas
          </Link>
        </div>

        {cotacoesRecentes.length === 0 ? (
          <div className="p-10 text-center">
            <FileCheck
              size={38}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 font-semibold text-gray-600">
              Ainda não existem cotações.
            </p>

            <p className="mt-1 text-sm text-gray-400">
              As cotações realizadas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <p className="font-semibold">
                        {cotacao.customerName}
                      </p>

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
                          <div
                            key={item.id}
                            className="text-xs text-gray-600"
                          >
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
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${corEstadoCotacao(
                          cotacao.status
                        )}`}
                      >
                        {formatarEstadoCotacao(cotacao.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {new Date(cotacao.createdAt).toLocaleDateString(
                        "pt-MZ"
                      )}
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
        )}
      </section>

      {/* Encomendas recentes */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h3 className="font-bold text-[#071B2D]">
              Encomendas recentes
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Últimas encomendas recebidas
            </p>
          </div>

          <Link
            href="/admin/dashboard/encomendas"
            className="text-sm font-semibold text-cyan-600 hover:text-cyan-700"
          >
            Ver todas
          </Link>
        </div>

        {encomendasRecentes.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList
              size={38}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 font-semibold text-gray-600">
              Ainda não existem encomendas.
            </p>

            <p className="mt-1 text-sm text-gray-400">
              As encomendas dos clientes aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${corEstado(
                          encomenda.status
                        )}`}
                      >
                        {formatarEstado(encomenda.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {new Date(encomenda.createdAt).toLocaleDateString(
                        "pt-MZ"
                      )}
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
        )}
      </section>

      {/* Produtos recentes */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h3 className="font-bold text-[#071B2D]">
              Produtos recentes
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Últimos produtos cadastrados
            </p>
          </div>

          <Link
            href="/admin/dashboard/produtos"
            className="text-sm font-semibold text-cyan-600 hover:text-cyan-700"
          >
            Ver todos
          </Link>
        </div>

        {produtosRecentes.length === 0 ? (
          <div className="p-10 text-center">
            <Package
              size={38}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 font-semibold text-gray-600">
              Ainda não existem produtos.
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Comece por cadastrar o primeiro produto.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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

                    <td className="px-5 py-4 font-semibold text-[#071B2D]">
                      {formatarMoeda(String(product.price))}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.inStock
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {product.inStock ? "Disponível" : "Indisponível"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.active ? "Publicado" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// Página principal
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>

          <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      }
    >
      <DashboardConteudo />
    </Suspense>
  );
}
