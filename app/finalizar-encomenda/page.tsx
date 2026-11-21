"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  gerarPDFEncomenda,
  type DadosPDFEncomenda,
} from "@/lib/gerar-pdf-encomenda";

import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  Loader2,
  MapPin,
  User,
  Mail,
  Search,
  Pencil,
  Truck,
  ClipboardCheck,
  Building2,
  Hash,
  Tag,
} from "lucide-react";

import { useCarrinho } from "@/app/components/carrinho/CartProvider";

// =====================================================
// TIPOS
// =====================================================

type CustomerType = "INDIVIDUAL" | "COMPANY";

type EstadoCliente = "inicial" | "encontrado" | "novo";

type ZonaEntrega = "" | "MAPUTO" | "MATOLA";

interface ProdutoEncomendaPDF {
  nome: string;
  quantidade: number;
  preco: number;
  precoOriginal?: number;
  total: number;
  totalOriginal?: number;
  desconto?: number;
}

interface EncomendaCriada
  extends Omit<DadosPDFEncomenda, "produtos"> {
  id: string;
  referencia: string;
  estado: string;
  distrito?: string | null;
  subtotalOriginal: number;
  descontoTotal: number;
  subtotalComDesconto: number;
  produtos: ProdutoEncomendaPDF[];
}

interface ClienteEncontrado {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  customerType?: CustomerType | null;
  empresa?: string | null;
  company?: string | null;
  nuit?: string | null;
}

interface ProdutoComPromocao {
  price: number;
  oldPrice?: number | null;
  promotion?: boolean;
  inStock: boolean;
}

interface RespostaProdutoEncomenda {
  nome: string;
  quantidade: number;
  preco: number;
  precoOriginal?: number | null;
  total: number;
  totalOriginal?: number | null;
  desconto?: number | null;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function FinalizarEncomendaPage() {
  const {
    itens,
    itensSelecionados,
    remover,
    atualizarQuantidade,
    totalSelecionado,
  } = useCarrinho();

  // ===================================================
  // DADOS DO CLIENTE
  // ===================================================

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");

  const [customerType, setCustomerType] =
    useState<CustomerType>("INDIVIDUAL");

  const [empresa, setEmpresa] = useState("");
  const [nuit, setNuit] = useState("");

  const [estadoCliente, setEstadoCliente] =
    useState<EstadoCliente>("inicial");

  const [clienteAntigo, setClienteAntigo] = useState(false);
  const [editarDados, setEditarDados] = useState(false);

  // ===================================================
  // ESTADOS DO PROCESSO
  // ===================================================

  const [aPesquisar, setAPesquisar] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);

  const [erro, setErro] = useState("");

  const [encomenda, setEncomenda] =
    useState<EncomendaCriada | null>(null);

  const [aGerarPDF, setAGerarPDF] = useState(false);
  const [erroPDF, setErroPDF] = useState("");

  const [zonaEntrega, setZonaEntrega] =
    useState<ZonaEntrega>("");

  const [sessaoCliente, setSessaoCliente] = useState(false);
  const [aCarregarSessao, setACarregarSessao] = useState(true);

  // ===================================================
  // CARREGAR DADOS DA CONTA
  // ===================================================

  useEffect(() => {
    let activo = true;

    async function carregarDadosDaConta() {
      try {
        const resposta = await fetch("/api/encomendas", {
          method: "GET",
          cache: "no-store",
        });

        if (!resposta.ok) return;

        const dados = await resposta.json();

        if (
          !dados?.success ||
          !dados?.autenticado ||
          !dados?.cliente
        ) {
          return;
        }

        if (!activo) return;

        const cliente = dados.cliente as ClienteEncontrado;

        const empresaEncontrada =
          cliente.empresa || cliente.company || "";

        setSessaoCliente(true);

        setNome(cliente.nome || "");
        setTelefone(cliente.telefone || "");
        setEmail(cliente.email || "");

        setEndereco(
          cliente.endereco &&
            cliente.endereco !== "A combinar"
            ? cliente.endereco
            : ""
        );

        setCustomerType(
          cliente.customerType ||
            (empresaEncontrada ? "COMPANY" : "INDIVIDUAL")
        );

        setEmpresa(empresaEncontrada);
        setNuit(cliente.nuit || "");

        setClienteAntigo(true);
        setEstadoCliente("encontrado");
        setEditarDados(false);
      } catch (error) {
        console.error("ERRO AO CARREGAR CONTA:", error);
      } finally {
        if (activo) {
          setACarregarSessao(false);
        }
      }
    }

    carregarDadosDaConta();

    return () => {
      activo = false;
    };
  }, []);

  // ===================================================
  // FORMATAÇÃO
  // ===================================================

