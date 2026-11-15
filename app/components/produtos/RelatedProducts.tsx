
"use client";

import type { ProdutoCarrinho } from "@/app/components/carrinho/CartProvider";
import ProductCard from "../ProductCard";

interface RelatedProductsProps {
  products: ProdutoCarrinho[];
}

export default function RelatedProducts({
  products,
}: RelatedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 w-full min-w-0 sm:mt-12">

      {/* CABEÇALHO */}
      <div className="mb-5 flex flex-col gap-2 sm:mb-7">
        <div>
          <h2 className="text-lg font-extrabold text-[#071B2D] sm:text-2xl">
            Produtos relacionados
          </h2>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Descubra outros produtos desta categoria.
          </p>
        </div>

        <div className="h-1 w-16 rounded-full bg-cyan-600" />
      </div>

      {/* GRELHA DE PRODUTOS */}
      <div className="
        grid w-full min-w-0
        grid-cols-3
        gap-2
        sm:grid-cols-3 sm:gap-4
        lg:grid-cols-5 lg:gap-4
        xl:gap-5
      ">
        {products.map((produto) => (
          <div
            key={produto.id}
            className="min-w-0"
          >
            <ProductCard product={produto} />
          </div>
        ))}
      </div>

    </section>
  );
}
