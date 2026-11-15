
"use client";

import { useEffect, useState } from "react";

import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Package,
  Tag,
} from "lucide-react";

import {
  useCarrinho,
  type ProdutoCarrinho,
} from "@/app/components/carrinho/CartProvider";

interface ProductDetailsProps {
  product: ProdutoCarrinho;
  code: string;
}

export default function ProductDetails({
  product,
  code,
}: ProductDetailsProps) {
  const {
    itens,
    adicionar,
    remover,
    atualizarQuantidade,
  } = useCarrinho();

  const preco = Number(product.price ?? 0);
  const precoAnterior = Number(product.oldPrice ?? 0);

  const disponivel = product.inStock === true;

  const temDesconto =
    product.oldPrice !== null &&
    product.oldPrice !== undefined &&
    precoAnterior > preco &&
    precoAnterior > 0;

  const desconto = temDesconto
    ? Math.round(
        ((precoAnterior - preco) / precoAnterior) * 100
      )
    : 0;

  const itemCarrinho = itens.find(
    (item) => item.produto.id === product.id
  );

  const quantidade = itemCarrinho?.quantidade ?? 0;

  const [quantidadeDigitada, setQuantidadeDigitada] =
    useState(String(quantidade));

  // Sincronizar o campo com as alterações do carrinho.
  useEffect(() => {
    setQuantidadeDigitada(String(quantidade));
  }, [quantidade]);

  const formatarPreco = (valor: number) =>
    valor.toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ADICIONAR UMA UNIDADE.
  function aumentarQuantidade() {
    if (!disponivel) return;

    adicionar(product);
  }

  // DIMINUIR UMA UNIDADE.
  function diminuirQuantidade() {
    if (quantidade <= 0) return;

    if (quantidade === 1) {
      remover(product.id);
      return;
    }

    atualizarQuantidade(product.id, quantidade - 1);
  }

  // ACTUALIZAR A QUANTIDADE DIGITADA.
  function alterarQuantidadeDigitada(valor: string) {
    // Permitir apagar temporariamente o campo durante a edição.
    if (!/^\d*$/.test(valor)) return;

    setQuantidadeDigitada(valor);

    if (valor === "" || valor === "0") return;

    const novaQuantidade = Number(valor);

    if (
      !Number.isSafeInteger(novaQuantidade) ||
      novaQuantidade < 1 ||
      !disponivel
    ) {
      return;
    }

    if (quantidade === 0) {
      adicionar(product);

      if (novaQuantidade > 1) {
        atualizarQuantidade(product.id, novaQuantidade);
      }
    } else {
      atualizarQuantidade(product.id, novaQuantidade);
    }
  }

  // VALIDAR O CAMPO QUANDO O CLIENTE TERMINAR A EDIÇÃO.
  function confirmarQuantidadeDigitada() {
    const novaQuantidade = Number(quantidadeDigitada);

    if (
      quantidadeDigitada.trim() === "" ||
      !Number.isSafeInteger(novaQuantidade) ||
      novaQuantidade < 1
    ) {
      if (quantidade > 0) {
        setQuantidadeDigitada(String(quantidade));
      } else {
        setQuantidadeDigitada("0");
      }

      return;
    }

    if (!disponivel) {
      setQuantidadeDigitada(String(quantidade));
      return;
    }

    if (quantidade === 0) {
      adicionar(product);

      if (novaQuantidade > 1) {
        atualizarQuantidade(product.id, novaQuantidade);
      }
    } else if (novaQuantidade !== quantidade) {
      atualizarQuantidade(product.id, novaQuantidade);
    }
  }

  return (
    <section className="flex h-full w-full min-w-0 flex-col">

      {/* CATEGORIA E PROMOÇÃO */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
          <Tag size={13} />
          {product.category}
        </span>

        {product.promotion && (
          <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
            Em promoção
          </span>
        )}
      </div>

      {/* NOME DO PRODUTO */}
      <div className="mt-4">
        <h1 className="text-2xl font-extrabold leading-snug text-[#071B2D] sm:text-3xl lg:text-4xl">
          {product.name}
        </h1>

        {code && (
          <p className="mt-2 text-xs text-gray-500 sm:text-sm">
            Referência:
            <span className="ml-1 font-semibold text-gray-700">
              {code}
            </span>
          </p>
        )}
      </div>

      {/* PREÇO */}
      <div className="mt-6 border-y border-gray-100 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl font-black tracking-tight text-[#071B2D] sm:text-4xl lg:text-5xl">
            {formatarPreco(preco)} MT
          </span>

          {desconto > 0 && (
            <span className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-extrabold text-red-600">
              -{desconto}%
            </span>
          )}
        </div>

        {temDesconto && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400">
              Preço anterior:
            </span>

            <span className="text-sm font-medium text-gray-400 line-through">
              {formatarPreco(precoAnterior)} MT
            </span>
          </div>
        )}
      </div>

      {/* DISPONIBILIDADE — SEM IVA */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-500">
          Estado do produto
        </span>

        {disponivel ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700 sm:text-sm">
            <Check size={15} />
            Disponível
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-600 sm:text-sm">
            <Package size={15} />
            Indisponível
          </span>
        )}
      </div>

      {/* ADICIONAR AO CARRINHO E QUANTIDADE */}
      <div className="mt-7">

        {!disponivel ? (
          <button
            type="button"
            disabled
            className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-200 px-4 text-sm font-bold text-gray-500"
          >
            <Package size={18} />
            Produto indisponível
          </button>
        ) : quantidade === 0 ? (
          <button
            type="button"
            onClick={aumentarQuantidade}
            className="
              flex h-12 w-full items-center justify-center gap-2
              rounded-xl bg-[#071B2D] px-4
              text-sm font-bold text-white shadow-sm
              transition hover:bg-cyan-700
              active:scale-[0.99]
              sm:h-14 sm:text-base
            "
          >
            <ShoppingCart size={19} />
            Adicionar ao carrinho
          </button>
        ) : (
          <div
            className="
              flex h-14 w-full items-center justify-between
              overflow-hidden rounded-xl
              border-2 border-[#071B2D]
              sm:h-16
            "
          >

            {/* DIMINUIR */}
            <button
              type="button"
              onClick={diminuirQuantidade}
              aria-label="Diminuir quantidade"
              className="
                flex h-full w-14 shrink-0 items-center justify-center
                bg-gray-50 text-[#071B2D]
                transition hover:bg-gray-200
              "
            >
              <Minus size={20} />
            </button>

            {/* CAMPO DE QUANTIDADE */}
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2">
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={quantidadeDigitada}
                onChange={(e) =>
                  alterarQuantidadeDigitada(e.target.value)
                }
                onBlur={confirmarQuantidadeDigitada}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                aria-label="Quantidade de produtos"
                className="
                  w-full min-w-0 border-0 bg-transparent
                  p-0 text-center text-xl font-extrabold
                  text-[#071B2D] outline-none
                  focus:ring-0
                "
              />

              <span className="text-[10px] text-gray-500">
                No carrinho
              </span>
            </div>

            {/* AUMENTAR */}
            <button
              type="button"
              onClick={aumentarQuantidade}
              aria-label="Aumentar quantidade"
              className="
                flex h-full w-14 shrink-0 items-center justify-center
                bg-[#071B2D] text-white
                transition hover:bg-cyan-700
              "
            >
              <Plus size={20} />
            </button>

          </div>
        )}
      </div>

      {/* INFORMAÇÃO ADICIONAL */}
      <div className="mt-5 rounded-xl bg-gray-50 p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          <Package
            size={18}
            className="mt-0.5 shrink-0 text-cyan-700"
          />

          <p className="text-xs leading-5 text-gray-600 sm:text-sm">
            {disponivel
              ? "Adicione este produto ao carrinho para continuar com a sua encomenda ou solicitar uma cotação."
              : "Este produto não está disponível para encomenda neste momento."}
          </p>
        </div>
      </div>

    </section>
  );
}
