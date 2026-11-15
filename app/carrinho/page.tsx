
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  FileText,
  CheckSquare,
  Square,
  History,
} from "lucide-react";

import { useCarrinho } from "@/app/components/carrinho/CartProvider";

export default function CarrinhoPage() {
  const {
    itens,
    itensSelecionados,
    remover,
    atualizarQuantidade,
    alternarSelecao,
    selecionarTodos,
    todosSelecionados,
    totalSelecionado,
    quantidadeSelecionada,
    limpar,
  } = useCarrinho();

  const temSelecionados = itensSelecionados.length > 0;

  const formatarPreco = (valor: number) =>
    new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(valor);

  return (
    <div className="min-h-[65vh] bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-5">

        {/* CABEÇALHO */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-cyan-600"
          >
            <ArrowLeft size={17} />
            Continuar a comprar
          </Link>

          <h1 className="mt-4 text-3xl font-black text-[#071B2D]">
            Meu carrinho
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {quantidadeSelecionada} unidade(s) seleccionada(s)
            {" · "}
            {itens.length} produto(s) no carrinho
          </p>
        </div>

        {itens.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <ShoppingCart
              size={55}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-5 text-xl font-bold text-[#071B2D]">
              O teu carrinho está vazio
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Explora os nossos produtos e adiciona os teus favoritos.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-600"
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

            {/* LISTA DE PRODUTOS */}
            <div className="space-y-4 lg:col-span-2">

              {/* SELECCIONAR TODOS */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={todosSelecionados}
                    onChange={(e) =>
                      selecionarTodos(e.target.checked)
                    }
                    className="h-5 w-5 cursor-pointer accent-cyan-600"
                    aria-label="Seleccionar todos os produtos"
                  />

                  <span className="text-sm font-semibold text-[#071B2D]">
                    Seleccionar todos
                  </span>
                </label>

                <span className="text-xs font-medium text-gray-500">
                  {itensSelecionados.length} de {itens.length} produto(s)
                </span>
              </div>

              {/* PRODUTOS */}
              {itens.map((item) => {
                const produto = item.produto;

                const linkProduto =
                  `/produtos/${encodeURIComponent(produto.id)}`;

                return (
                  <div
                    key={produto.id}
                    role="group"
                    aria-label={`Produto ${produto.name}`}
                    tabIndex={0}
                    onClick={() => alternarSelecao(produto.id)}
                    onKeyDown={(e) => {
                      // Evita que os controlos internos accionem a selecção.
                      if (e.target !== e.currentTarget) return;

                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        alternarSelecao(produto.id);
                      }
                    }}
                    className={`flex cursor-pointer flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all sm:flex-row sm:items-center ${
                      item.selecionado
                        ? "border-cyan-400 bg-cyan-50/30 shadow-md"
                        : "border-gray-200 opacity-80 hover:border-cyan-300 hover:opacity-100"
                    }`}
                  >

                    {/* CHECKBOX INDIVIDUAL */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.selecionado}
                        onChange={() =>
                          alternarSelecao(produto.id)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 cursor-pointer accent-cyan-600"
                        aria-label={`Seleccionar ${produto.name}`}
                      />
                    </div>

                    {/* IMAGEM */}
                    <Link
                      href={linkProduto}
                      title={`Ver detalhes de ${produto.name}`}
                      onClick={(e) => e.stopPropagation()}
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 transition hover:ring-2 hover:ring-cyan-400"
                    >
                      {produto.image ? (
                        <Image
                          src={produto.image}
                          alt={produto.name}
                          fill
                          sizes="96px"
                          className="object-contain p-2 transition-transform duration-300 hover:scale-110"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                          Sem imagem
                        </div>
                      )}
                    </Link>

                    {/* INFORMAÇÕES */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-cyan-600">
                        {produto.category}
                      </p>

                      <Link
                        href={linkProduto}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 block font-bold text-[#071B2D] transition hover:text-cyan-600"
                      >
                        {produto.name}
                      </Link>

                      <p className="mt-2 font-bold text-cyan-700">
                        {formatarPreco(produto.price)}
                      </p>

                      <p
                        className={`mt-1 text-xs font-medium ${
                          produto.inStock
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {produto.inStock
                          ? "Disponível"
                          : "Indisponível"}
                      </p>

                      <Link
                        href={linkProduto}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 inline-block text-xs font-semibold text-cyan-600 hover:underline"
                      >
                        Ver detalhes do produto
                      </Link>

                      {!item.selecionado && (
                        <p className="mt-1 text-xs text-gray-400">
                          Não incluído na encomenda ou cotação.
                        </p>
                      )}
                    </div>

                    {/* QUANTIDADE */}
                    <div
                      className="flex items-center gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={item.quantidade <= 1}
                        onClick={() =>
                          atualizarQuantidade(
                            produto.id,
                            item.quantidade - 1
                          )
                        }
                        className="rounded-lg border p-2 transition hover:bg-gray-100 disabled:opacity-40"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="min-w-5 text-center font-bold">
                        {item.quantidade}
                      </span>

                      <button
                        type="button"
                        disabled={!produto.inStock}
                        onClick={() =>
                          atualizarQuantidade(
                            produto.id,
                            item.quantidade + 1
                          )
                        }
                        className="rounded-lg border p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* REMOVER */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remover(produto.id);
                      }}
                      className="flex items-center gap-2 text-sm text-red-500 transition hover:text-red-700"
                      aria-label={`Remover ${produto.name}`}
                    >
                      <Trash2 size={17} />
                      <span className="sm:hidden">
                        Remover
                      </span>
                    </button>
                  </div>
                );
              })}

              {/* ACÇÕES DO CARRINHO */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => selecionarTodos(false)}
                  disabled={!temSelecionados}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Square size={16} />
                  Desseleccionar todos
                </button>

                <button
                  type="button"
                  onClick={limpar}
                  className="flex items-center gap-2 text-sm font-medium text-red-500 transition hover:text-red-700"
                >
                  <Trash2 size={16} />
                  Limpar carrinho
                </button>
              </div>
            </div>

            {/* RESUMO */}
            <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <h2 className="text-lg font-bold text-[#071B2D]">
                Resumo da encomenda
              </h2>

              {/* SELECÇÃO */}
              <div className="mt-5 rounded-lg bg-cyan-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-800">
                  <CheckSquare size={17} />
                  Produtos seleccionados
                </div>

                <p className="mt-1 text-2xl font-black text-[#071B2D]">
                  {itensSelecionados.length}
                </p>

                <p className="text-xs text-gray-500">
                  {quantidadeSelecionada} unidade(s) seleccionada(s)
                </p>
              </div>

              <div className="mt-5 flex justify-between text-sm text-gray-600">
                <span>Produtos no carrinho</span>
                <span>{itens.length}</span>
              </div>

              <div className="mt-4 flex justify-between text-sm text-gray-600">
                <span>Quantidade seleccionada</span>
                <span>{quantidadeSelecionada}</span>
              </div>

              <div className="mt-4 flex justify-between gap-3 text-sm text-gray-600">
                <span>Total dos seleccionados</span>
                <span className="text-right font-semibold text-[#071B2D]">
                  {formatarPreco(totalSelecionado)}
                </span>
              </div>

              <div className="my-5 border-t border-gray-200" />

              <div className="flex justify-between gap-3 text-lg font-black text-[#071B2D]">
                <span>Total</span>
                <span className="text-right">
                  {formatarPreco(totalSelecionado)}
                </span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-gray-400">
                Apenas os produtos seleccionados serão considerados
                no valor apresentado. Os custos de entrega serão
                considerados na finalização da encomenda.
              </p>

              {/* FINALIZAR ENCOMENDA */}
              {temSelecionados ? (
                <Link
                  href="/finalizar-encomenda"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-white transition hover:bg-cyan-600"
                >
                  <ShoppingCart size={18} />
                  Finalizar encomenda
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-300 px-5 py-3 font-bold text-white"
                >
                  <ShoppingCart size={18} />
                  Finalizar encomenda
                </button>
              )}

              {/* SOLICITAR COTAÇÃO */}
              {temSelecionados ? (
                <Link
                  href="/solicitar-cotacao"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#071B2D] px-5 py-3 font-bold text-[#071B2D] transition hover:bg-[#071B2D] hover:text-white"
                >
                  <FileText size={18} />
                  Solicitar cotação
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-bold text-gray-400"
                >
                  <FileText size={18} />
                  Solicitar cotação
                </button>
              )}

                {/* HISTÓRICO DE COMPRAS */}
                <Link
                  href="/historico-compras"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-600 px-5 py-3 font-bold text-cyan-700 transition hover:bg-cyan-50"
                >
                  <History size={18} />
                  Histórico de compras
                </Link>

              {!temSelecionados && (
                <p className="mt-3 text-center text-xs text-red-500">
                  Selecciona pelo menos um produto para continuar.
                </p>
              )}

              <Link
                href="/"
                className="mt-4 block text-center text-sm text-gray-500 transition hover:text-cyan-600"
              >
                Continuar a comprar
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
