
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

  // ======================================================
  // GALERIA DE IMAGENS
  // ======================================================

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

  // ======================================================
  // PREÇOS
  // ======================================================

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

  // ======================================================
  // DISPONIBILIDADE E CARRINHO
  // ======================================================

  const disponivel = product.inStock === true;

  const itemNoCarrinho = itens.find(
    (item) => item.produto.id === product.id
  );

  const quantidadeNoCarrinho =
    itemNoCarrinho?.quantidade ?? 0;

  // ======================================================
  // FUNÇÕES DO CARRINHO
  // ======================================================

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

  // ======================================================
  // NAVEGAÇÃO DA GALERIA
  // ======================================================

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

  // ======================================================
  // RENDERIZAÇÃO
  // ======================================================

  return (
    <article
      className="
        group flex h-[300px] min-w-0 w-full flex-col
        overflow-hidden rounded-xl
        border border-gray-200 bg-white
        transition duration-300
        hover:-translate-y-1 hover:shadow-lg
        sm:h-[310px]
        lg:h-[290px]
      "
    >

      {/* ==================================================
          IMAGEM PRINCIPAL DO PRODUTO
      ================================================== */}

      <div
        className="
          relative h-[155px] min-h-[155px] shrink-0
          overflow-hidden bg-white
          sm:h-[165px] sm:min-h-[165px]
          lg:h-[155px] lg:min-h-[155px]
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

            {/* SETA ANTERIOR */}
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
                    p-1 text-gray-800 shadow
                    transition hover:bg-lime-400
                    sm:p-1.5
                  "
                >
                  <ChevronLeft size={17} />
                </button>

                {/* SETA SEGUINTE */}
                <button
                  type="button"
                  onClick={imagemSeguinte}
                  aria-label="Imagem seguinte"
                  className="
                    absolute right-1 top-1/2 z-10
                    flex -translate-y-1/2
                    items-center justify-center
                    rounded-full bg-white/90
                    p-1 text-gray-800 shadow
                    transition hover:bg-lime-400
                    sm:p-1.5
                  "
                >
                  <ChevronRight size={17} />
                </button>
              </>
            )}
          </>
        ) : (
          <Link
            href={linkProduto}
            className="
              flex h-full items-center justify-center
              px-2 text-center text-xs text-gray-400
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
              px-2 py-1 text-[9px]
              font-bold text-white
              sm:left-2 sm:top-2 sm:text-[10px]
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
              flex max-w-[75%] items-center gap-1
              truncate rounded-full bg-green-600
              px-2 py-1 text-[9px]
              font-bold text-white
              sm:right-2 sm:top-2 sm:text-[10px]
            "
          >
            <Check size={11} />
            {quantidadeNoCarrinho} no carrinho
          </span>
        )}
      </div>

      {/* ==================================================
          INFORMAÇÕES DO PRODUTO
      ================================================== */}

      <div
        className="
          flex min-h-0 min-w-0 flex-1 flex-col
          p-1.5 sm:p-2
        "
      >

        {/* CATEGORIA */}
        <p
          className="
            h-4 shrink-0 truncate
            text-[10px] font-semibold
            text-cyan-600 sm:text-[11px]
          "
        >
          {product.category}
        </p>

        {/* NOME DO PRODUTO */}
        <Link
          href={linkProduto}
          className="
            mt-0.5 h-9 shrink-0 min-w-0
            overflow-hidden text-[11px]
            font-bold leading-[17px]
            text-gray-800 hover:text-cyan-600
            sm:mt-1 sm:h-10
            sm:text-sm sm:leading-5
          "
        >
          <h3 className="line-clamp-2 break-words">
            {product.name}
          </h3>
        </Link>

        {/* ==================================================
            PREÇOS — SEM IVA OU IMPOSTOS
        ================================================== */}

        <div className="mt-1 min-w-0 shrink-0">
          <p
            className="
              truncate text-xs font-bold
              text-[#071B2D] sm:text-sm
            "
          >
            {formatarPreco(preco)} MT
          </p>

          {temPrecoAnterior && (
            <p
              className="
                truncate text-[9px]
                text-gray-400 line-through
                sm:text-[10px]
              "
            >
              {formatarPreco(precoAnterior)} MT
            </p>
          )}
        </div>

        {/* ==================================================
            CONTROLO DO CARRINHO
        ================================================== */}

        <div
          className="
            mt-auto h-8 min-h-8 w-full shrink-0
            sm:h-9 sm:min-h-9
          "
        >

          {/* INDISPONÍVEL */}
          {!disponivel ? (
            <button
              type="button"
              disabled
              className="
                flex h-full w-full
                items-center justify-center
                rounded-lg bg-gray-400
                text-[10px] font-semibold
                text-white opacity-80
                sm:text-[11px]
              "
            >
              Indisponível
            </button>
          ) : quantidadeNoCarrinho === 0 ? (

            /* ADICIONAR AO CARRINHO */
            <button
              type="button"
              onClick={adicionarProduto}
              className="
                flex h-full w-full
                items-center justify-center gap-1
                rounded-lg bg-[#071B2D]
                text-[10px] font-semibold
                text-white transition
                hover:bg-cyan-600
                sm:gap-2 sm:text-[11px]
              "
            >
              <Plus size={14} />
              Adicionar
            </button>
          ) : (

            /* ALTERAR QUANTIDADE */
            <div
              className="
                flex h-full w-full
                items-center justify-between
                overflow-hidden rounded-lg
                border border-[#071B2D]
              "
            >

              {/* DIMINUIR */}
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
                <Minus size={14} />
              </button>

              {/* QUANTIDADE */}
              <span
                className="
                  flex h-full flex-1
                  items-center justify-center
                  text-xs font-bold
                  text-[#071B2D] sm:text-sm
                "
              >
                {quantidadeNoCarrinho}
              </span>

              {/* AUMENTAR */}
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
                <Plus size={14} />
              </button>

            </div>
          )}
        </div>
      </div>
    </article>
  );
}
