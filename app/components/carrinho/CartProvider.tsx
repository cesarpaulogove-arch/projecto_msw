
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
  selecionado: boolean;
}

interface ContextoCarrinho {
  itens: ItemCarrinho[];
  itensSelecionados: ItemCarrinho[];

  adicionar: (produto: ProdutoCarrinho) => void;
  remover: (produtoId: string) => void;

  atualizarQuantidade: (
    produtoId: string,
    quantidade: number
  ) => void;

  alternarSelecao: (produtoId: string) => void;

  selecionarTodos: (selecionado: boolean) => void;

  limpar: () => void;

  total: number;
  quantidadeTotal: number;

  totalSelecionado: number;
  quantidadeSelecionada: number;

  todosSelecionados: boolean;
}

// ======================================================
// CONTEXTO
// ======================================================

const CarrinhoContext = createContext<
  ContextoCarrinho | undefined
>(undefined);

const STORAGE_KEY = "msw_carrinho";

// ======================================================
// VALIDAR DADOS DO LOCALSTORAGE
// ======================================================

function validarItem(item: unknown): item is ItemCarrinho {
  if (!item || typeof item !== "object") {
    return false;
  }

  const valor = item as Record<string, unknown>;
  const produto = valor.produto;

  if (!produto || typeof produto !== "object") {
    return false;
  }

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
    valor.quantidade > 0 &&
    (
      valor.selecionado === undefined ||
      typeof valor.selecionado === "boolean"
    )
  );
}

// ======================================================
// CARRINHO PROVIDER
// ======================================================

export function CarrinhoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  // ====================================================
  // RECUPERAR CARRINHO
  // ====================================================

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

              // Produtos antigos ficam seleccionados.
              selecionado:
                typeof item.selecionado === "boolean"
                  ? item.selecionado
                  : true,
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

  // ====================================================
  // GUARDAR CARRINHO
  // ====================================================

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

  // ====================================================
  // ADICIONAR PRODUTO
  // ====================================================

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
                ...item,
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
          selecionado: true,
        },
      ];
    });
  }

  // ====================================================
  // REMOVER PRODUTO COMPLETAMENTE
  // ====================================================

  function remover(produtoId: string) {
    setItens((atuais) =>
      atuais.filter(
        (item) => item.produto.id !== produtoId
      )
    );
  }

  // ====================================================
  // ACTUALIZAR QUANTIDADE
  // ====================================================

  function atualizarQuantidade(
    produtoId: string,
    quantidade: number
  ) {
    if (
      !Number.isSafeInteger(quantidade) ||
      quantidade < 0
    ) {
      return;
    }

    if (quantidade === 0) {
      remover(produtoId);
      return;
    }

    setItens((atuais) =>
      atuais.map((item) => {
        if (item.produto.id !== produtoId) {
          return item;
        }

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

  // ====================================================
  // SELECCIONAR / DESSELECCIONAR PRODUTO
  // ====================================================

  function alternarSelecao(produtoId: string) {
    setItens((atuais) =>
      atuais.map((item) =>
        item.produto.id === produtoId
          ? {
              ...item,
              selecionado: !item.selecionado,
            }
          : item
      )
    );
  }

  // ====================================================
  // SELECCIONAR / DESSELECCIONAR TODOS
  // ====================================================

  function selecionarTodos(selecionado: boolean) {
    setItens((atuais) =>
      atuais.map((item) => ({
        ...item,
        selecionado,
      }))
    );
  }

  // ====================================================
  // LIMPAR TODO O CARRINHO
  // ====================================================

  function limpar() {
    setItens([]);
  }

  // ====================================================
  // PRODUTOS SELECCIONADOS
  // ====================================================

  const itensSelecionados = itens.filter(
    (item) => item.selecionado
  );

  // ====================================================
  // TOTAL DE TODOS OS PRODUTOS
  // ====================================================

  const total = itens.reduce(
    (soma, item) =>
      soma + item.produto.price * item.quantidade,
    0
  );

  // ====================================================
  // QUANTIDADE TOTAL
  // ====================================================

  const quantidadeTotal = itens.reduce(
    (soma, item) =>
      soma + item.quantidade,
    0
  );

  // ====================================================
  // TOTAL DOS PRODUTOS SELECCIONADOS
  // ====================================================

  const totalSelecionado = itensSelecionados.reduce(
    (soma, item) =>
      soma + item.produto.price * item.quantidade,
    0
  );

  // ====================================================
  // QUANTIDADE DOS PRODUTOS SELECCIONADOS
  // ====================================================

  const quantidadeSelecionada = itensSelecionados.reduce(
    (soma, item) =>
      soma + item.quantidade,
    0
  );

  // ====================================================
  // VERIFICAR SE TODOS ESTÃO SELECCIONADOS
  // ====================================================

  const todosSelecionados =
    itens.length > 0 &&
    itens.every((item) => item.selecionado);

  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        itensSelecionados,

        adicionar,
        remover,
        atualizarQuantidade,

        alternarSelecao,
        selecionarTodos,

        limpar,

        total,
        quantidadeTotal,

        totalSelecionado,
        quantidadeSelecionada,

        todosSelecionados,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

// ======================================================
// HOOK GLOBAL
// ======================================================

export function useCarrinho() {
  const context = useContext(CarrinhoContext);

  if (!context) {
    throw new Error(
      "useCarrinho deve ser utilizado dentro de CarrinhoProvider."
    );
  }

  return context;
}
