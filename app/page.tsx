
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

import Hero from "./components/Hero";
import ProductCard from "./components/ProductCard";
import InfoBlocks from "./components/InfoBlocks";

import {
  useCarrinho,
  type ProdutoCarrinho,
} from "@/app/components/carrinho/CartProvider";

interface ApiProduct {
  id: string;
  name: string;
  code?: string | null;
  category?: {
    name?: string;
  } | null;
  price: number | string;
  oldPrice?: number | string | null;
  image?: string | null;
  images?: string[] | null;
  rating?: number | string | null;
  inStock?: boolean;
  promotion?: boolean;
}

function HomeContent() {
  const [products, setProducts] = useState<ProdutoCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const pesquisa = searchParams.get("pesquisa")?.trim() ?? "";

  const { adicionar } = useCarrinho();
  const carrosselRef = useRef<HTMLDivElement>(null);

  // CARREGAR PRODUTOS, COM OU SEM PESQUISA
  useEffect(() => {
    let mounted = true;

    async function carregarProdutos() {
      try {
        setLoading(true);
        setError("");

        const parametros = new URLSearchParams();

        if (pesquisa) {
          parametros.set("pesquisa", pesquisa);
        }

        const endpoint = parametros.toString()
          ? `/api/produtos?${parametros.toString()}`
          : "/api/produtos";

        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          const mensagem = await response.text();

          throw new Error(
            `Erro ${response.status}: ${
              mensagem || "Não foi possível carregar os produtos."
            }`
          );
        }

        const data: unknown = await response.json();

        // ACEITAR ARRAY DIRECTO OU RESPOSTA ENCAPSULADA
        let lista: unknown = data;

        if (
          data &&
          typeof data === "object" &&
          !Array.isArray(data)
        ) {
          const resultado = data as {
            products?: unknown;
            produtos?: unknown;
          };

          lista = resultado.products ?? resultado.produtos;
        }

        if (!Array.isArray(lista)) {
          throw new Error(
            "A API não devolveu uma lista válida de produtos."
          );
        }

        const produtosFormatados: ProdutoCarrinho[] = (
          lista as ApiProduct[]
        ).map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category?.name ?? "Sem categoria",
          price: Number(item.price) || 0,
          oldPrice:
            item.oldPrice !== null &&
            item.oldPrice !== undefined
              ? Number(item.oldPrice)
              : null,
          image: item.image ?? "",
          images: Array.isArray(item.images)
            ? item.images
            : [],
          rating: Number(item.rating ?? 0),
          inStock: item.inStock === true,
          promotion: item.promotion === true,
        }));

        if (mounted) {
          setProducts(produtosFormatados);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Ocorreu um erro ao carregar os produtos."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    carregarProdutos();

    return () => {
      mounted = false;
    };
  }, [pesquisa]);

  // ADICIONAR AO CARRINHO
  function addToCart(product: ProdutoCarrinho) {
    if (!product.inStock) return;

    adicionar(product);
  }

  // NAVEGAÇÃO DO CARROSSEL
  function deslocarCarrossel(
    direcao: "esquerda" | "direita"
  ) {
    const elemento = carrosselRef.current;

    if (!elemento) return;

    elemento.scrollBy({
      left:
        direcao === "direita"
          ? elemento.clientWidth * 0.85
          : -elemento.clientWidth * 0.85,
      behavior: "smooth",
    });
  }

  // LIMPAR PESQUISA
  function limparPesquisa() {
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      <InfoBlocks />

      <section
        id="produtos"
        className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8"
      >
        {/* CABEÇALHO */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-sm font-bold text-cyan-600">
              CATÁLOGO MSW BUSINESS
            </h2>

            <h3 className="mt-2 text-2xl font-black text-[#071B2D]">
              {pesquisa
                ? "Resultados da pesquisa"
                : "Os nossos produtos"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {pesquisa
                ? `Resultados para "${pesquisa}" por nome ou código do componente.`
                : "Explore os nossos produtos e soluções electrónicas."}
            </p>

            {pesquisa && (
              <button
                type="button"
                onClick={limparPesquisa}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-cyan-500 hover:text-cyan-600"
              >
                <X size={15} />
                Limpar pesquisa
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap text-sm text-gray-500">
              {products.length}{" "}
              {products.length === 1 ? "produto" : "produtos"}
            </span>

            {products.length > 1 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    deslocarCarrossel("esquerda")
                  }
                  aria-label="Produtos anteriores"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-[#071B2D] shadow-sm transition hover:border-cyan-500 hover:bg-cyan-500 hover:text-white"
                >
                  <ChevronLeft size={19} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deslocarCarrossel("direita")
                  }
                  aria-label="Produtos seguintes"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-[#071B2D] shadow-sm transition hover:border-cyan-500 hover:bg-cyan-500 hover:text-white"
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CARREGAMENTO */}
        {loading && (
          <div className="py-16 text-center text-gray-500">
            A carregar produtos...
          </div>
        )}

        {/* ERRO */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            {error}

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mx-auto mt-4 block rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* SEM RESULTADOS */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <Search
              size={35}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 text-lg font-bold text-gray-800">
              {pesquisa
                ? "Nenhum produto encontrado"
                : "Ainda não existem produtos"}
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {pesquisa
                ? "Não encontrámos produtos com esse nome ou código. Verifique o termo pesquisado."
                : "Os produtos adicionados pelo gestor aparecerão automaticamente nesta página."}
            </p>

            {pesquisa && (
              <button
                type="button"
                onClick={limparPesquisa}
                className="mt-5 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Ver todos os produtos
              </button>
            )}
          </div>
        )}

        {/* CARROSSEL */}
        {!loading && !error && products.length > 0 && (
          <div
            ref={carrosselRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#0891b2 #e5e7eb",
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[75%] min-w-[75%] shrink-0 snap-start sm:w-[45%] sm:min-w-[45%] md:w-[31%] md:min-w-[31%] lg:w-[23%] lg:min-w-[23%] xl:w-[18.5%] xl:min-w-[18.5%]"
              >
                <ProductCard
                  product={product}
                  onAdd={addToCart}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// COMPONENTE PRINCIPAL COM SUSPENSE
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-sm font-medium text-gray-500">
            A carregar catálogo MSW BUSINESS...
          </p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
