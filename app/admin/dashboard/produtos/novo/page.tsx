import "server-only";

import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, PackagePlus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import ProductForm from "@/app/components/admin/ProductForm";

async function NovoProdutoConteudo() {
  const categorias = await prisma.category.findMany({
    where: {
      active: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (categorias.length === 0) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
        <h2 className="font-semibold text-yellow-800">
          Nenhuma categoria disponível
        </h2>

        <p className="mt-2 text-sm text-yellow-700">
          Antes de adicionar produtos, precisa de criar pelo menos
          uma categoria.
        </p>

        <Link
          href="/admin/dashboard/categorias"
          className="mt-4 inline-flex rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
        >
          Gerir categorias
        </Link>
      </div>
    );
  }

  return <ProductForm categorias={categorias} />;
}

export default function NovoProdutoPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/dashboard/produtos"
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Voltar aos produtos
        </Link>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-green-100 p-3 text-green-700">
            <PackagePlus size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Adicionar produto
            </h1>

            <p className="text-sm text-gray-500">
              Preencha os dados para adicionar um novo produto à loja.
            </p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border bg-white p-8 text-sm text-gray-500">
            A carregar categorias e formulário...
          </div>
        }
      >
        <NovoProdutoConteudo />
      </Suspense>
    </div>
  );
}