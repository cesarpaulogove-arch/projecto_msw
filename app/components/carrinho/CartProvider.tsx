
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ==========================================
// TIPOS
// ==========================================

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

  subtotalOriginal: number;
  descontoTotal: number;

  todosSelecionados: boolean;
}

const CarrinhoContext = createContext<
  ContextoCarrinho | undefined
>(undefined);

const STORAGE_KEY = "msw_carrinho";
const QUANTIDADE_MAXIMA = 99;

type ModoCarrinho =
  | "carregando"
  | "local"
  | "conta"
  | "erro";

// ==========================================
// PREÇOS E PROMOÇÕES
// ==========================================

export function temPromocao(
  produto: ProdutoCarrinho
): boolean {
  const precoAtual = Number(produto.price);
  const precoAntigo = Number(produto.oldPrice);

  return (
    produto.promotion === true &&
    produto.oldPrice !== null &&
    Number.isFinite(precoAtual) &&
    Number.isFinite(precoAntigo) &&
    precoAtual >= 0 &&
    precoAntigo > precoAtual
  );
}

export function obterPrecoOriginal(
  produto: ProdutoCarrinho
): number {
  return temPromocao(produto)
    ? produto.oldPrice!
    : produto.price;
}

export function obterPrecoFinal(
  produto: ProdutoCarrinho
): number {
  return produto.price;
}

export function obterDescontoUnitario(
  produto: ProdutoCarrinho
): number {
  return temPromocao(produto)
    ? produto.oldPrice! - produto.price
    : 0;
}

export function obterPercentagemDesconto(
  produto: ProdutoCarrinho
): number {
  const precoOriginal = obterPrecoOriginal(produto);

  if (
    !temPromocao(produto) ||
    precoOriginal <= 0
  ) {
    return 0;
  }

  return Math.round(
    ((precoOriginal - produto.price) /
      precoOriginal) *
      100
  );
}

// ==========================================
// NORMALIZAR PRODUTO
// ==========================================

function normalizarProduto(
  produto: unknown
): ProdutoCarrinho | null {
  if (
    !produto ||
    typeof produto !== "object" ||
    Array.isArray(produto)
  ) {
    return null;
  }

  const p = produto as Record<string, unknown>;

  const price = Number(p.price);

  if (
    typeof p.id !== "string" ||
    !p.id.trim() ||
    typeof p.name !== "string" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return null;
  }

  const oldPrice =
    p.oldPrice === null ||
    p.oldPrice === undefined ||
    p.oldPrice === ""
      ? null
      : Number(p.oldPrice);

  if (
    oldPrice !== null &&
    (
      !Number.isFinite(oldPrice) ||
      oldPrice < 0
    )
  ) {
    return null;
  }

  return {
    id: p.id,
    name: p.name,

    category:
      typeof p.category === "string"
        ? p.category
        : "",

    price,
    oldPrice,

    image:
      typeof p.image === "string"
        ? p.image
        : "",

    images: Array.isArray(p.images)
      ? p.images.filter(
          (imagem): imagem is string =>
            typeof imagem === "string"
        )
      : [],

    rating:
      p.rating !== undefined &&
      Number.isFinite(Number(p.rating))
        ? Number(p.rating)
        : 0,

    inStock:
      typeof p.inStock === "boolean"
        ? p.inStock
        : true,

    promotion: p.promotion === true,
  };
}

// ==========================================
// NORMALIZAR CARRINHO
// ==========================================

function normalizarItens(
  dados: unknown
): ItemCarrinho[] {
  if (!Array.isArray(dados)) {
    return [];
  }

  const mapa = new Map<string, ItemCarrinho>();

  for (const valor of dados) {
    if (
      !valor ||
      typeof valor !== "object" ||
      Array.isArray(valor)
    ) {
      continue;
    }

    const item = valor as Record<string, unknown>;

    const produto = normalizarProduto(item.produto);

    const quantidade = Number(item.quantidade);

    if (
      !produto ||
      !Number.isSafeInteger(quantidade) ||
      quantidade <= 0
    ) {
      continue;
    }

    const selecionado =
      typeof item.selecionado === "boolean"
        ? item.selecionado
        : true;

    const existente = mapa.get(produto.id);

    if (existente) {
      existente.quantidade = Math.min(
        QUANTIDADE_MAXIMA,
        existente.quantidade + quantidade
      );

      existente.selecionado =
        existente.selecionado || selecionado;

      existente.produto = produto;
    } else {
      mapa.set(produto.id, {
        produto,
        quantidade: Math.min(
          QUANTIDADE_MAXIMA,
          quantidade
        ),
        selecionado,
      });
    }
  }

  return Array.from(mapa.values());
}

