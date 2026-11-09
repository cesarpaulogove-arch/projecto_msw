
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import {
  Plus,
  Package,
  ArrowUpRight,
  Barcode,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Componente responsável por consultar os produtos
async function ProdutosConteudo() {
  const produtos = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalProdutos = produtos.length;
  const produtosActivos = produtos.filter((p) => p.active).length;
  const produtosDisponiveis = produtos.filter((p) => p.inStock).length;
  const produtosSemStock = produtos.filter((p) => !p.inStock).length;

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#071B2D]">
            Gestão de produtos
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Consulte e organize os produtos da MSW TECH.
          </p>
        </div>

        <Link
          href="/admin/dashboard/produtos/novo"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#071B2D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d3452]"
        >
          <Plus size={18} />
          Adicionar produto
        </Link>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Total de produtos
            </p>

            <Package className="text-blue-600" size={20} />
          </div>

          <p className="mt-3 text-3xl font-bold text-[#071B2D]">
            {totalProdutos}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Produtos activos
            </p>

            <CheckCircle2 className="text-green-600" size={20} />
          </div>

          <p className="mt-3 text-3xl font-bold text-green-600">
            {produtosActivos}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Sem stock
            </p>

            <XCircle className="text-red-600" size={20} />
          </div>

          <p className="mt-3 text-3xl font-bold text-red-600">
            {produtosSemStock}
          </p>
        </div>

      </div>

      {/* Informação de disponibilidade */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-[#071B2D]">
            Disponibilidade dos componentes
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Estado de disponibilidade registado no sistema.
          </p>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <span className="flex items-center gap-2 text-green-700">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Disponíveis: {produtosDisponiveis}
          </span>

          <span className="flex items-center gap-2 text-red-600">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Indisponíveis: {produtosSemStock}
          </span>
        </div>
      </div>

      {/* Tabela de produtos */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="font-bold text-[#071B2D]">
            Produtos registados
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Consulte os códigos, nomes, categorias e disponibilidade dos componentes.
          </p>
        </div>

        {produtos.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <Package size={42} className="text-gray-300" />

            <p className="mt-4 font-semibold text-gray-700">
              Ainda não existem produtos.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Comece por adicionar o primeiro produto.
            </p>

            <Link
              href="/admin/dashboard/produtos/novo"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#071B2D] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Adicionar produto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">

              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Código
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Produto
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Categoria
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Preço
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Disponibilidade
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Estado
                  </th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Acção
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {produtos.map((produto) => (
                  <tr
                    key={produto.id}
                    className="transition hover:bg-gray-50"
                  >

                    {/* Código */}
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2">
                        <Barcode
                          size={16}
                          className="text-gray-400"
                        />

                        <span className="font-mono text-xs font-semibold text-[#071B2D]">
                          {produto.code || "Sem código"}
                        </span>
                      </div>
                    </td>

                    {/* Nome */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#071B2D]">
                        {produto.name}
                      </p>

                      <p className="text-xs text-gray-400">
                        {produto.slug}
                      </p>
                    </td>

                    {/* Categoria */}
                    <td className="px-5 py-4 text-gray-600">
                      {produto.category.name}
                    </td>

                    {/* Preço */}
                    <td className="px-5 py-4 font-semibold text-[#071B2D]">
                      {Number(produto.price).toLocaleString("pt-MZ", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} MT
                    </td>

                    {/* Disponibilidade */}
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          produto.inStock
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {produto.inStock
                          ? "Disponível"
                          : "Indisponível"}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          produto.active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {produto.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* Acção */}
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/dashboard/produtos/${produto.id}/editar`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Editar
                        <ArrowUpRight size={15} />
                      </Link>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Página principal
export default function ProdutosPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">

          <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>

          <div className="h-64 animate-pulse rounded-xl bg-gray-100" />

        </div>
      }
    >
      <ProdutosConteudo />
    </Suspense>
  );
}
