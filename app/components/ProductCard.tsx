
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";

import {
  useCarrinho,
  type ProdutoCarrinho,
} from "@/app/components/carrinho/CartProvider";

interface ProductCardProps {
  product: ProdutoCarrinho;
  onAdd?: (product: ProdutoCarrinho) => void;
}

export default function ProductCard({
  product,
  onAdd,
}: ProductCardProps) {
  const {
    adicionar,
    remover,
    atualizarQuantidade,
    itens,
  } = useCarrinho();

  const galeria =
    Array.isArray(product.images) && product.images.length > 0
      ? [
          ...new Set(
            product.images.filter(
              (imagem) =>
                typeof imagem === "string" &&
                imagem.trim().length > 0
            )
          ),
        ]
      : product.image
        ? [product.image]
        : [];

  const [imagemAtual, setImagemAtual] = useState(0);

  useEffect(() => {
    setImagemAtual(0);
  }, [product.id]);

  const preco = Number(product.price ?? 0);
  const precoAnterior = Number(product.oldPrice ?? 0);

  const temPrecoAnterior =
    product.oldPrice !== null &&
    product.oldPrice !== undefined &&
    precoAnterior > preco;

  const formatarPreco = (valor: number) =>
    valor.toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const disponivel = product.inStock === true;

  const itemNoCarrinho = itens.find(
    (item) => item.produto.id === product.id
  );

  const quantidadeNoCarrinho =
    itemNoCarrinho?.quantidade ?? 0;

  const adicionarProduto = () => {
    if (!disponivel) return;

    if (onAdd) {
      onAdd(product);
      return;
    }

    adicionar(product);
  };

  const aumentarQuantidade = () => {
    if (!disponivel) return;
    adicionar(product);
  };

  const diminuirQuantidade = () => {
    if (quantidadeNoCarrinho <= 0) return;

    if (quantidadeNoCarrinho === 1) {
      remover(product.id);
      return;
    }

    atualizarQuantidade(
      product.id,
      quantidadeNoCarrinho - 1
    );
  };

  const imagemAnterior = () => {
    setImagemAtual((atual) =>
      atual === 0 ? galeria.length - 1 : atual - 1
    );
  };

  const imagemSeguinte = () => {
    setImagemAtual((atual) =>
      atual === galeria.length - 1 ? 0 : atual + 1
    );
  };

  const linkProduto =
    `/produtos/${encodeURIComponent(product.id)}`;

  return (
    <article
      className="
        group flex h-full min-w-0 w-full flex-col
        overflow-hidden rounded-lg
        border border-gray-200 bg-white
        transition duration-300
        hover:-translate-y-1 hover:shadow-lg
        sm:rounded-xl
      "
    >
      {/* IMAGEM PRINCIPAL */}
      <div
        className="
          relative aspect-[1.8/1] w-full
          shrink-0 overflow-hidden bg-white
          sm:aspect-auto sm:h-[135px]
          lg:h-[155px]
        "
      >
        {galeria.length > 0 ? (
          <>
            <Link
              href={linkProduto}
              aria-label={`Ver detalhes de ${product.name}`}
              className="absolute inset-0"
            >
              <Image
                key={galeria[imagemAtual]}
                src={galeria[imagemAtual]}
                alt={product.name}
                fill
                sizes="
                  (max-width: 639px) 33vw,
                  (max-width: 1023px) 33vw,
                  20vw
                "
                quality={85}
                className="
                  object-contain p-1
                  transition-transform duration-300
                  group-hover:scale-105
                "
              />
            </Link>

            {galeria.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={imagemAnterior}
                  aria-label="Imagem anterior"
                  className="
                    absolute left-1 top-1/2 z-10
                    flex -translate-y-1/2
                    items-center justify-center
                    rounded-full bg-white/90
                    p-0.5 text-gray-800 shadow
                    transition hover:bg-lime-400
                    sm:p-1.5
                  "
                >
                  <ChevronLeft size={14} />
                </button>

                <button
                  type="button"
                  onClick={imagemSeguinte}
                  aria-label="Imagem seguinte"
                  className="
                    absolute right-1 top-1/2 z-10
                    flex -translate-y-1/2
                    items-center justify-center
                    rounded-full bg-white/90
                    p-0.5 text-gray-800 shadow
                    transition hover:bg-lime-400
                    sm:p-1.5
                  "
                >
                  <ChevronRight size={14} />
                </button>
              </>
            )}
          </>
        ) : (
          <Link
            href={linkProduto}
            className="
              flex h-full items-center justify-center
              px-1 text-center text-[9px] text-gray-400
              sm:text-xs
            "
          >
            Sem imagem disponível
          </Link>
        )}

        {/* PROMOÇÃO */}
        {product.promotion && (
          <span
            className="
              absolute left-1 top-1 z-20
              rounded-full bg-red-600
              px-1 py-0.5 text-[7px]
              font-bold text-white
              sm:left-2 sm:top-2 sm:px-2
              sm:py-1 sm:text-[10px]
            "
          >
            Promoção
          </span>
        )}

        {/* QUANTIDADE NO CARRINHO */}
        {quantidadeNoCarrinho > 0 && (
          <span
            className="
              absolute right-1 top-1 z-20
              flex max-w-[75%] items-center gap-0.5
              truncate rounded-full bg-green-600
              px-1 py-0.5 text-[7px]
              font-bold text-white
              sm:right-2 sm:top-2 sm:gap-1
              sm:px-2 sm:py-1 sm:text-[10px]
            "
          >
            <Check size={9} />
            {quantidadeNoCarrinho} no carrinho
          </span>
        )}
      </div>

      {/* INFORMAÇÕES DO PRODUTO */}
      <div
        className="
          flex min-w-0 flex-1 flex-col
          gap-0 px-1 pb-1 pt-0
          sm:gap-0.5 sm:px-2 sm:pb-2
        "
      >
        {/* CATEGORIA */}
        <p
          className="
            truncate text-[8px] font-semibold
            leading-3 text-cyan-600
            sm:text-[11px] sm:leading-4
          "
        >
          {product.category}
        </p>

        {/* NOME */}
        <Link
          href={linkProduto}
          className="
            min-w-0 overflow-hidden
            text-[9px] font-bold leading-[13px]
            text-gray-800 hover:text-cyan-600
            sm:text-sm sm:leading-5
          "
        >
          <h3 className="line-clamp-2 break-words">
            {product.name}
          </h3>
        </Link>

        {/* PREÇOS */}
        <div className="min-w-0">
          <p
            className="
              truncate text-[10px] font-bold
              leading-4 text-[#071B2D]
              sm:text-sm sm:leading-5
            "
          >
            {formatarPreco(preco)} MT
          </p>

          {temPrecoAnterior && (
            <p
              className="
                truncate text-[7px] leading-3
                text-gray-400 line-through
                sm:text-[10px] sm:leading-4
              "
            >
              {formatarPreco(precoAnterior)} MT
            </p>
          )}
        </div>

        {/* CONTROLO DO CARRINHO */}
        <div
          className="
            mt-auto h-7 min-h-7 w-full shrink-0
            pt-1 sm:h-9 sm:min-h-9
          "
        >
          {!disponivel ? (
            <button
              type="button"
              disabled
              className="
                flex h-full w-full
                items-center justify-center
                rounded-md bg-gray-400
                text-[8px] font-semibold
                text-white opacity-80
                sm:rounded-lg sm:text-[11px]
              "
            >
              Indisponível
            </button>
          ) : quantidadeNoCarrinho === 0 ? (
            <button
              type="button"
              onClick={adicionarProduto}
              className="
                flex h-full w-full
                items-center justify-center gap-0.5
                rounded-md bg-[#071B2D]
                text-[8px] font-semibold
                text-white transition
                hover:bg-cyan-600
                sm:rounded-lg sm:gap-2
                sm:text-[11px]
              "
            >
              <Plus size={12} />
              Adicionar
            </button>
          ) : (
            <div
              className="
                flex h-full w-full
                items-center justify-between
                overflow-hidden rounded-md
                border border-[#071B2D]
                sm:rounded-lg
              "
            >
              <button
                type="button"
                onClick={diminuirQuantidade}
                aria-label="Diminuir quantidade"
                className="
                  flex h-full w-1/3
                  items-center justify-center
                  bg-gray-100 text-[#071B2D]
                  transition hover:bg-gray-200
                  active:bg-gray-300
                "
              >
                <Minus size={12} />
              </button>

              <span
                className="
                  flex h-full flex-1
                  items-center justify-center
                  text-[10px] font-bold
                  text-[#071B2D]
                  sm:text-sm
                "
              >
                {quantidadeNoCarrinho}
              </span>

              <button
                type="button"
                onClick={aumentarQuantidade}
                aria-label="Aumentar quantidade"
                className="
                  flex h-full w-1/3
                  items-center justify-center
                  bg-[#071B2D] text-white
                  transition hover:bg-cyan-600
                  active:bg-cyan-700
                "
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
