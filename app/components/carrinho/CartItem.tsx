
"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

import type { ItemCarrinho } from "./CartProvider";

interface CartItemProps {
  item: ItemCarrinho;
  atualizarQuantidade: (produtoId: string, quantidade: number) => void;
  remover: (produtoId: string) => void;
}

export default function CartItem({
  item,
  atualizarQuantidade,
  remover,
}: CartItemProps) {
  const { produto, quantidade } = item;

  const subtotal = produto.price * quantidade;
  const disponivel = produto.inStock;

  const formatarPreco = (valor: number) =>
    valor.toLocaleString("pt-MZ", {
      style: "currency",
      currency: "MZN",
    });

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center">
      {/* Imagem */}
      <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-gray-50 sm:h-24 sm:w-24">
        {produto.image ? (
          <Image
            src={produto.image}
            alt={produto.name}
            fill
            sizes="(max-width: 640px) 100vw, 96px"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Sem imagem
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
          {produto.category}
        </p>

        <h3 className="mt-1 line-clamp-2 font-bold text-[#071B2D]">
          {produto.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-bold text-cyan-700">
            {formatarPreco(produto.price)}
          </span>

          {produto.oldPrice !== null &&
            produto.oldPrice > produto.price && (
              <span className="text-sm text-gray-400 line-through">
                {formatarPreco(produto.oldPrice)}
              </span>
            )}
        </div>

        {/* Disponibilidade */}
        <div className="mt-2">
          {disponivel ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Disponível
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Indisponível
            </span>
          )}
        </div>
      </div>

      {/* Quantidade e remoção */}
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 p-1">
          <button
            type="button"
            onClick={() =>
              atualizarQuantidade(produto.id, quantidade - 1)
            }
            disabled={quantidade <= 1}
            aria-label={`Diminuir quantidade de ${produto.name}`}
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={16} />
          </button>

          <span className="min-w-8 text-center text-sm font-bold text-[#071B2D]">
            {quantidade}
          </span>

          <button
            type="button"
            onClick={() =>
              atualizarQuantidade(produto.id, quantidade + 1)
            }
            disabled={!disponivel}
            aria-label={`Aumentar quantidade de ${produto.name}`}
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Subtotal</p>
            <p className="font-black text-[#071B2D]">
              {formatarPreco(subtotal)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => remover(produto.id)}
            aria-label={`Remover ${produto.name} do carrinho`}
            title="Remover produto"
            className="rounded-xl p-2.5 text-red-500 transition hover:bg-red-50"
          >
            <Trash2 size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}
