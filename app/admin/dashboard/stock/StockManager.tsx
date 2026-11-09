
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  RefreshCw,
} from "lucide-react";

interface Produto {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  inStock: boolean;
  active: boolean;
}

interface StockManagerProps {
  produtos: Produto[];
}

type Filtro = "TODOS" | "DISPONIVEIS" | "INDISPONIVEIS";

export default function StockManager({
  produtos: produtosIniciais,
}: StockManagerProps) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const correspondePesquisa =
        produto.name.toLowerCase().includes(pesquisa.toLowerCase()) ||
        produto.category.toLowerCase().includes(pesquisa.toLowerCase());

      const correspondeFiltro =
        filtro === "TODOS" ||
        (filtro === "DISPONIVEIS" && produto.inStock) ||
        (filtro === "INDISPONIVEIS" && !produto.inStock);

      return correspondePesquisa && correspondeFiltro;
    });
  }, [produtos, pesquisa, filtro]);

  async function alterarDisponibilidade(produto: Produto) {
    if (atualizando) return;

    const novoEstado = !produto.inStock;

    setErro("");
    setAtualizando(produto.id);

    try {
      const resposta = await fetch(`/api/stock/${produto.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inStock: novoEstado,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.error || "Não foi possível atualizar a disponibilidade."
        );
      }

      setProdutos((atuais) =>
        atuais.map((item) =>
          item.id === produto.id
            ? { ...item, inStock: dados.produto.inStock }
            : item
        )
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao atualizar o produto."
      );
    } finally {
      setAtualizando(null);
    }
  }

  function formatarPreco(preco: number) {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(preco);
  }

  return (
    <div className="space-y-5">
      {/* Pesquisa e filtros */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar produto ou categoria..."
              className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["TODOS", "Todos"],
                ["DISPONIVEIS", "Disponíveis"],
                ["INDISPONIVEIS", "Indisponíveis"],
              ] as [Filtro, string][]
            ).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  filtro === valor
                    ? "bg-lime-500 text-gray-950"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mensagem de erro */}
      {erro && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <XCircle size={18} />
          {erro}
        </div>
      )}

      {/* Lista de produtos */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Produtos registados
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {produtosFiltrados.length} produto(s) encontrado(s)
            </p>
          </div>

          <Package size={21} className="text-gray-400" />
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Package size={38} className="mb-3 text-gray-300" />

            <p className="font-medium text-gray-700">
              Nenhum produto encontrado
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Experimente alterar a pesquisa ou o filtro.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {produtosFiltrados.map((produto) => {
              const estaAtualizando = atualizando === produto.id;

              return (
                <div
                  key={produto.id}
                  className="flex flex-col gap-4 p-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  {/* Informações do produto */}
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      {produto.image ? (
                        <Image
                          src={produto.image}
                          alt={produto.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package size={25} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-gray-900">
                        {produto.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {produto.category}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-700">
                        {formatarPreco(produto.price)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {produto.active ? "Publicado" : "Inactivo"}
                      </p>
                    </div>
                  </div>

                  {/* Estado e botão */}
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div
                      className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                        produto.inStock
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {produto.inStock ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <XCircle size={15} />
                      )}

                      {produto.inStock ? "Disponível" : "Indisponível"}
                    </div>

                    <button
                      type="button"
                      onClick={() => alterarDisponibilidade(produto)}
                      disabled={atualizando !== null}
                      className={`flex min-w-[145px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        produto.inStock
                          ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                          : "bg-lime-500 text-gray-950 hover:bg-lime-400"
                      }`}
                    >
                      {estaAtualizando ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          A guardar...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={15} />
                          {produto.inStock
                            ? "Indisponibilizar"
                            : "Disponibilizar"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