  function formatarPreco(valor: number) {
    return Number(valor || 0).toLocaleString("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // ===================================================
  // PREÇOS E DESCONTOS
  // ===================================================

  function obterPrecosProduto(produto: ProdutoComPromocao) {
    const precoActual = Number(produto.price) || 0;

    const precoOriginal =
      produto.promotion === true &&
      produto.oldPrice != null &&
      Number(produto.oldPrice) > precoActual
        ? Number(produto.oldPrice)
        : precoActual;

    const descontoUnitario = Math.max(
      0,
      precoOriginal - precoActual
    );

    return {
      precoActual,
      precoOriginal,
      descontoUnitario,
      temDesconto: descontoUnitario > 0,
    };
  }

  const subtotalOriginalSelecionado = itensSelecionados.reduce(
    (soma, item) => {
      const produto = item.produto as typeof item.produto &
        ProdutoComPromocao;

      const precos = obterPrecosProduto(produto);

      return soma + precos.precoOriginal * item.quantidade;
    },
    0
  );

  const subtotalComDescontoSelecionado = Number(totalSelecionado);

  const descontoTotalSelecionado = Math.max(
    0,
    subtotalOriginalSelecionado -
      subtotalComDescontoSelecionado
  );

  // ===================================================
  // DISPONIBILIDADE
  // ===================================================

  const produtosIndisponiveis = itensSelecionados.filter(
    (item) => !item.produto.inStock
  );

  const temProdutosIndisponiveis =
    produtosIndisponiveis.length > 0;

  // ===================================================
  // IDENTIFICAÇÃO DO CLIENTE
  // ===================================================

  async function pesquisarCliente() {
    if (aPesquisar) return;

    setErro("");

    const numero = telefone.trim();
    const numeroLimpo = numero.replace(/\D/g, "");

    if (numeroLimpo.length < 9) {
      setErro("Introduz um número de telefone válido.");
      return;
    }

    setAPesquisar(true);

    try {
      const resposta = await fetch(
        `/api/encomendas?phone=${encodeURIComponent(numero)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok || !dados?.success) {
        throw new Error(
          dados?.error ||
            "Não foi possível pesquisar o cliente."
        );
      }

      if (dados.encontrado && dados.cliente) {
        const cliente = dados.cliente as ClienteEncontrado;

        const empresaEncontrada =
          cliente.empresa || cliente.company || "";

        setNome(cliente.nome || "");
        setTelefone(cliente.telefone || numero);
        setEmail(cliente.email || "");

        setEndereco(
          cliente.endereco &&
            cliente.endereco !== "A combinar"
            ? cliente.endereco
            : ""
        );

        setCustomerType(
          cliente.customerType ||
            (empresaEncontrada ? "COMPANY" : "INDIVIDUAL")
        );

        setEmpresa(empresaEncontrada);
        setNuit(cliente.nuit || "");

        setClienteAntigo(true);
        setEstadoCliente("encontrado");
        setEditarDados(false);
      } else {
        setNome("");
        setEmail("");
        setEndereco("");

        setCustomerType("INDIVIDUAL");
        setEmpresa("");
        setNuit("");

        setClienteAntigo(false);
        setEstadoCliente("novo");
        setEditarDados(true);
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao pesquisar o telefone."
      );
    } finally {
      setAPesquisar(false);
    }
  }

  // ===================================================
  // ALTERAR TELEFONE
  // ===================================================

  function alterarTelefone() {
    if (sessaoCliente) return;

    setErro("");

    setEstadoCliente("inicial");
    setClienteAntigo(false);
    setEditarDados(false);

    setTelefone("");
    setNome("");
    setEmail("");
    setEndereco("");

    setCustomerType("INDIVIDUAL");
    setEmpresa("");
    setNuit("");

    setZonaEntrega("");
  }

  // ===================================================
  // ZONA DE ENTREGA
  // ===================================================

  function seleccionarZona(zona: ZonaEntrega) {
    setZonaEntrega(zona);
    setErro("");
  }

  // ===================================================
  // TIPO DE CLIENTE
  // ===================================================

  function seleccionarTipoCliente(tipo: CustomerType) {
    setCustomerType(tipo);
    setErro("");

    if (tipo === "INDIVIDUAL") {
      setEmpresa("");
      setNuit("");
    }
  }

  // ===================================================
  // NORMALIZAR PRODUTOS
  // ===================================================

  function normalizarProduto(
    produto: RespostaProdutoEncomenda
  ): ProdutoEncomendaPDF {
    const quantidade = Number(produto.quantidade) || 0;
    const preco = Number(produto.preco) || 0;

    const precoOriginal =
      produto.precoOriginal != null
        ? Number(produto.precoOriginal)
        : preco;

    const total =
      produto.total != null
        ? Number(produto.total)
        : preco * quantidade;

    const totalOriginal =
      produto.totalOriginal != null
        ? Number(produto.totalOriginal)
        : precoOriginal * quantidade;

    const desconto =
      produto.desconto != null
        ? Number(produto.desconto)
        : Math.max(0, totalOriginal - total);

    return {
      nome: String(produto.nome || "Produto"),
      quantidade,
      preco,
      precoOriginal,
      total,
      totalOriginal,
      desconto,
    };
  }

  // ===================================================
  // PRODUTOS ALTERNATIVOS
  // Usados se a API não devolver a lista de produtos.
  // ===================================================

  function obterProdutosDoCarrinho(): ProdutoEncomendaPDF[] {
    return itensSelecionados.map((item) => {
      const produto = item.produto as typeof item.produto &
        ProdutoComPromocao;

      const precos = obterPrecosProduto(produto);

      const total = precos.precoActual * item.quantidade;
      const totalOriginal =
        precos.precoOriginal * item.quantidade;

      return {
        nome: item.produto.name,
        quantidade: item.quantidade,
        preco: precos.precoActual,
        precoOriginal: precos.precoOriginal,
        total,
        totalOriginal,
        desconto: Math.max(0, totalOriginal - total),
      };
    });
  }

  // ===================================================
  // CONFIRMAR ENCOMENDA
  // ===================================================

  async function confirmarEncomenda(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (aEnviar) return;

    setErro("");

    // Validar carrinho
    if (itensSelecionados.length === 0) {
      setErro(
        "Selecciona pelo menos um produto para encomendar."
      );
      return;
    }

    if (temProdutosIndisponiveis) {
      setErro(
        "Existem produtos seleccionados indisponíveis. Remove-os ou desselecciona-os antes de continuar."
      );
      return;
    }

    // Validar cliente
    if (!nome.trim() || !telefone.trim()) {
      setErro("Preenche o nome e o número de telefone.");
      return;
    }

    if (telefone.replace(/\D/g, "").length < 9) {
      setErro("Introduz um número de telefone válido.");
      return;
    }

    if (
      customerType === "COMPANY" &&
      !empresa.trim()
    ) {
      setErro("Introduz o nome da empresa.");
      return;
    }

    if (
      customerType === "COMPANY" &&
      !/^\d{9}$/.test(nuit)
    ) {
      setErro("O NUIT deve conter exactamente 9 dígitos.");
      return;
    }

    if (zonaEntrega && !endereco.trim()) {
      setErro("Introduz o endereço para realizar a entrega.");
      return;
    }

    // Activar bloqueio de submissão
    setAEnviar(true);

    // Guardar os produtos antes do pedido
    const produtosEncomendados = itensSelecionados.map(
      (item) => item.produto.id
    );

    try {
      const resposta = await fetch("/api/encomendas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerType,

          customerName: nome.trim(),

          company:
            customerType === "COMPANY"
              ? empresa.trim()
              : null,

          nuit:
            customerType === "COMPANY"
              ? nuit
              : null,

          phone: telefone.trim(),

          email: email.trim() || undefined,

          address: zonaEntrega
            ? endereco.trim()
            : "A combinar",

          district: zonaEntrega || undefined,

          // Os preços são calculados no servidor.
          items: itensSelecionados.map((item) => ({
            productId: item.produto.id,
            quantity: item.quantidade,
          })),
        }),
      });

      const dados = await resposta.json().catch(() => null);

      console.log("RESPOSTA DA ENCOMENDA:", {
        status: resposta.status,
        dados,
      });

      if (!resposta.ok || !dados?.success) {
        throw new Error(
          dados?.error ||
            `Não foi possível registar a encomenda. Código: ${resposta.status}`
        );
      }

      // A API deve devolver uma referência e o total.
      const referenciaServidor =
        dados.orderNumber ||
        dados.encomenda?.referencia ||
        dados.encomenda?.orderNumber;

      if (!referenciaServidor) {
        throw new Error(
          "O servidor confirmou a operação, mas não devolveu a referência da encomenda. Verifica a lista de encomendas antes de tentares novamente."
        );
      }

      // =================================================
      // NORMALIZAR DADOS DEVOLVIDOS PELA API
      // =================================================

      const dadosEncomenda = dados.encomenda || {};

      const produtosPDF: ProdutoEncomendaPDF[] =
        Array.isArray(dadosEncomenda.produtos) &&
        dadosEncomenda.produtos.length > 0
          ? dadosEncomenda.produtos.map(
              (produto: RespostaProdutoEncomenda) =>
                normalizarProduto(produto)
            )
          : obterProdutosDoCarrinho();

      const subtotalOriginalServidor = Number(
        dadosEncomenda.subtotalOriginal ??
          produtosPDF.reduce(
            (soma, produto) =>
              soma +
              Number(produto.totalOriginal ?? produto.total),
            0
          )
      );

      const subtotalComDescontoServidor = Number(
        dadosEncomenda.subtotalComDesconto ??
          produtosPDF.reduce(
            (soma, produto) => soma + produto.total,
            0
          )
      );

      const descontoServidor = Number(
        dadosEncomenda.descontoTotal ??
          Math.max(
            0,
            subtotalOriginalServidor -
              subtotalComDescontoServidor
          )
      );

      const entregaServidor = Number(
        dadosEncomenda.entrega ??
          dadosEncomenda.taxaEntrega ??
          0
      );

      const totalServidor = Number(
        dadosEncomenda.total ??
          dados.total ??
          subtotalComDescontoServidor
      );

      const distritoServidor =
        dadosEncomenda.distrito ??
        dadosEncomenda.cliente?.distrito ??
        zonaEntrega ??
        null;

      // =================================================
      // CONSTRUIR ENCOMENDA
      // =================================================

      const encomendaFinal = {
        ...dadosEncomenda,

        id: String(
          dadosEncomenda.id ?? referenciaServidor
        ),

        orderNumber: String(
          dadosEncomenda.orderNumber ??
            dados.orderNumber ??
            referenciaServidor
        ),

        referencia: String(referenciaServidor),

        estado: String(
          dadosEncomenda.estado ?? "PENDENTE"
        ),

        distrito: distritoServidor,

        entrega: entregaServidor,

        total: totalServidor,

        subtotalOriginal: subtotalOriginalServidor,

        subtotalComDesconto:
          subtotalComDescontoServidor,

        descontoTotal: descontoServidor,

        produtos: produtosPDF,
      } as EncomendaCriada;

      // Mostrar o ecrã de sucesso
      setEncomenda(encomendaFinal);

      // Remover apenas os produtos que foram encomendados.
      produtosEncomendados.forEach((produtoId) => {
        remover(produtoId);
      });
    } catch (error) {
      console.error("ERRO AO FINALIZAR ENCOMENDA:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao confirmar a encomenda."
      );
    } finally {
      setAEnviar(false);
    }
  }

  // ===================================================
  // DESCARREGAR PDF
  // ===================================================

  async function descarregarPDF() {
    if (!encomenda || aGerarPDF) return;

    setAGerarPDF(true);
    setErroPDF("");

    try {
      await gerarPDFEncomenda(encomenda);
    } catch (error) {
      console.error("ERRO AO GERAR PDF:", error);

      setErroPDF(
        "Não foi possível gerar o PDF. A encomenda continua registada. Tenta novamente."
      );
    } finally {
      setAGerarPDF(false);
    }
  }

  // ===================================================
  // ECRÃ DE SUCESSO
  // ===================================================

  if (encomenda) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />

          <h1 className="mt-5 text-2xl font-black text-[#071B2D]">
             Compra realizada com sucesso!
          </h1>

          <p className="mt-3 text-gray-600">
           A tua compra foi concluída com sucesso. Obrigado pela preferência!
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-5 text-left">
            <p className="text-sm text-gray-500">
              Referência da compra
            </p>

            <p className="mt-1 text-xl font-black text-cyan-700">
              {encomenda.referencia}
            </p>

            <div className="mt-5 flex justify-between gap-3 text-sm">
              <span className="text-gray-600">
                Valor sem desconto
              </span>

              <span className="font-semibold text-gray-700">
                {formatarPreco(encomenda.subtotalOriginal)}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-3 text-sm">
              <span className="text-gray-600">
                Desconto total
              </span>

              <span className="font-bold text-green-700">
                - {formatarPreco(encomenda.descontoTotal)}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-3 border-t border-gray-200 pt-3 text-sm">
              <span className="font-semibold text-gray-700">
                Total dos produtos
              </span>

              <span className="text-xl font-black text-[#071B2D]">
                {formatarPreco(encomenda.total)}
              </span>
            </div>

            {encomenda.entrega > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                Entrega: {formatarPreco(encomenda.entrega)}
              </p>
            )}

            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              {encomenda.distrito
                ? "A equipa MSW BUSINESS confirmará o custo da entrega e os detalhes dos testes dos componentes."
                : "Não foi solicitada entrega. A equipa MSW BUSINESS poderá contactar-te para acompanhar a encomenda."}
            </p>
          </div>

          {/* PRODUTOS */}

          <div className="mt-6 rounded-xl border border-gray-200 p-5 text-left">
            <h2 className="mb-4 font-bold text-[#071B2D]">
              Produtos encomendados
            </h2>

            <div className="space-y-4">
              {encomenda.produtos.map((produto, index) => (
                <div
                  key={`${produto.nome}-${index}`}
                  className="border-b border-gray-100 pb-3 last:border-0"
                >
                  <p className="font-semibold text-gray-800">
                    {produto.nome}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Quantidade: {produto.quantidade}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {produto.precoOriginal != null &&
                      produto.precoOriginal > produto.preco && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatarPreco(
                            produto.precoOriginal *
                              produto.quantidade
                          )}
                        </span>
                      )}

                    <span className="font-bold text-cyan-700">
                      {formatarPreco(produto.total)}
                    </span>
                  </div>

                  {Number(produto.desconto ?? 0) > 0 && (
                    <p className="mt-1 text-xs font-semibold text-green-700">
                      Poupaste{" "}
                      {formatarPreco(
                        Number(produto.desconto ?? 0)
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PDF */}

          <div className="mt-6 rounded-xl border border-gray-200 p-5 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <ClipboardCheck className="h-6 w-6 text-red-600" />
              </div>

              <div>
                <h2 className="font-bold text-[#071B2D]">
                  Documento da encomenda
                </h2>

                <p className="text-sm text-gray-500">
                  PDF com os produtos, preços e descontos.
                </p>
              </div>
            </div>

            {erroPDF && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {erroPDF}
              </p>
            )}

            <button
              type="button"
              onClick={descarregarPDF}
              disabled={aGerarPDF}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aGerarPDF ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  A gerar PDF...
                </>
              ) : (
                <>
                  <ClipboardCheck size={19} />
                  Descarregar PDF da encomenda
                </>
              )}
            </button>
          </div>

          <p className="mt-5 text-sm text-gray-500">
            Guarda a referência para futuras consultas sobre a tua encomenda.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#071B2D] px-7 py-3 font-bold text-white transition hover:bg-cyan-700"
          >
            Voltar à loja
          </Link>

          {itens.length > 0 && (
            <Link
              href="/carrinho"
              className="mt-3 inline-flex items-center justify-center rounded-xl border border-gray-300 px-7 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Ver restantes produtos no carrinho
            </Link>
          )}
        </div>
      </main>
    );
  }

  // ===================================================
  // PÁGINA DE FINALIZAÇÃO
  // ===================================================

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-cyan-700"
        >
          <ArrowLeft size={18} />
          Continuar a comprar
        </Link>

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wider text-cyan-700">
            MSW BUSINESS
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#071B2D]">
            Finalizar compra
          </h1>

          <p className="mt-2 text-gray-500">
            {aCarregarSessao
              ? "Estamos a verificar a tua conta..."
              : sessaoCliente
                ? "Os dados da tua conta foram carregados automaticamente."
                : "Introduz o teu número de telefone para continuar."}
          </p>
        </div>

        {/* ERROS */}

        {erro && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {erro}
          </div>
        )}

        {/* PRODUTOS INDISPONÍVEIS */}

        {temProdutosIndisponiveis && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <p className="font-bold">
              Existem produtos seleccionados indisponíveis.
            </p>

            <p className="mt-1">
              Remove-os ou volta ao carrinho para os desseleccionar antes de finalizar a encomenda.
            </p>

            <Link
              href="/carrinho"
              className="mt-3 inline-flex font-bold underline"
            >
              Voltar ao carrinho
            </Link>
          </div>
        )}

        {/* CARRINHO */}

        {itens.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <ShoppingBag className="mx-auto h-14 w-14 text-gray-300" />

            <h2 className="mt-4 text-xl font-bold text-gray-800">
              O carrinho está vazio
            </h2>

            <p className="mt-2 text-gray-500">
              Adiciona produtos antes de finalizar a encomenda.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-cyan-700 px-6 py-3 font-bold text-white hover:bg-cyan-800"
            >
              Explorar produtos
            </Link>
          </div>
        ) : itensSelecionados.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <ShoppingBag className="mx-auto h-14 w-14 text-gray-300" />

            <h2 className="mt-4 text-xl font-bold text-gray-800">
              Nenhum produto seleccionado
            </h2>

            <p className="mt-2 text-gray-500">
              Volta ao carrinho e selecciona os produtos que pretendes incluir nesta encomenda.
            </p>

            <Link
              href="/carrinho"
              className="mt-6 inline-flex rounded-xl bg-cyan-700 px-6 py-3 font-bold text-white hover:bg-cyan-800"
            >
              Voltar ao carrinho
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-7">
              {/* IDENTIFICAÇÃO */}

              {!aCarregarSessao && !sessaoCliente && (
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50">
                      <User className="h-6 w-6 text-cyan-700" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-[#071B2D]">
                        Identificação do cliente
                      </h2>

                      <p className="text-sm text-gray-500">
                        Não precisas de iniciar sessão para encomendar.
                      </p>
                    </div>
                  </div>

                  {estadoCliente === "inicial" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Número de telefone *
                        </label>

                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={telefone}
                          onChange={(e) => {
                            setTelefone(e.target.value);
                            setErro("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              pesquisarCliente();
                            }
                          }}
                          placeholder="Ex.: 84 123 4567"
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={pesquisarCliente}
                        disabled={aPesquisar}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {aPesquisar ? (
                          <>
                            <Loader2 size={19} className="animate-spin" />
                            A verificar telefone...
                          </>
                        ) : (
                          <>
                            <Search size={19} />
                            Continuar com este número
                          </>
                        )}
                      </button>

                      <p className="text-xs leading-relaxed text-gray-500">
                        Se já tiveres efectuado encomendas anteriormente,
                        os teus dados serão recuperados automaticamente.
                        Se for a primeira vez, poderás preencher os teus dados.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle2 size={20} />

                        <span className="font-bold">
                          {estadoCliente === "encontrado"
                            ? "Cliente identificado"
                            : "Novo cliente"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-700">
                        Número de telefone:
                      </p>

                      <p className="mt-1 font-bold text-[#071B2D]">
                        {telefone}
                      </p>

                      {estadoCliente === "novo" && (
                        <p className="mt-2 text-sm text-green-800">
                          Este número ainda não tem dados de cliente registados.
                          Preenche o formulário abaixo para continuar.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={alterarTelefone}
                        className="mt-3 text-sm font-semibold text-cyan-700 hover:text-cyan-900"
                      >
                        Alterar número de telefone
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* FORMULÁRIO */}

              {!aCarregarSessao &&
                (sessaoCliente || estadoCliente !== "inicial") && (
                  <form
                    id="form-encomenda"
                    onSubmit={confirmarEncomenda}
                    className="space-y-7"
                  >
                    {/* DADOS DO CLIENTE */}

                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-6 text-xl font-bold text-[#071B2D]">
                        Dados do cliente
                      </h2>

                      <div className="space-y-5">
                        {/* TIPO */}

                        <div>
                          <label className="mb-3 block text-sm font-semibold text-gray-700">
                            Tipo de cliente *
                          </label>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                seleccionarTipoCliente("INDIVIDUAL")
                              }
                              className={`rounded-xl border p-4 text-left transition ${
                                customerType === "INDIVIDUAL"
                                  ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100"
                                  : "border-gray-200 hover:border-cyan-300"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <User size={19} className="text-cyan-700" />

                                <p className="font-bold text-[#071B2D]">
                                  Pessoa individual
                                </p>
                              </div>

                              <p className="mt-2 text-sm text-gray-500">
                                Encomenda em nome pessoal.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                seleccionarTipoCliente("COMPANY")
                              }
                              className={`rounded-xl border p-4 text-left transition ${
                                customerType === "COMPANY"
                                  ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100"
                                  : "border-gray-200 hover:border-cyan-300"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Building2 size={19} className="text-cyan-700" />

                                <p className="font-bold text-[#071B2D]">
                                  Empresa
                                </p>
                              </div>

                              <p className="mt-2 text-sm text-gray-500">
                                Encomenda em nome de uma empresa.
                              </p>
                            </button>
                          </div>
                        </div>

                        {/* NOME */}

                        <div>
                          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <User size={16} />

                            {customerType === "COMPANY"
                              ? "Nome da pessoa de contacto *"
                              : "Nome completo *"}
                          </label>

                          <input
                            required
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            readOnly={
                              sessaoCliente ||
                              (clienteAntigo && !editarDados)
                            }
                            placeholder={
                              customerType === "COMPANY"
                                ? "Nome do responsável pela encomenda"
                                : "Introduz o teu nome"
                            }
                            autoComplete="name"
                            className={`w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 ${
                              sessaoCliente ||
                              (clienteAntigo && !editarDados)
                                ? "cursor-not-allowed bg-gray-100"
                                : ""
                            }`}
                          />
                        </div>

                        {/* EMPRESA */}

                        {customerType === "COMPANY" && (
                          <>
                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Building2 size={16} />
                                Nome da empresa *
                              </label>

                              <input
                                required
                                value={empresa}
                                onChange={(e) => setEmpresa(e.target.value)}
                                readOnly={
                                  clienteAntigo &&
                                  !editarDados &&
                                  !sessaoCliente
                                }
                                placeholder="Nome oficial da empresa"
                                autoComplete="organization"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                              />
                            </div>

                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Hash size={16} />
                                NUIT *
                              </label>

                              <input
                                required
                                type="text"
                                inputMode="numeric"
                                maxLength={9}
                                minLength={9}
                                pattern="[0-9]{9}"
                                value={nuit}
                                onChange={(e) =>
                                  setNuit(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 9)
                                  )
                                }
                                readOnly={
                                  clienteAntigo &&
                                  !editarDados &&
                                  !sessaoCliente
                                }
                                placeholder="Introduz os 9 dígitos do NUIT"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                              />

                              <p className="mt-1 text-xs text-gray-500">
                                O NUIT deve conter exactamente 9 dígitos.
                              </p>
                            </div>
                          </>
                        )}

                        {/* EMAIL */}

                        <div>
                          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Mail size={16} />
                            E-mail (opcional)
                          </label>

                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            readOnly={
                              sessaoCliente ||
                              (clienteAntigo && !editarDados)
                            }
                            placeholder="exemplo@email.com"
                            autoComplete="email"
                            className={`w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 ${
                              sessaoCliente ||
                              (clienteAntigo && !editarDados)
                                ? "cursor-not-allowed bg-gray-100"
                                : ""
                            }`}
                          />
                        </div>

                        {/* CONTA */}

                        {sessaoCliente && (
                          <div className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-800">
                            Os dados pessoais foram carregados da tua conta.
                            Podes seleccionar se a encomenda será feita em
                            nome individual ou empresarial.
                          </div>
                        )}

                        {/* EDITAR */}

                        {clienteAntigo && !sessaoCliente && (
                          <button
                            type="button"
                            onClick={() => setEditarDados(!editarDados)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-900"
                          >
                            <Pencil size={16} />

                            {editarDados
                              ? "Cancelar edição"
                              : "Actualizar dados pessoais"}
                          </button>
                        )}
                      </div>
                    </section>

                    {/* ENTREGA */}

                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="text-xl font-bold text-[#071B2D]">
                            Entrega
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            Este serviço é opcional.
                          </p>
                        </div>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                          Opcional
                        </span>
                      </div>

                      <p className="mb-4 text-sm text-gray-600">
                        Pretendes receber os produtos através do serviço de entrega?
                      </p>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => seleccionarZona("")}
                          className={`rounded-xl border p-4 text-left transition ${
                            !zonaEntrega
                              ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100"
                              : "border-gray-200 hover:border-cyan-300"
                          }`}
                        >
                          <p className="font-bold text-[#071B2D]">
                            Não pretendo entrega
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Registar apenas a encomenda.
                          </p>

                          {!zonaEntrega && (
                            <p className="mt-2 text-xs font-semibold text-green-700">
                              Seleccionado
                            </p>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            seleccionarZona(
                              zonaEntrega ? "" : "MAPUTO"
                            )
                          }
                          className={`rounded-xl border p-4 text-left transition ${
                            zonaEntrega
                              ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100"
                              : "border-gray-200 hover:border-cyan-300"
                          }`}
                        >
                          <p className="font-bold text-[#071B2D]">
                            Pretendo entrega
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Seleccionar a zona de entrega.
                          </p>

                          {zonaEntrega && (
                            <p className="mt-2 text-xs font-semibold text-green-700">
                              Entrega seleccionada
                            </p>
                          )}
                        </button>
                      </div>

                      {/* ZONAS */}

                      {zonaEntrega && (
                        <div className="mt-6 space-y-5 border-t border-gray-100 pt-5">
                          <div>
                            <label className="mb-3 block text-sm font-semibold text-gray-700">
                              <Truck size={16} className="mr-2 inline" />
                              Zona de entrega
                            </label>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => seleccionarZona("MAPUTO")}
                                className={`rounded-xl border p-4 text-left transition ${
                                  zonaEntrega === "MAPUTO"
                                    ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100"
                                    : "border-gray-200 hover:border-cyan-300"
                                }`}
                              >
                                <p className="font-bold text-[#071B2D]">
                                  Maputo
                                </p>

                                <p className="mt-1 text-sm font-semibold text-cyan-700">
                                  300–500 MT
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() => seleccionarZona("MATOLA")}
                                className={`rounded-xl border p-4 text-left transition ${
                                  zonaEntrega === "MATOLA"
                                    ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100"
                                    : "border-gray-200 hover:border-cyan-300"
                                }`}
                              >
                                <p className="font-bold text-[#071B2D]">
                                  Matola
                                </p>

                                <p className="mt-1 text-sm font-semibold text-cyan-700">
                                  600–1.000 MT
                                </p>
                              </button>
                            </div>
                          </div>

                          {/* ENDEREÇO */}

                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <MapPin size={16} />
                              Endereço de entrega *
                            </label>

                            <textarea
                              required
                              rows={3}
                              value={endereco}
                              onChange={(e) => setEndereco(e.target.value)}
                              placeholder="Rua, avenida, número ou ponto de referência"
                              autoComplete="street-address"
                              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                            />
                          </div>

                          {/* TESTES */}

                          <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-700">
                                <ClipboardCheck size={21} />
                              </div>

                              <div>
                                <h3 className="font-bold text-[#071B2D]">
                                  Testes dos componentes no acto da entrega
                                </h3>

                                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                  Quando a encomenda for entregue, a equipa
                                  MSW BUSINESS realizará os testes dos
                                  componentes com o cliente.
                                </p>
                              </div>
                            </div>

                            <ul className="mt-4 space-y-2 text-sm text-gray-700">
                              <li className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
                                Verificação visual dos componentes.
                              </li>

                              <li className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
                                Testes de funcionamento, quando aplicável.
                              </li>

                              <li className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
                                Demonstração dos resultados ao cliente.
                              </li>

                              <li className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
                                Confirmação do estado dos componentes na entrega.
                              </li>
                            </ul>

                            <p className="mt-4 text-xs leading-relaxed text-gray-500">
                              Os testes são realizados no acto da entrega,
                              de acordo com as características e possibilidades
                              de cada componente.
                            </p>
                          </div>

                          <p className="text-xs text-gray-500">
                            Maputo: 300–500 MT. Matola: 600–1.000 MT.
                            O custo exacto será confirmado pela equipa
                            MSW BUSINESS. Este valor não está incluído
                            no total dos produtos.
                          </p>
                        </div>
                      )}
                    </section>

                    {/* CONFIRMAR */}

                    <button
                      type="submit"
                      disabled={
                        aEnviar ||
                        itensSelecionados.length === 0 ||
                        temProdutosIndisponiveis
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-6 py-4 font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {aEnviar ? (
                        <>
                          <Loader2
                            className="animate-spin"
                            size={20}
                          />
                          A registar encomenda...
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={20} />
                          Finalizar compra
                        </>
                      )}
                    </button>
                  </form>
                )}
            </div>

            {/* RESUMO DA ENCOMENDA */}

            <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="mb-6 text-xl font-bold text-[#071B2D]">
                Resumo da encomenda
              </h2>

              <div className="max-h-[420px] space-y-5 overflow-y-auto">
                {itensSelecionados.map((item) => {
                  const produto = item.produto as typeof item.produto &
                    ProdutoComPromocao;

                  const precos = obterPrecosProduto(produto);

                  const totalProduto =
                    precos.precoActual * item.quantidade;

                  const totalOriginal =
                    precos.precoOriginal * item.quantidade;

                  const descontoProduto =
                    precos.descontoUnitario * item.quantidade;

                  return (
                    <div
                      key={item.produto.id}
                      className="flex gap-3 border-b border-gray-100 pb-5"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                        {item.produto.image ? (
                          <Image
                            src={item.produto.image}
                            alt={item.produto.name}
                            fill
                            sizes="80px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            Sem imagem
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold text-gray-800">
                          {item.produto.name}
                        </h3>

                        {/* PREÇOS */}

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-cyan-700">
                            {formatarPreco(totalProduto)}
                          </span>

                          {precos.temDesconto && (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                {formatarPreco(totalOriginal)}
                              </span>

                              <span className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                -
                                {Math.round(
                                  (descontoProduto / totalOriginal) * 100
                                )}
                                %
                              </span>
                            </>
                          )}
                        </div>

                        {/* POUPANÇA */}

                        {descontoProduto > 0 && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-green-700">
                            <Tag size={12} />
                            Poupas {formatarPreco(descontoProduto)}
                          </p>
                        )}

                        {!item.produto.inStock && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            Produto indisponível
                          </p>
                        )}

                        {/* QUANTIDADE */}

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              atualizarQuantidade(
                                item.produto.id,
                                item.quantidade - 1
                              )
                            }
                            disabled={item.quantidade <= 1}
                            className="rounded-lg border p-1.5 disabled:opacity-40"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="min-w-6 text-center text-sm font-bold">
                            {item.quantidade}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              atualizarQuantidade(
                                item.produto.id,
                                item.quantidade + 1
                              )
                            }
                            disabled={!item.produto.inStock}
                            className="rounded-lg border p-1.5 disabled:opacity-40"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => remover(item.produto.id)}
                            className="ml-auto rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                            aria-label="Remover produto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TOTAIS */}

              <div className="mt-6 space-y-3">
                <div className="flex justify-between gap-3 text-sm text-gray-600">
                  <span>Valor sem desconto</span>

                  <span className="text-right">
                    {formatarPreco(subtotalOriginalSelecionado)}
                  </span>
                </div>

                {descontoTotalSelecionado > 0 && (
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium text-green-700">
                      Desconto total
                    </span>

                    <span className="font-bold text-green-700">
                      - {formatarPreco(descontoTotalSelecionado)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-3 text-sm text-gray-600">
                  <span>Subtotal com desconto</span>

                  <span className="text-right">
                    {formatarPreco(subtotalComDescontoSelecionado)}
                  </span>
                </div>

                <div className="flex justify-between gap-3 text-sm text-gray-600">
                  <span>Entrega</span>

                  <span className="text-right">
                    {!zonaEntrega
                      ? "Não solicitada"
                      : zonaEntrega === "MAPUTO"
                        ? "300–500 MT"
                        : "600–1.000 MT"}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-[#071B2D]">
                      Total dos produtos
                    </span>

                    <span className="text-xl font-black text-cyan-700">
                      {formatarPreco(subtotalComDescontoSelecionado)}
                    </span>
                  </div>

                  {descontoTotalSelecionado > 0 && (
                    <p className="mt-2 text-xs font-semibold text-green-700">
                      Estás a poupar{" "}
                      {formatarPreco(descontoTotalSelecionado)} nesta compra.
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-500">
                    {zonaEntrega
                      ? "O custo exacto da entrega será confirmado pela equipa MSW BUSINESS. Os testes dos componentes serão realizados no acto da entrega."
                      : "A entrega não foi seleccionada. O valor apresentado corresponde apenas aos produtos seleccionados."}
                  </p>
                </div>
              </div>

              <Link
                href="/carrinho"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Voltar ao carrinho
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}