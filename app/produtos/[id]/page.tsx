
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Package,
  LoaderCircle,
} from "lucide-react";

import ProductGallery from "@/app/components/produtos/ProductGallery";
import ProductDetails from "@/app/components/produtos/ProductDetails";
import RelatedProducts from "@/app/components/produtos/RelatedProducts";

import {
  converterProdutoCarrinho,
  type RespostaProdutoDetalhe,
} from "@/app/components/produtos/types";

function ConteudoDetalhesProduto() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [dados, setDados] =
    useState<RespostaProdutoDetalhe | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // ======================================================
  // CARREGAR PRODUTO
  // ======================================================

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    async function carregarProduto() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch(
          `/api/produtos/${encodeURIComponent(id)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            resultado.error ||
              "Não foi possível encontrar o produto."
          );
        }

        setDados(resultado);
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
            : "Ocorreu um erro ao carregar o produto."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregarProduto();

    return () => controller.abort();
  }, [id]);

  // ======================================================
  // CARREGAMENTO
  // ======================================================

  if (carregando) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-[#071B2D]">
          <LoaderCircle
            className="animate-spin"
            size={36}
          />

          <p className="text-sm font-medium">
            A carregar produto...
          </p>
        </div>
      </main>
    );
  }

  // ======================================================
  // ERRO
  // ======================================================

  if (erro || !dados?.produto) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <Package
          size={48}
          className="mb-4 text-gray-400"
        />

        <h1 className="text-xl font-bold text-[#071B2D]">
          Produto não encontrado
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {erro || "Este produto não está disponível."}
        </p>

        <Link
          href="/produtos"
          className="
            mt-6 flex items-center gap-2
            rounded-lg bg-[#071B2D]
            px-5 py-3 text-sm font-semibold
            text-white transition hover:bg-cyan-700
          "
        >
          <ArrowLeft size={17} />
          Voltar aos produtos
        </Link>
      </main>
    );
  }

  // ======================================================
  // DADOS DO PRODUTO
  // ======================================================

  const produto = dados.produto;

  const produtoCarrinho =
    converterProdutoCarrinho(produto);

  const produtosRelacionados =
    (dados.relacionados ?? []).map(
      converterProdutoCarrinho
    );

  const imagens =
    Array.isArray(produto.images) &&
    produto.images.length > 0
      ? produto.images
      : produto.image
        ? [produto.image]
        : [];

  // ======================================================
  // RENDERIZAÇÃO
  // ======================================================

  return (
    <main className="min-h-screen w-full bg-gray-50">

      {/* ==================================================
          CABEÇALHO E NAVEGAÇÃO
      ================================================== */}

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto w-full max-w-[1800px] px-3 py-4 sm:px-6 lg:px-10">

          <Link
            href="/produtos"
            className="
              inline-flex items-center gap-2
              text-sm font-medium text-gray-600
              transition hover:text-cyan-600
            "
          >
            <ArrowLeft size={17} />
            Voltar aos produtos
          </Link>

          {/* CAMINHO DE NAVEGAÇÃO */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">

            <Link
              href="/"
              className="hover:text-cyan-600"
            >
              Início
            </Link>

            <span>/</span>

            <Link
              href="/produtos"
              className="hover:text-cyan-600"
            >
              Produtos
            </Link>

            <span>/</span>

            <span className="font-semibold text-[#071B2D]">
              {produto.name}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================
          CONTEÚDO PRINCIPAL
      ================================================== */}

      <div
        className="
          mx-auto w-full max-w-[1800px]
          px-3 py-5
          sm:px-6 sm:py-8
          lg:px-10 lg:py-10
        "
      >

        {/* IMAGEM E INFORMAÇÕES */}
        <section
          className="
            grid w-full grid-cols-1
            gap-4
            lg:grid-cols-2 lg:items-start
            lg:gap-8
            xl:gap-12
          "
        >

          {/* ==================================================
              GALERIA DE IMAGENS
          ================================================== */}

          <div
            className="
              min-w-0 w-full
              overflow-hidden rounded-2xl
              border border-gray-200
              bg-white p-2 shadow-sm
              sm:p-5 lg:p-6
            "
          >
            <ProductGallery
              images={imagens}
              productName={produto.name}
            />
          </div>

          {/* ==================================================
              INFORMAÇÕES DO PRODUTO
          ================================================== */}

          <div
            className="
              min-w-0 w-full
              rounded-2xl border border-gray-200
              bg-white p-4 shadow-sm
              sm:p-6 lg:p-7
            "
          >
            <ProductDetails
              product={produtoCarrinho}
              code={produto.code ?? ""}
            />
          </div>

        </section>

        {/* ==================================================
            DESCRIÇÃO
        ================================================== */}

        {produto.description?.trim() && (
          <section
            className="
              mt-6 w-full rounded-2xl
              border border-gray-200
              bg-white p-4 shadow-sm
              sm:mt-8 sm:p-6 lg:p-8
            "
          >
            <h2
              className="
                border-b border-gray-100
                pb-3 text-lg font-bold
                text-[#071B2D] sm:text-xl
              "
            >
              Descrição do produto
            </h2>

            <p
              className="
                mt-4 whitespace-pre-line
                text-sm leading-7 text-gray-600
                sm:text-base
              "
            >
              {produto.description.trim()}
            </p>
          </section>
        )}

        {/* ==================================================
            PRODUTOS RELACIONADOS
        ================================================== */}

        {produtosRelacionados.length > 0 && (
          <section className="mt-8 w-full sm:mt-12">
            <RelatedProducts
              products={produtosRelacionados}
            />
          </section>
        )}

      </div>
    </main>
  );
}

// ======================================================
// PÁGINA PRINCIPAL
// ======================================================

export default function PaginaDetalhesProduto() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3 text-[#071B2D]">
            <LoaderCircle
              className="animate-spin"
              size={36}
            />

            <p className="text-sm font-medium">
              A carregar produto...
            </p>
          </div>
        </main>
      }
    >
      <ConteudoDetalhesProduto />
    </Suspense>
  );
}
