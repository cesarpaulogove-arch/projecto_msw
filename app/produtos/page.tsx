
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

import {
  Search,
  X,
  SlidersHorizontal,
  Package,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import {
  converterProdutoCarrinho,
  type ProdutoAPI,
} from "@/app/components/produtos/types";

import ProductCard from "../components/ProductCard";

interface Categoria {
  id: string;
  name: string;
}

function ConteudoProdutos() {
  const searchParams = useSearchParams();

  const [produtos, setProdutos] = useState<ProdutoAPI[]>([]);

  const [pesquisa, setPesquisa] = useState(
    searchParams.get("pesquisa") ?? ""
  );

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("todas");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // ======================================================
  // CARREGAR PRODUTOS
  // ======================================================

  const carregarProdutos = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch("/api/produtos", {
          cache: "no-store",
          signal,
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            resultado.error ||
              "Não foi possível carregar os produtos."
          );
        }

        if (!Array.isArray(resultado)) {
          throw new Error(
            "A resposta da API não é válida."
          );
        }

        setProdutos(resultado);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao carregar os produtos."
        );
      } finally {
        if (!signal?.aborted) {
          setCarregando(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();

    carregarProdutos(controller.signal);

    return () => controller.abort();
  }, [carregarProdutos]);

  // ======================================================
  // CATEGORIAS
  // ======================================================

  const categorias = useMemo<Categoria[]>(() => {
    const mapa = new Map<string, Categoria>();

    produtos.forEach((produto) => {
      if (produto.category?.id && produto.category?.name) {
        mapa.set(produto.category.id, {
          id: produto.category.id,
          name: produto.category.name,
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt")
    );
  }, [produtos]);

  // ======================================================
  // FILTRAR PRODUTOS
  // ======================================================

  const produtosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase("pt");

    return produtos.filter((produto) => {
      const correspondePesquisa =
        !termo ||
        produto.name.toLocaleLowerCase("pt").includes(termo) ||
        produto.code?.toLocaleLowerCase("pt").includes(termo) ||
        produto.category?.name
          ?.toLocaleLowerCase("pt")
          .includes(termo);

      const correspondeCategoria =
        categoriaSelecionada === "todas" ||
        produto.categoryId === categoriaSelecionada;

      return correspondePesquisa && correspondeCategoria;
    });
  }, [produtos, pesquisa, categoriaSelecionada]);

  // ======================================================
  // LIMPAR FILTROS
  // ======================================================

  const limparFiltros = () => {
    setPesquisa("");
    setCategoriaSelecionada("todas");
  };

  // ======================================================
  // RENDERIZAÇÃO
  // ======================================================

  return (
    <main className="min-h-screen bg-gray-50 pb-12">

      {/* CABEÇALHO */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1800px] px-4 py-7 sm:px-6 lg:px-10">

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
              MSW TECH
            </span>

            <h1 className="text-2xl font-extrabold text-[#071B2D] sm:text-3xl">
              Todos os produtos
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-gray-500">
              Explore o nosso catálogo de componentes eletrónicos,
              sensores, placas de desenvolvimento e soluções
              tecnológicas.
            </p>
          </div>

          {/* PESQUISA E CATEGORIAS */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">

            {/* PESQUISA */}
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar produtos..."
                className="
                  h-12 w-full rounded-xl
                  border border-gray-200
                  bg-gray-50 pl-11 pr-11
                  text-sm text-[#071B2D]
                  outline-none transition
                  placeholder:text-gray-400
                  focus:border-cyan-600
                  focus:bg-white
                  focus:ring-2 focus:ring-cyan-100
                "
              />

              {pesquisa && (
                <button
                  type="button"
                  onClick={() => setPesquisa("")}
                  aria-label="Limpar pesquisa"
                  className="
                    absolute right-3 top-1/2
                    -translate-y-1/2 rounded-full
                    p-1 text-gray-400
                    hover:bg-gray-200 hover:text-gray-700
                  "
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* FILTRO DE CATEGORIA */}
            <div className="relative sm:w-64">
              <SlidersHorizontal
                size={17}
                className="
                  pointer-events-none absolute left-4
                  top-1/2 -translate-y-1/2 text-gray-400
                "
              />

              <select
                value={categoriaSelecionada}
                onChange={(e) =>
                  setCategoriaSelecionada(e.target.value)
                }
                className="
                  h-12 w-full appearance-none
                  rounded-xl border border-gray-200
                  bg-gray-50 pl-11 pr-4
                  text-sm font-medium text-[#071B2D]
                  outline-none transition
                  focus:border-cyan-600
                  focus:ring-2 focus:ring-cyan-100
                "
              >
                <option value="todas">
                  Todas as categorias
                </option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* CATÁLOGO */}
      <section
        className="
          mx-auto max-w-[1800px]
          px-3 py-7 sm:px-6 lg:px-10
        "
      >

        {/* CONTAGEM */}
        {!carregando && !erro && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              <strong className="text-[#071B2D]">
                {produtosFiltrados.length}
              </strong>{" "}
              {produtosFiltrados.length === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>

            {(pesquisa || categoriaSelecionada !== "todas") && (
              <button
                type="button"
                onClick={limparFiltros}
                className="
                  shrink-0 text-xs font-semibold
                  text-cyan-700 hover:underline
                "
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* CARREGAMENTO */}
        {carregando && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <LoaderCircle
              size={36}
              className="animate-spin text-cyan-700"
            />

            <p className="text-sm font-medium text-gray-500">
              A carregar produtos...
            </p>
          </div>
        )}

        {/* ERRO */}
        {!carregando && erro && (
          <div
            className="
              flex min-h-[300px] flex-col
              items-center justify-center
              rounded-2xl border border-gray-200
              bg-white px-5 text-center
            "
          >
            <Package
              size={42}
              className="mb-4 text-gray-300"
            />

            <h2 className="text-lg font-bold text-[#071B2D]">
              Não foi possível carregar os produtos
            </h2>

            <p className="mt-2 max-w-md text-sm text-gray-500">
              {erro}
            </p>

            <button
              type="button"
              onClick={() => carregarProdutos()}
              className="
                mt-5 flex items-center gap-2
                rounded-lg bg-[#071B2D]
                px-5 py-3 text-sm font-semibold
                text-white transition hover:bg-cyan-700
              "
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        )}

        {/* LISTA DE PRODUTOS */}
        {!carregando &&
          !erro &&
          produtosFiltrados.length > 0 && (
            <div
              className="
                grid grid-cols-3 gap-2
                sm:grid-cols-3 sm:gap-3
                lg:grid-cols-5 lg:gap-4
              "
            >
              {produtosFiltrados.map((produto) => (
                <ProductCard
                  key={produto.id}
                  product={converterProdutoCarrinho(produto)}
                />
              ))}
            </div>
          )}

        {/* CATÁLOGO VAZIO */}
        {!carregando &&
          !erro &&
          produtosFiltrados.length === 0 && (
            <div
              className="
                flex min-h-[300px] flex-col
                items-center justify-center
                rounded-2xl border border-gray-200
                bg-white px-5 text-center
              "
            >
              <div
                className="
                  mb-4 flex h-16 w-16
                  items-center justify-center
                  rounded-full bg-gray-100
                "
              >
                <Package
                  size={30}
                  className="text-gray-400"
                />
              </div>

              <h2 className="text-lg font-bold text-[#071B2D]">
                Nenhum produto encontrado
              </h2>

              <p className="mt-2 max-w-md text-sm text-gray-500">
                Não existem produtos correspondentes à tua
                pesquisa ou categoria selecionada.
              </p>

              <button
                type="button"
                onClick={limparFiltros}
                className="
                  mt-5 rounded-lg bg-[#071B2D]
                  px-5 py-3 text-sm font-semibold
                  text-white transition hover:bg-cyan-700
                "
              >
                Ver todos os produtos
              </button>
            </div>
          )}
      </section>
    </main>
  );
}

// ======================================================
// PÁGINA PRINCIPAL
// ======================================================

export default function PaginaProdutos() {
  return (
    <Suspense
      fallback={
        <main
          className="
            flex min-h-[60vh] items-center
            justify-center bg-gray-50
          "
        >
          <LoaderCircle
            size={36}
            className="animate-spin text-cyan-700"
          />
        </main>
      }
    >
      <ConteudoProdutos />
    </Suspense>
  );
}
