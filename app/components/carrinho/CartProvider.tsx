
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface ProdutoCarrinho {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  image: string;
  images: string[];
  rating: number;
  inStock: boolean;
  promotion: boolean;
}

export interface ItemCarrinho {
  produto: ProdutoCarrinho;
  quantidade: number;
}

interface ContextoCarrinho {
  itens: ItemCarrinho[];
  adicionar: (produto: ProdutoCarrinho) => void;
  remover: (produtoId: string) => void;
  atualizarQuantidade: (
    produtoId: string,
    quantidade: number
  ) => void;
  limpar: () => void;
  total: number;
  quantidadeTotal: number;
}

const CarrinhoContext = createContext<
  ContextoCarrinho | undefined
>(undefined);

const STORAGE_KEY = "msw_carrinho";

// Validar produto recebido do armazenamento
function validarItem(item: unknown): item is ItemCarrinho {
  if (!item || typeof item !== "object") return false;

  const valor = item as Record<string, unknown>;
  const produto = valor.produto;

  if (!produto || typeof produto !== "object") return false;

  const p = produto as Record<string, unknown>;

  const imagensValidas =
    p.images === undefined ||
    (
      Array.isArray(p.images) &&
      p.images.every(
        (imagem) => typeof imagem === "string"
      )
    );

  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.category === "string" &&
    typeof p.price === "number" &&
    Number.isFinite(p.price) &&
    (
      p.oldPrice === null ||
      (
        typeof p.oldPrice === "number" &&
        Number.isFinite(p.oldPrice)
      )
    ) &&
    typeof p.image === "string" &&
    imagensValidas &&
    (
      p.rating === undefined ||
      (
        typeof p.rating === "number" &&
        Number.isFinite(p.rating)
      )
    ) &&
    typeof p.inStock === "boolean" &&
    typeof p.promotion === "boolean" &&
    typeof valor.quantidade === "number" &&
    Number.isSafeInteger(valor.quantidade) &&
    valor.quantidade > 0
  );
}

export function CarrinhoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  // Recuperar carrinho
  useEffect(() => {
    try {
      const dados = localStorage.getItem(STORAGE_KEY);

      if (dados) {
        const parsed: unknown = JSON.parse(dados);

        if (Array.isArray(parsed)) {
          const validos: ItemCarrinho[] = parsed
            .filter(validarItem)
            .map((item) => ({
              produto: {
                ...item.produto,
                rating: item.produto.rating ?? 0,
                images: item.produto.images ?? [],
              },
              quantidade: item.quantidade,
            }));

          setItens(validos);
        }
      }
    } catch (error) {
      console.error(
        "Erro ao recuperar carrinho:",
        error
      );

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // LocalStorage indisponível.
      }
    } finally {
      setCarregado(true);
    }
  }, []);

  // Guardar carrinho
  useEffect(() => {
    if (!carregado) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(itens)
      );
    } catch (error) {
      console.error(
        "Erro ao guardar carrinho:",
        error
      );
    }
  }, [itens, carregado]);

  // Adicionar produto
  function adicionar(produto: ProdutoCarrinho) {
    if (
      !produto.id ||
      !Number.isFinite(produto.price) ||
      produto.price < 0 ||
      produto.inStock !== true
    ) {
      return;
    }

    const produtoNormalizado: ProdutoCarrinho = {
      ...produto,
      images: produto.images ?? [],
    };

    setItens((atuais) => {
      const existente = atuais.find(
        (item) => item.produto.id === produto.id
      );

      if (existente) {
        return atuais.map((item) =>
          item.produto.id === produto.id
            ? {
                produto: produtoNormalizado,
                quantidade: item.quantidade + 1,
              }
            : item
        );
      }

      return [
        ...atuais,
        {
          produto: produtoNormalizado,
          quantidade: 1,
        },
      ];
    });
  }

  // Remover produto
  function remover(produtoId: string) {
    setItens((atuais) =>
      atuais.filter(
        (item) => item.produto.id !== produtoId
      )
    );
  }

  // Actualizar quantidade
  function atualizarQuantidade(
    produtoId: string,
    quantidade: number
  ) {
    if (
      !Number.isSafeInteger(quantidade) ||
      quantidade < 1
    ) {
      return;
    }

    setItens((atuais) =>
      atuais.map((item) => {
        if (item.produto.id !== produtoId) {
          return item;
        }

        // Não aumentar produtos indisponíveis
        if (
          !item.produto.inStock &&
          quantidade > item.quantidade
        ) {
          return item;
        }

        return {
          ...item,
          quantidade,
        };
      })
    );
  }

  // Limpar carrinho
  function limpar() {
    setItens([]);
  }

  // Total financeiro
  const total = itens.reduce(
    (soma, item) =>
      soma + item.produto.price * item.quantidade,
    0
  );

  // Quantidade total
  const quantidadeTotal = itens.reduce(
    (soma, item) => soma + item.quantidade,
    0
  );

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        adicionar,
        remover,
        atualizarQuantidade,
        limpar,
        total,
        quantidadeTotal,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

// Hook global
export function useCarrinho() {
  const context = useContext(CarrinhoContext);

  if (!context) {
    throw new Error(
      "useCarrinho deve ser utilizado dentro de CarrinhoProvider."
    );
  }

  return context;
}
