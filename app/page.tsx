
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ChevronDown,
} from "lucide-react";

import Hero from "./components/Hero";
import ProductCard from "./components/ProductCard";
import InfoBlocks from "./components/InfoBlocks";

import type { ProdutoCarrinho } from "@/app/components/carrinho/CartProvider";

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

const PRODUTOS_INICIAIS = 12;
const PRODUTOS_POR_CARGA = 12;

function HomeContent() {
  const [products, setProducts] = useState<ProdutoCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limiteProdutos, setLimiteProdutos] = useState(
    PRODUTOS_INICIAIS
  );

  const searchParams = useSearchParams();
  const pesquisa = searchParams.get("pesquisa")?.trim() ?? "";

  // =====================================================
  // CARREGAR PRODUTOS
  // =====================================================

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
          id: String(item.id),
          name: item.name ?? "",
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

          rating: Number(item.rating ?? 0) || 0,
          inStock: item.inStock === true,
          promotion: item.promotion === true,
        }));

        if (mounted) {
          setProducts(produtosFormatados);
          setLimiteProdutos(PRODUTOS_INICIAIS);
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

  // =====================================================
  // VER MAIS PRODUTOS
  // =====================================================

  function verMaisProdutos() {
    setLimiteProdutos((atual) => atual + PRODUTOS_POR_CARGA);
  }

  // =====================================================
  // LIMPAR PESQUISA
  // =====================================================

  function limparPesquisa() {
    window.location.href = "/";
  }

  const produtosVisiveis = products.slice(
    0,
    limiteProdutos
  );

  const existemMaisProdutos =
    limiteProdutos < products.length;

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}
      <Hero />

      {/* INFORMAÇÕES */}
      <InfoBlocks />

      {/* CATÁLOGO */}
      <section
        id="produtos"
        className="mx-auto max-w-[1600px] px-2 py-6 sm:px-6 sm:py-8 lg:px-8"
      >

        {/* CABEÇALHO */}
        <div className="mb-5 sm:mb-8">
          <h2 className="text-base font-black uppercase tracking-wide text-[#071B2D] sm:text-2xl">
            CATÁLOGO DOS PRODUTOS
          </h2>

          {pesquisa && (
            <p className="mt-2 text-xs text-gray-500 sm:text-sm">
              Resultados para:{" "}
              <strong className="text-gray-800">
                {pesquisa}
              </strong>
            </p>
          )}
        </div>

        {/* CARREGAMENTO */}
        {loading && (
          <div className="py-16 text-center text-gray-500">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-cyan-600" />
            A carregar produtos...
          </div>
        )}

        {/* ERRO */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            <p className="text-sm font-medium">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mx-auto mt-4 block rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* SEM RESULTADOS */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center sm:p-10">

            <Search
              size={35}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 text-base font-bold text-gray-800 sm:text-lg">
              {pesquisa
                ? "Nenhum produto encontrado"
                : "Ainda não existem produtos"}
            </h3>

            <p className="mt-2 text-xs text-gray-500 sm:text-sm">
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

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-4">
              {produtosVisiveis.map((product) => (
                <div
                  key={product.id}
                  className="min-w-0"
                >
                  <ProductCard product={product} />
                </div>
              ))}

            </div>

            {/* VER MAIS */}
            {existemMaisProdutos && (
              <div className="mt-8 flex flex-col items-center sm:mt-12">

                <button
                  type="button"
                  onClick={verMaisProdutos}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#071B2D] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-cyan-700 hover:shadow-lg active:scale-95 sm:gap-3 sm:px-8 sm:py-3.5 sm:text-sm"
                >
                  Ver Mais Produtos

                  <ChevronDown size={18} />
                </button>

                <p className="mt-3 text-[10px] text-gray-400 sm:text-xs">
                  {products.length - produtosVisiveis.length} produtos por visualizar
                </p>

              </div>
            )}

            {/* TODOS APRESENTADOS */}
            {!existemMaisProdutos &&
              products.length > PRODUTOS_INICIAIS && (
                <p className="mt-10 text-center text-xs font-medium text-gray-400 sm:text-sm">
                  Todos os produtos foram apresentados.
                </p>
              )}

          </>
        )}

      </section>
    </div>
  );
}

// =======================================================
// COMPONENTE PRINCIPAL COM SUSPENSE
// =======================================================

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
