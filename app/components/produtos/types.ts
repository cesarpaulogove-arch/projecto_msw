
import type { ProdutoCarrinho } from "@/app/components/carrinho/CartProvider";

// ======================================================
// TIPOS DA API
// ======================================================

export interface CategoriaProduto {
  id: string;
  name: string;
}

export interface ProdutoAPI {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  oldPrice: number | string | null;
  ivaRate: number | string;
  inStock: boolean;
  image: string;
  images: string[];
  featured: boolean;
  active: boolean;
  promotion: boolean;
  categoryId: string;
  category: CategoriaProduto;
  createdAt?: string;
  updatedAt?: string;
}

export interface RespostaProdutoDetalhe {
  produto: ProdutoAPI;
  relacionados: ProdutoAPI[];
}

// ======================================================
// CONVERSÃO DOS DADOS DA API PARA O CARRINHO
// ======================================================

export function converterProdutoCarrinho(
  produto: ProdutoAPI
): ProdutoCarrinho {
  const imagens = Array.isArray(produto.images)
    ? produto.images.filter(
        (imagem): imagem is string =>
          typeof imagem === "string" && imagem.length > 0
      )
    : [];

  const imagemPrincipal =
    produto.image || imagens[0] || "/images/produto-sem-imagem.png";

  const todasImagens = [
    imagemPrincipal,
    ...imagens.filter((imagem) => imagem !== imagemPrincipal),
  ];

  return {
    id: produto.id,
    name: produto.name,
    category: produto.category?.name ?? "Sem categoria",
    price: Number(produto.price),
    oldPrice:
      produto.oldPrice === null
        ? null
        : Number(produto.oldPrice),
    image: imagemPrincipal,
    images: todasImagens,
    rating: 0,
    inStock: Boolean(produto.inStock),
    promotion: Boolean(produto.promotion),
  };
}
