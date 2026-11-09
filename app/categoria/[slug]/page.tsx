
export const instant = false;

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CategoriaProdutos from "./CategoriaProdutos";

interface CategoriaPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoriaPage({
  params,
}: CategoriaPageProps) {
  const { slug } = await params;

  // Procurar categoria ativa
  const categoria = await prisma.category.findFirst({
    where: {
      slug,
      active: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!categoria) {
    notFound();
  }

  // Buscar produtos ativos, incluindo os indisponíveis
  const produtos = await prisma.product.findMany({
    where: {
      categoryId: categoria.id,
      active: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      oldPrice: true,
      image: true,
      images: true,
      rating: true,
      inStock: true,
      promotion: true,
      createdAt: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Preparar dados para o componente cliente
  const produtosFormatados = produtos.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category.name,
    price: Number(item.price),
    oldPrice:
      item.oldPrice !== null
        ? Number(item.oldPrice)
        : null,
    image: item.image,
    images: item.images ?? [],
    rating: Number(item.rating ?? 0),
    inStock: item.inStock,
    promotion: item.promotion,
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">

        {/* Cabeçalho da categoria */}
        <div className="mb-8">
          <p className="text-sm font-bold text-cyan-600">
            CATÁLOGO MSW BUSINESS
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#071B2D]">
            {categoria.name}
          </h1>

          {categoria.description && (
            <p className="mt-2 text-sm text-gray-500">
              {categoria.description}
            </p>
          )}

          <p className="mt-3 text-sm text-gray-500">
            {produtosFormatados.length}{" "}
            {produtosFormatados.length === 1
              ? "produto nesta categoria"
              : "produtos nesta categoria"}
          </p>
        </div>

        {/* Listagem de produtos */}
        {produtosFormatados.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-gray-800">
              Ainda não existem produtos nesta categoria
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Os produtos adicionados pelo gestor aparecerão aqui.
            </p>
          </div>
        ) : (
          <CategoriaProdutos produtos={produtosFormatados} />
        )}

      </section>
    </main>
  );
}
