"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
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
  const { adicionar, itens } = useCarrinho();

  const galeriaRef = useRef<HTMLDivElement>(null);

  const galeria =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  const preco = Number(product.price ?? 0);
  const precoAnterior = Number(product.oldPrice ?? 0);

  const disponivel = product.inStock === true;

  const temPrecoAnterior =
    product.oldPrice !== null &&
    product.oldPrice !== undefined &&
    precoAnterior > preco;

  const itemNoCarrinho = itens.find(
    (item) => item.produto.id === product.id
  );

  const quantidadeNoCarrinho =
    itemNoCarrinho?.quantidade ?? 0;

  const formatarPreco = (valor: number) =>
    valor.toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const adicionarProduto = () => {
    if (!disponivel) return;

    if (onAdd) {
      onAdd(product);
      return;
    }

    adicionar(product);
  };

  const deslocarGaleria = (
    direcao: "esquerda" | "direita"
  ) => {
    const elemento = galeriaRef.current;

    if (!elemento) return;

    elemento.scrollBy({
      left:
        direcao === "direita"
          ? elemento.clientWidth
          : -elemento.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <article className="group flex h-[300px] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* GALERIA DE IMAGENS */}
      <div className="relative h-[144px] min-h-[144px] shrink-0 overflow-hidden bg-gray-100">

        {galeria.length > 0 ? (
          <>
            <div
              ref={galeriaRef}
              className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {galeria.map((imagem, index) => (
                <div
                  key={`${imagem}-${index}`}
                  className="relative h-full min-w-full shrink-0 snap-center"
                >
                  <Image
                    src={imagem}
                    alt={`${product.name} - imagem ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* CONTROLOS DA GALERIA */}
            {galeria.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => deslocarGaleria("esquerda")}
                  aria-label="Imagem anterior"
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-800 shadow transition hover:bg-lime-400"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => deslocarGaleria("direita")}
                  aria-label="Imagem seguinte"
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-800 shadow transition hover:bg-lime-400"
                >
                  <ChevronRight size={17} />
                </button>

                <span className="absolute bottom-2 right-2 z-10 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                  {galeria.length} imagens
                </span>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Sem imagem disponível
          </div>
        )}

        {/* PROMOÇÃO */}
        {product.promotion && (
          <span className="absolute left-2 top-2 z-20 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white">
            Promoção
          </span>
        )}

        {/* QUANTIDADE NO CARRINHO */}
        {quantidadeNoCarrinho > 0 && (
          <span className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-[10px] font-bold text-white">
            <Check size={12} />
            {quantidadeNoCarrinho} no carrinho
          </span>
        )}
      </div>

{/* INFORMAÇÕES DO PRODUTO */}
<div className="flex min-h-0 flex-1 flex-col p-2">

  {/* CATEGORIA */}
  <p className="h-4 shrink-0 truncate text-[11px] font-semibold text-cyan-600">
    {product.category}
  </p>

  {/* NOME */}
  <h3 className="mt-1 h-10 shrink-0 line-clamp-2 overflow-hidden text-sm font-bold leading-5 text-gray-800">
    {product.name}
  </h3>

  {/* PREÇOS */}
  <div className="mt-1 shrink-0">
    <p className="truncate text-sm font-bold text-[#071B2D]">
      {formatarPreco(preco)} MT
    </p>

    {temPrecoAnterior && (
      <p className="truncate text-[10px] text-gray-400 line-through">
        {formatarPreco(precoAnterior)} MT
      </p>
    )}
  </div>

  {/* BOTÃO DO CARRINHO */}
  <button
    type="button"
    onClick={adicionarProduto}
    disabled={!disponivel}
    className={`mt-auto flex h-9 min-h-9 w-full shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-[11px] font-semibold text-white transition ${
      disponivel
        ? "bg-[#071B2D] hover:bg-cyan-600 cursor-pointer"
        : "bg-gray-400 cursor-not-allowed opacity-80"
    }`}
  >
    <ShoppingCart size={14} />

    {disponivel ? "Disponível" : "Indisponível"}
  </button>
</div>
    </article>
  );
}