// ==========================================
// RECUPERAR CARRINHO LOCAL
// ==========================================

function recuperarCarrinhoLocal(): ItemCarrinho[] {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);

    if (!dados) {
      return [];
    }

    return normalizarItens(JSON.parse(dados));
  } catch (erro) {
    console.error(
      "Erro ao recuperar carrinho local:",
      erro
    );

    return [];
  }
}

// ==========================================
// GUARDAR CARRINHO LOCAL
// ==========================================

function guardarCarrinhoLocal(
  itens: ItemCarrinho[]
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(itens)
    );
  } catch (erro) {
    console.error(
      "Erro ao guardar carrinho local:",
      erro
    );
  }
}

// ==========================================
// PROVIDER
// ==========================================

export function CarrinhoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  const [modo, setModo] =
    useState<ModoCarrinho>("carregando");

  const [versaoSessao, setVersaoSessao] = useState(0);

  const ultimaVersaoGravacao = useRef(0);

  const filaGravacao = useRef<Promise<void>>(
    Promise.resolve()
  );

  const carregamentoConcluido = useRef(false);

  // ==========================================
  // CARREGAR CARRINHO DA CONTA OU LOCAL
  // ==========================================

  useEffect(() => {
    let activo = true;

    async function carregarCarrinho() {
      setModo("carregando");
      carregamentoConcluido.current = false;

      try {
        const resposta = await fetch("/api/carrinho", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!activo) return;

        if (resposta.status === 401) {
          const carrinhoLocal =
            recuperarCarrinhoLocal();

          if (!activo) return;

          setItens(carrinhoLocal);
          setModo("local");
          carregamentoConcluido.current = true;

          return;
        }

        if (!resposta.ok) {
          throw new Error(
            `Erro ao carregar carrinho: ${resposta.status}`
          );
        }

        const dados = await resposta.json();

        if (!activo) return;

        if (!Array.isArray(dados.itens)) {
          throw new Error(
            "Resposta inválida do servidor."
          );
        }

        const carrinhoConta = normalizarItens(
          dados.itens
        );

        setItens(carrinhoConta);
        setModo("conta");
        carregamentoConcluido.current = true;
      } catch (erro) {
        console.error(
          "Erro ao carregar carrinho:",
          erro
        );

        if (activo) {
          setModo("erro");
          carregamentoConcluido.current = true;
        }
      }
    }

    carregarCarrinho();

    return () => {
      activo = false;
    };
  }, [versaoSessao]);

  // ==========================================
  // DETECTAR ALTERAÇÕES NA SESSÃO
  // ==========================================

  useEffect(() => {
    function actualizarSessao() {
      ultimaVersaoGravacao.current += 1;
      setVersaoSessao((actual) => actual + 1);
    }

    window.addEventListener(
      "msw-auth-changed",
      actualizarSessao
    );

    window.addEventListener(
      "msw:auth-changed",
      actualizarSessao
    );

    return () => {
      window.removeEventListener(
        "msw-auth-changed",
        actualizarSessao
      );

      window.removeEventListener(
        "msw:auth-changed",
        actualizarSessao
      );
    };
  }, []);

  // ==========================================
  // GUARDAR CARRINHO DOS VISITANTES
  // ==========================================

  useEffect(() => {
    if (
      modo !== "local" ||
      !carregamentoConcluido.current
    ) {
      return;
    }

    guardarCarrinhoLocal(itens);
  }, [itens, modo]);

  // ==========================================
  // SINCRONIZAR CARRINHO COM A CONTA
  // ==========================================

  useEffect(() => {
    if (
      modo !== "conta" ||
      !carregamentoConcluido.current
    ) {
      return;
    }

    const versaoActual =
      ++ultimaVersaoGravacao.current;

    const itensParaGuardar = normalizarItens(itens);

    const temporizador = setTimeout(() => {
      filaGravacao.current = filaGravacao.current
        .catch(() => {
          // Permitir que a fila continue.
        })
        .then(async () => {
          if (
            versaoActual !==
            ultimaVersaoGravacao.current
          ) {
            return;
          }

          try {
            const resposta = await fetch(
              "/api/carrinho",
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({
                  itens: itensParaGuardar,
                }),
              }
            );

            if (!resposta.ok) {
              const detalhe = await resposta.text();

              console.error(
                "Erro ao guardar carrinho na conta:",
                {
                  status: resposta.status,
                  detalhe,
                }
              );
            }
          } catch (erro) {
            console.error(
              "Erro ao sincronizar carrinho:",
              erro
            );
          }
        });
    }, 500);

    return () => {
      clearTimeout(temporizador);
    };
  }, [itens, modo]);

  // ==========================================
  // ADICIONAR PRODUTO
  // ==========================================

  function adicionar(produto: ProdutoCarrinho) {
    const produtoNormalizado =
      normalizarProduto(produto);

    if (
      !produtoNormalizado ||
      !produtoNormalizado.inStock
    ) {
      console.error(
        "Produto inválido ou sem stock:",
        produto
      );

      return;
    }

    setItens((atuais) => {
      const existente = atuais.find(
        (item) =>
          item.produto.id === produtoNormalizado.id
      );

      if (existente) {
        return atuais.map((item) => {
          if (
            item.produto.id !== produtoNormalizado.id
          ) {
            return item;
          }

          return {
            ...item,
            produto: produtoNormalizado,
            quantidade: Math.min(
              QUANTIDADE_MAXIMA,
              item.quantidade + 1
            ),
          };
        });
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

  // ==========================================
  // REMOVER PRODUTO
  // ==========================================

  function remover(produtoId: string) {
    setItens((atuais) =>
      atuais.filter(
        (item) => item.produto.id !== produtoId
      )
    );
  }

  // ==========================================
  // ACTUALIZAR QUANTIDADE
  // ==========================================

  function atualizarQuantidade(
    produtoId: string,
    quantidade: number
  ) {
    if (
      !Number.isSafeInteger(quantidade) ||
      quantidade < 0 ||
      quantidade > QUANTIDADE_MAXIMA
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

  // ==========================================
  // ALTERNAR SELECÇÃO
  // ==========================================

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

  // ==========================================
  // SELECCIONAR TODOS
  // ==========================================

  function selecionarTodos(selecionado: boolean) {
    setItens((atuais) =>
      atuais.map((item) => ({
        ...item,
        selecionado,
      }))
    );
  }

  // ==========================================
  // LIMPAR CARRINHO
  // ==========================================

  function limpar() {
    setItens([]);
  }

  // ==========================================
  // ITENS SELECCIONADOS
  // ==========================================

  const itensSelecionados = itens.filter(
    (item) => item.selecionado
  );

  // ==========================================
  // TOTAL DE TODOS OS PRODUTOS
  // ==========================================

  const total = itens.reduce(
    (soma, item) =>
      soma +
      obterPrecoFinal(item.produto) * item.quantidade,
    0
  );

  // ==========================================
  // QUANTIDADE TOTAL
  // ==========================================

  const quantidadeTotal = itens.reduce(
    (soma, item) =>
      soma + item.quantidade,
    0
  );

  // ==========================================
  // TOTAL DOS PRODUTOS SELECCIONADOS
  // ==========================================

  const totalSelecionado =
    itensSelecionados.reduce(
      (soma, item) =>
        soma +
        obterPrecoFinal(item.produto) *
          item.quantidade,
      0
    );

  // ==========================================
  // SUBTOTAL ORIGINAL
  // ==========================================

  const subtotalOriginal =
    itensSelecionados.reduce(
      (soma, item) =>
        soma +
        obterPrecoOriginal(item.produto) *
          item.quantidade,
      0
    );

  // ==========================================
  // DESCONTO TOTAL
  // ==========================================

  const descontoTotal = Math.max(
    0,
    subtotalOriginal - totalSelecionado
  );

  // ==========================================
  // QUANTIDADE SELECCIONADA
  // ==========================================

  const quantidadeSelecionada =
    itensSelecionados.reduce(
      (soma, item) =>
        soma + item.quantidade,
      0
    );

  // ==========================================
  // TODOS SELECCIONADOS?
  // ==========================================

  const todosSelecionados =
    itens.length > 0 &&
    itens.every((item) => item.selecionado);

  // ==========================================
  // CONTEXTO
  // ==========================================

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

        subtotalOriginal,
        descontoTotal,

        todosSelecionados,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

// ==========================================
// HOOK DO CARRINHO
// ==========================================

export function useCarrinho() {
  const context = useContext(CarrinhoContext);

  if (!context) {
    throw new Error(
      "useCarrinho deve ser utilizado dentro de CarrinhoProvider."
    );
  }

  return context;
}
