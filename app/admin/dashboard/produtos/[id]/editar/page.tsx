import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Pencil } from "lucide-react";

import { prisma } from "@/lib/prisma";
import ProductForm from "@/app/components/admin/ProductForm";

interface EditarProdutoPageProps {
  params: Promise<{
    id: string;
  }>;
}

function CarregamentoProduto() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-20 rounded-xl bg-gray-100" />
      <div className="h-[600px] rounded-xl border border-gray-200 bg-gray-100" />
    </div>
  );
}

export default function EditarProdutoPage({
  params,
}: EditarProdutoPageProps) {
  return (
    <Suspense fallback={<CarregamentoProduto />}>
      <EditarProdutoConteudo params={params} />
    </Suspense>
  );
}

async function EditarProdutoConteudo({
  params,
}: EditarProdutoPageProps) {
  const { id } = await params;

  const [produto, categorias] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
    }),

    prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!produto) {
    notFound();
  }

  const produtoInicial = {
    id: produto.id,
    code: produto.code ?? "",
    name: produto.name,
    description: produto.description ?? "",
    price: Number(produto.price),
    oldPrice:
      produto.oldPrice !== null
        ? Number(produto.oldPrice)
        : "",
    image: produto.image,
    images: produto.images,
    inStock: produto.inStock,
    categoryId: produto.categoryId,
    featured: produto.featured,
    active: produto.active,
    promotion: produto.promotion,
  };

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
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <Pencil size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar produto
            </h1>

            <p className="text-sm text-gray-500">
              Actualize o código, as informações, os preços e as imagens do produto.
            </p>
          </div>
        </div>
      </div>

      <ProductForm
        categorias={categorias}
        produtoInicial={produtoInicial}
      />
    </div>
  );
}