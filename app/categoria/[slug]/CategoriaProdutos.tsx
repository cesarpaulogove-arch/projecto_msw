
"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";

import {
  useCarrinho,
  type ProdutoCarrinho,
} from "@/app/components/carrinho/CartProvider";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  image: string;
  images: string[];
  rating: number;
  inStock: boolean;
  promotion: boolean;
}

type Ordenacao = "maior" | "menor" | null;

export default function CategoriaProdutos({
  produtos,
}: {
  produtos: Product[];
}) {
  const [ordenacao, setOrdenacao] = useState<Ordenacao>(null);

  const { adicionar } = useCarrinho();

  const produtosOrdenados = useMemo(() => {
    const lista = [...produtos];

    if (ordenacao === "maior") {
      lista.sort((a, b) => b.price - a.price);
    }

    if (ordenacao === "menor") {
      lista.sort((a, b) => a.price - b.price);
    }

    return lista;
  }, [produtos, ordenacao]);

  function adicionarAoCarrinho(product: Product) {
    if (!product.inStock) return;

    const produto: ProdutoCarrinho = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
      images: product.images ?? [],
      rating: product.rating,
      inStock: product.inStock,
      promotion: product.promotion,
    };

    adicionar(produto);
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#071B2D]">
            Produtos disponíveis
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {produtosOrdenados.length} produtos encontrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="mr-2 text-sm font-medium text-gray-600">
            Ordenar preço:
          </span>

          <button
            type="button"
            onClick={() =>
              setOrdenacao(ordenacao === "maior" ? null : "maior")
            }
            title="Preço maior para menor"
            aria-label="Ordenar do preço maior para o menor"
            aria-pressed={ordenacao === "maior"}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
              ordenacao === "maior"
                ? "border-cyan-600 bg-cyan-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-cyan-500 hover:text-cyan-600"
            }`}
          >
            <ArrowUp size={20} />
          </button>

          <button
            type="button"
            onClick={() =>
              setOrdenacao(ordenacao === "menor" ? null : "menor")
            }
            title="Preço menor para maior"
            aria-label="Ordenar do preço menor para o maior"
            aria-pressed={ordenacao === "menor"}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
              ordenacao === "menor"
                ? "border-cyan-600 bg-cyan-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-cyan-500 hover:text-cyan-600"
            }`}
          >
            <ArrowDown size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {produtosOrdenados.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={adicionarAoCarrinho}
          />
        ))}
      </div>
    </>
  );
}
