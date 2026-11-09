
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
} from "lucide-react";

import { useCarrinho } from "@/app/components/carrinho/CartProvider";

export default function CarrinhoPage() {
  const {
    itens,
    remover,
    atualizarQuantidade,
    total,
    quantidadeTotal,
    limpar,
  } = useCarrinho();

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
            {quantidadeTotal} produto(s) no carrinho
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

            {/* PRODUTOS */}
            <div className="space-y-4 lg:col-span-2">
              {itens.map((item) => (
                <div
                  key={item.produto.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  {/* IMAGEM */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.produto.image ? (
                      <Image
                        src={item.produto.image}
                        alt={item.produto.name}
                        fill
                        sizes="96px"
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  {/* INFORMAÇÕES */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-cyan-600">
                      {item.produto.category}
                    </p>

                    <h3 className="mt-1 font-bold text-[#071B2D]">
                      {item.produto.name}
                    </h3>

                    <p className="mt-2 font-bold text-cyan-700">
                      {formatarPreco(item.produto.price)}
                    </p>

                    <p
                      className={`mt-1 text-xs font-medium ${
                        item.produto.inStock
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {item.produto.inStock
                        ? "Disponível"
                        : "Indisponível"}
                    </p>
                  </div>

                  {/* QUANTIDADE */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={item.quantidade <= 1}
                      onClick={() =>
                        atualizarQuantidade(
                          item.produto.id,
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
                      onClick={() =>
                        atualizarQuantidade(
                          item.produto.id,
                          item.quantidade + 1
                        )
                      }
                      className="rounded-lg border p-2 transition hover:bg-gray-100"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* REMOVER */}
                  <button
                    type="button"
                    onClick={() => remover(item.produto.id)}
                    className="flex items-center gap-2 text-sm text-red-500 transition hover:text-red-700"
                  >
                    <Trash2 size={17} />
                    <span className="sm:hidden">Remover</span>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={limpar}
                className="text-sm font-medium text-red-500 transition hover:text-red-700"
              >
                Limpar carrinho
              </button>
            </div>

            {/* RESUMO */}
            <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071B2D]">
                Resumo da encomenda
              </h2>

              <div className="mt-5 flex justify-between text-sm text-gray-600">
                <span>Quantidade</span>
                <span>{quantidadeTotal}</span>
              </div>

              <div className="mt-4 flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatarPreco(total)}</span>
              </div>

              <div className="my-5 border-t border-gray-200" />

              <div className="flex justify-between gap-3 text-lg font-black text-[#071B2D]">
                <span>Total</span>
                <span>{formatarPreco(total)}</span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-gray-400">
                O valor apresentado corresponde ao subtotal dos produtos.
                Os impostos e custos de entrega serão considerados
                na respectiva finalização.
              </p>

              {/* FINALIZAR ENCOMENDA */}
              <Link
                href="/finalizar-encomenda"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-white transition hover:bg-cyan-600"
              >
                <ShoppingCart size={18} />
                Finalizar encomenda
              </Link>

              {/* SOLICITAR COTAÇÃO */}
              <Link
                href="/solicitar-cotacao"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#071B2D] px-5 py-3 font-bold text-[#071B2D] transition hover:bg-[#071B2D] hover:text-white"
              >
                <FileText size={18} />
                Solicitar cotação
              </Link>

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
