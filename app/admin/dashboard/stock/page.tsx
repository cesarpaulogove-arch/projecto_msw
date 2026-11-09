
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import StockManager from "./StockManager";
import {
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

async function GestaoStock() {
  const produtos = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const totalProdutos = produtos.length;
  const disponiveis = produtos.filter(
    (produto) => produto.inStock
  ).length;
  const indisponiveis = totalProdutos - disponiveis;

  const produtosFormatados = produtos.map((produto) => ({
    id: produto.id,
    name: produto.name,
    image: produto.image,
    price: Number(produto.price),
    category: produto.category?.name ?? "Sem categoria",
    inStock: produto.inStock,
    active: produto.active,
  }));

  return (
    <div className="space-y-6">
      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Total de produtos
            </p>
            <Package className="text-gray-400" size={21} />
          </div>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {totalProdutos}
          </p>
        </div>

        <div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Disponíveis
            </p>
            <CheckCircle2 className="text-green-600" size={21} />
          </div>

          <p className="mt-3 text-3xl font-bold text-green-600">
            {disponiveis}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Indisponíveis
            </p>
            <XCircle className="text-red-500" size={21} />
          </div>

          <p className="mt-3 text-3xl font-bold text-red-500">
            {indisponiveis}
          </p>
        </div>
      </div>

      {/* Gestão individual */}
      <StockManager produtos={produtosFormatados} />
    </div>
  );
}

function StockLoading() {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2 size={30} className="animate-spin text-lime-600" />
        <p className="text-sm">A carregar produtos...</p>
      </div>
    </div>
  );
}

export default function StockPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-100 text-lime-700">
            <Package size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestão de disponibilidade
            </h1>
            <p className="text-sm text-gray-500">
              Controle individual da disponibilidade dos produtos.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<StockLoading />}>
        <GestaoStock />
      </Suspense>
    </div>
  );
}
