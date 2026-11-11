
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ChevronDown,
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

// Quantidade inicial: 3 linhas em cada tamanho de ecrã
const PRODUTOS_INICIAIS = {
  mobile: 6,
  tablet: 9,
  desktop: 12,
};

const PRODUTOS_POR_CARGA = 12;

function HomeContent() {
  const [products, setProducts] = useState<ProdutoCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limiteProdutos, setLimiteProdutos] = useState(
    PRODUTOS_INICIAIS.desktop
  );

  const searchParams = useSearchParams();
  const pesquisa = searchParams.get("pesquisa")?.trim() ?? "";

  const { adicionar } = useCarrinho();

  // CARREGAR PRODUTOS
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
          setLimiteProdutos(PRODUTOS_INICIAIS.desktop);
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

  // VER MAIS PRODUTOS
  function verMaisProdutos() {
    setLimiteProdutos((atual) => atual + PRODUTOS_POR_CARGA);
  }

  // LIMPAR PESQUISA
  function limparPesquisa() {
    window.location.href = "/";
  }

  const produtosVisiveis = products.slice(0, limiteProdutos);
  const existemMaisProdutos = limiteProdutos < products.length;

  return (
  <div className="min-h-screen bg-gray-50">

    <Hero />

    <InfoBlocks />

    <section
      id="produtos"
      className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Mantém aqui o restante código, começando pelo carregamento */}
      {/* CABEÇALHO DO CATÁLOGO */}
        <div className="mb-8">
          <h2 className="text-xl font-black uppercase tracking-wide text-[#071B2D] sm:text-2xl">
            CATÁLOGO DOS PRODUTOS
            <span className="text-cyan-600"> — MSW BUSINESS</span>
          </h2>
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

        {/* GRELHA DE PRODUTOS */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {produtosVisiveis.map((product) => (
                <div key={product.id} className="min-w-0">
                  <ProductCard
                    product={product}
                    onAdd={addToCart}
                  />
                </div>
              ))}
            </div>

            {/* BOTÃO VER MAIS */}
            {existemMaisProdutos && (
              <div className="mt-12 flex flex-col items-center">
                <button
                  type="button"
                  onClick={verMaisProdutos}
                  className="inline-flex items-center gap-3 rounded-xl bg-[#071B2D] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-cyan-700 hover:shadow-lg active:scale-95"
                >
                  Ver Mais Produtos
                  <ChevronDown size={18} />
                </button>

                <p className="mt-3 text-xs text-gray-400">
                  {products.length - produtosVisiveis.length} produtos por visualizar
                </p>
              </div>
            )}

            {/* TODOS OS PRODUTOS VISÍVEIS */}
            {!existemMaisProdutos && products.length > PRODUTOS_INICIAIS.desktop && (
              <p className="mt-12 text-center text-sm font-medium text-gray-400">
                Todos os produtos foram apresentados.
              </p>
            )}
          </>
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
