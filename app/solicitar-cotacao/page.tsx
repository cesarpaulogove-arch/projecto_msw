
"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  FileText,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  Tag,
} from "lucide-react";

import { useCarrinho } from "@/app/components/carrinho/CartProvider";

type CustomerType = "INDIVIDUAL" | "COMPANY";

interface CotacaoCriada {
  id: string;
  quoteNumber: string;
}

interface Cliente {
  customerName: string;
  customerType?: CustomerType;
  company: string | null;
  nuit: string | null;
  phone: string;
  email: string | null;
  address: string | null;
}

interface RespostaApi {
  error?: string;
  quotation?: CotacaoCriada;
}

export default function SolicitarCotacaoPage() {
  const router = useRouter();

  const {
    itens,
    itensSelecionados,
    remover,
    quantidadeSelecionada,
  } = useCarrinho();

  // =====================================================
  // DADOS DO CLIENTE
  // =====================================================

  const [customerName, setCustomerName] = useState("");
  const [customerType, setCustomerType] =
    useState<CustomerType>("INDIVIDUAL");

  const [company, setCompany] = useState("");
  const [nuit, setNuit] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // =====================================================
  // DADOS DA COTAÇÃO
  // =====================================================

  const [notes, setNotes] = useState("");

  // =====================================================
  // IDENTIFICAÇÃO DO CLIENTE
  // =====================================================

  const [contactoVerificado, setContactoVerificado] =
    useState(false);

  const [clienteExistente, setClienteExistente] =
    useState(false);

  const [mostrarDados, setMostrarDados] = useState(false);
  const [verificando, setVerificando] = useState(false);

  // =====================================================
  // SESSÃO
  // =====================================================

  const [sessaoCliente, setSessaoCliente] = useState(false);
  const [aVerificarSessao, setAVerificarSessao] = useState(true);

  // =====================================================
  // ESTADOS GERAIS
  // =====================================================

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagemContacto, setMensagemContacto] = useState("");

  // =====================================================
  // FORMATAÇÃO MONETÁRIA
  // =====================================================

  const formatarPreco = (valor: number) =>
    new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);

  // =====================================================
  // PROMOÇÕES
  // =====================================================

  function temPromocao(produto: {
    price: number;
    oldPrice?: number | null;
    promotion?: boolean;
  }): boolean {
    return (
      produto.promotion === true &&
      produto.oldPrice !== null &&
      produto.oldPrice !== undefined &&
      Number(produto.oldPrice) > Number(produto.price)
    );
  }

  function obterPrecoOriginal(produto: {
    price: number;
    oldPrice?: number | null;
    promotion?: boolean;
  }): number {
    return temPromocao(produto)
      ? Number(produto.oldPrice)
      : Number(produto.price);
  }

  function obterPrecoFinal(produto: {
    price: number;
  }): number {
    return Number(produto.price);
  }

  function obterDescontoUnitario(produto: {
    price: number;
    oldPrice?: number | null;
    promotion?: boolean;
  }): number {
    return Math.max(
      0,
      obterPrecoOriginal(produto) - obterPrecoFinal(produto)
    );
  }

  function obterPercentagemDesconto(produto: {
    price: number;
    oldPrice?: number | null;
    promotion?: boolean;
  }): number {
    const original = obterPrecoOriginal(produto);
    const desconto = obterDescontoUnitario(produto);

    if (original <= 0 || desconto <= 0) return 0;

    return Math.round((desconto / original) * 100);
  }

  // =====================================================
  // CÁLCULOS DO RESUMO
  // =====================================================

  const subtotalOriginal = itensSelecionados.reduce(
    (total, item) =>
      total +
      obterPrecoOriginal(item.produto) *
        item.quantidade,
    0
  );

  const subtotalPromocional = itensSelecionados.reduce(
    (total, item) =>
      total +
      obterPrecoFinal(item.produto) *
        item.quantidade,
    0
  );

  const descontoTotal = Math.max(
    0,
    subtotalOriginal - subtotalPromocional
  );

  const quantidadeProdutosPromocionais =
    itensSelecionados.filter((item) =>
      temPromocao(item.produto)
    ).length;

  // =====================================================
  // VERIFICAR SESSÃO E CARREGAR DADOS DO CLIENTE
  // =====================================================

  useEffect(() => {
    let activo = true;

    async function carregarSessao() {
      try {
        const resposta = await fetch(
          "/api/quotations/contact",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const dados = await resposta.json();

        if (!activo) return;

        if (
          resposta.ok &&
          dados.authenticated === true &&
          dados.customer
        ) {
          const cliente = dados.customer;

          setSessaoCliente(true);
          setContactoVerificado(true);
          setClienteExistente(true);
          setMostrarDados(true);

          setCustomerName(cliente.customerName || "");
          setPhone(cliente.phone || "");
          setEmail(cliente.email || "");
          setAddress(cliente.address || "");

          setCompany(cliente.company || "");
          setNuit(cliente.nuit || "");

          setCustomerType(
            cliente.customerType === "COMPANY"
              ? "COMPANY"
              : "INDIVIDUAL"
          );

          setMensagemContacto(
            "A sua sessão foi identificada. Os dados da sua conta foram carregados automaticamente."
          );
        }
      } catch (error) {
        console.error(
          "Erro ao verificar sessão:",
          error
        );
      } finally {
        if (activo) {
          setAVerificarSessao(false);
        }
      }
    }

    carregarSessao();

    return () => {
      activo = false;
    };
  }, []);

  // =====================================================
  // ALTERAR TELEFONE
  // =====================================================

  function alterarTelefone(valor: string) {
    if (sessaoCliente) return;

    setPhone(valor);

    setContactoVerificado(false);
    setClienteExistente(false);
    setMostrarDados(false);

    setMensagemContacto("");
    setErro("");

    setCustomerName("");
    setCompany("");
    setNuit("");
    setEmail("");
    setAddress("");

    setCustomerType("INDIVIDUAL");
  }

  // =====================================================
  // VERIFICAR CONTACTO
  // =====================================================

  async function verificarContacto() {
    setErro("");
    setMensagemContacto("");

    const telefone = phone.trim();

    if (telefone.replace(/\D/g, "").length < 9) {
      setErro(
        "Introduza um número de telefone válido."
      );
      return;
    }

    if (verificando) return;

    setVerificando(true);

    try {
      const resposta = await fetch(
        `/api/quotations/contact?phone=${encodeURIComponent(
          telefone
        )}`,
        {
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível verificar o contacto."
        );
      }

      setContactoVerificado(true);

      if (dados.found && dados.customer) {
        const cliente: Cliente = dados.customer;

        setCustomerName(cliente.customerName || "");
        setCompany(cliente.company || "");
        setPhone(cliente.phone || telefone);
        setEmail(cliente.email || "");
        setAddress(cliente.address || "");

        const tipo: CustomerType =
          cliente.customerType === "COMPANY"
            ? "COMPANY"
            : cliente.customerType === "INDIVIDUAL"
              ? "INDIVIDUAL"
              : cliente.company
                ? "COMPANY"
                : "INDIVIDUAL";

        setCustomerType(tipo);
        setNuit(cliente.nuit || "");

        setClienteExistente(true);
        setMostrarDados(true);

        setMensagemContacto(
          "Encontrámos um registo associado a este contacto. Confirme os dados antes de continuar."
        );
      } else {
        setCustomerType("INDIVIDUAL");

        setCustomerName("");
        setCompany("");
        setNuit("");
        setEmail("");
        setAddress("");

        setClienteExistente(false);
        setMostrarDados(true);

        setMensagemContacto(
          "Este contacto ainda não tem registo. Preencha os seus dados para continuar."
        );
      }
    } catch (error) {
      setContactoVerificado(false);
      setMostrarDados(false);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao verificar o contacto."
      );
    } finally {
      setVerificando(false);
    }
  }

  // =====================================================
  // SELECCIONAR TIPO DE CLIENTE
  // =====================================================

  function seleccionarTipoCliente(tipo: CustomerType) {
    setCustomerType(tipo);
    setErro("");

    if (tipo === "INDIVIDUAL") {
      setCompany("");
      setNuit("");
    }
  }

  // =====================================================
  // CRIAR COTAÇÃO
  // =====================================================

  async function submeterCotacao(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setErro("");

    if (itensSelecionados.length === 0) {
      setErro(
        "Seleccione pelo menos um produto para solicitar a cotação."
      );
      return;
    }

    if (!contactoVerificado || !mostrarDados) {
      setErro(
        "Conclua primeiro a identificação do cliente."
      );
      return;
    }

    if (!customerName.trim() || !phone.trim()) {
      setErro(
        "O nome e o contacto telefónico são obrigatórios."
      );
      return;
    }

    if (customerType === "COMPANY") {
      if (!company.trim()) {
        setErro("Introduza o nome da empresa.");
        return;
      }

      if (!/^\d{9}$/.test(nuit)) {
        setErro(
          "O NUIT deve conter exactamente 9 dígitos."
        );
        return;
      }
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setErro(
        "Introduza um endereço de email válido."
      );
      return;
    }

    setLoading(true);

    try {
      const produtosCotados = itensSelecionados.map(
        (item) => item.produto.id
      );

      const resposta = await fetch(
        "/api/quotations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerType,

            customerName: customerName.trim(),

            company:
              customerType === "COMPANY"
                ? company.trim()
                : null,

            nuit:
              customerType === "COMPANY"
                ? nuit.trim()
                : null,

            phone: phone.trim(),
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            notes: notes.trim() || undefined,

            // Apenas os identificadores e quantidades.
            // Os preços serão calculados pelo servidor.
            items: itensSelecionados.map((item) => ({
              productId: item.produto.id,
              quantity: item.quantidade,
            })),
          }),
        }
      );

      const resultado: RespostaApi | null =
        await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          resultado?.error ||
            "Não foi possível criar a cotação."
        );
      }

      if (
        !resultado?.quotation?.id ||
        !resultado.quotation.quoteNumber
      ) {
        throw new Error(
          "A resposta do servidor não contém os dados da cotação."
        );
      }

      // Remover apenas os produtos incluídos na cotação.
      produtosCotados.forEach((produtoId) => {
        remover(produtoId);
      });

      router.push(
        `/cotacoes/${resultado.quotation.id}`
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao solicitar a cotação."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <main className="min-h-[70vh] bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-5">

        {/* CABEÇALHO */}

        <div className="mb-8">
          <Link
            href="/carrinho"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-cyan-600"
          >
            <ArrowLeft size={17} />
            Voltar ao carrinho
          </Link>

          <h1 className="mt-4 text-3xl font-black text-[#071B2D]">
            Solicitar cotação
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {sessaoCliente
              ? "Os seus dados foram carregados automaticamente."
              : "Identifique-se para solicitar a sua cotação."}
          </p>
        </div>

        {/* CARRINHO VAZIO */}

        {itens.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <FileText
              size={50}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-5 text-xl font-bold text-[#071B2D]">
              Não existem produtos no carrinho
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Adicione produtos ao carrinho antes de solicitar uma cotação.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-white hover:bg-cyan-600"
            >
              Explorar produtos
            </Link>
          </div>

        ) : itensSelecionados.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <FileText
              size={50}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-5 text-xl font-bold text-[#071B2D]">
              Nenhum produto seleccionado
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Volte ao carrinho e seleccione os produtos que pretende incluir na cotação.
            </p>

            <Link
              href="/carrinho"
              className="mt-6 inline-flex rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-white hover:bg-cyan-600"
            >
              Seleccionar produtos
            </Link>
          </div>

        ) : (

          <form
            onSubmit={submeterCotacao}
            className="grid grid-cols-1 gap-8 lg:grid-cols-3"
          >

            {/* COLUNA PRINCIPAL */}

            <div className="space-y-6 lg:col-span-2">

              {/* ETAPA 1: IDENTIFICAÇÃO */}

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                    Etapa 1
                  </span>

                  <h2 className="mt-1 text-lg font-bold text-[#071B2D]">
                    Identificação do cliente
                  </h2>
                </div>

                {aVerificarSessao ? (

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    A verificar a sua sessão...
                  </div>

                ) : sessaoCliente ? (

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">

                    <div className="flex items-center gap-2 font-semibold text-green-700">
                      <CheckCircle2 size={18} />
                      Sessão identificada
                    </div>

                    <p className="mt-2 text-sm text-green-800">
                      Os dados da sua conta foram carregados automaticamente.
                      Não precisa de voltar a introduzir o seu nome, telefone ou email.
                    </p>

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>
                        <strong>Nome:</strong> {customerName}
                      </p>

                      <p>
                        <strong>Telefone:</strong>{" "}
                        {phone || "Não indicado"}
                      </p>

                      {email && (
                        <p>
                          <strong>Email:</strong> {email}
                        </p>
                      )}
                    </div>
                  </div>

                ) : (

                  <>
                    <p className="mb-4 text-sm text-gray-500">
                      Introduza o seu contacto telefónico para recuperar
                      os seus dados ou iniciar uma nova solicitação.
                    </p>

                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Phone size={16} />
                      Contacto telefónico *
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">

                      <input
                        type="tel"
                        required
                        maxLength={40}
                        value={phone}
                        onChange={(e) =>
                          alterarTelefone(e.target.value)
                        }
                        placeholder="+258 84 000 0000"
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />

                      <button
                        type="button"
                        onClick={verificarContacto}
                        disabled={
                          verificando || !phone.trim()
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#071B2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {verificando ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Search size={17} />
                        )}

                        {verificando
                          ? "A verificar..."
                          : "Verificar contacto"}
                      </button>
                    </div>
                  </>
                )}

                {mensagemContacto && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    <CheckCircle2
                      size={18}
                      className="shrink-0"
                    />
                    <p>{mensagemContacto}</p>
                  </div>
                )}

              </section>

              {/* ETAPA 2: DADOS DO CLIENTE */}

              {mostrarDados && (

                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                      Etapa 2
                    </span>

                    <h2 className="mt-1 text-lg font-bold text-[#071B2D]">
                      Dados da cotação
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Escolha se a cotação será emitida em nome individual
                      ou de uma empresa.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                    {/* TIPO DE CLIENTE */}

                    <div className="sm:col-span-2">

                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Tipo de cliente *
                      </label>

                      <div className="grid grid-cols-2 gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            seleccionarTipoCliente("INDIVIDUAL")
                          }
                          className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                            customerType === "INDIVIDUAL"
                              ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <User
                            size={17}
                            className="mr-2 inline-block"
                          />
                          Pessoa individual
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            seleccionarTipoCliente("COMPANY")
                          }
                          className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                            customerType === "COMPANY"
                              ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <Building2
                            size={17}
                            className="mr-2 inline-block"
                          />
                          Empresa
                        </button>

                      </div>
                    </div>

                    {/* NOME */}

                    <div className="sm:col-span-2">

                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <User size={16} />

                        {customerType === "COMPANY"
                          ? "Nome da pessoa de contacto *"
                          : "Nome completo *"}
                      </label>

                      <input
                        type="text"
                        required
                        maxLength={150}
                        value={customerName}
                        readOnly={sessaoCliente}
                        onChange={(e) =>
                          setCustomerName(e.target.value)
                        }
                        placeholder="Nome completo"
                        className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 ${
                          sessaoCliente
                            ? "bg-gray-100 text-gray-600"
                            : ""
                        }`}
                      />
                    </div>

                    {/* DADOS DA EMPRESA */}

                    {customerType === "COMPANY" && (
                      <>

                        <div>
                          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Building2 size={16} />
                            Nome da empresa *
                          </label>

                          <input
                            type="text"
                            required
                            maxLength={150}
                            value={company}
                            onChange={(e) =>
                              setCompany(e.target.value)
                            }
                            placeholder="Nome da empresa"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                          />
                        </div>

                        <div>
                          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <FileText size={16} />
                            NUIT *
                          </label>

                          <input
                            type="text"
                            required
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
                            placeholder="Ex.: 123456789"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                          />

                          <p className="mt-1 text-xs text-gray-400">
                            Introduza os 9 dígitos do NUIT.
                          </p>
                        </div>

                      </>
                    )}

                    {/* EMAIL */}

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Mail size={16} />
                        Email
                      </label>

                      <input
                        type="email"
                        value={email}
                        readOnly={sessaoCliente}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        placeholder="cliente@email.com"
                        className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 ${
                          sessaoCliente
                            ? "bg-gray-100 text-gray-600"
                            : ""
                        }`}
                      />
                    </div>

                    {/* ENDEREÇO */}

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MapPin size={16} />
                        Endereço
                      </label>

                      <input
                        type="text"
                        maxLength={500}
                        value={address}
                        onChange={(e) =>
                          setAddress(e.target.value)
                        }
                        placeholder="Morada ou localização"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                    {/* OBSERVAÇÕES */}

                    <div className="sm:col-span-2">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MessageSquare size={16} />
                        Observações
                      </label>

                      <textarea
                        rows={4}
                        maxLength={2000}
                        value={notes}
                        onChange={(e) =>
                          setNotes(e.target.value)
                        }
                        placeholder="Informações adicionais sobre a cotação..."
                        className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                  </div>

                  {sessaoCliente && (
                    <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                      Os dados pessoais são provenientes da sua conta.
                      Pode escolher o tipo de cliente e preencher os dados
                      específicos da empresa para esta cotação.
                    </p>
                  )}

                  <p className="mt-3 rounded-lg bg-cyan-50 p-3 text-sm text-cyan-800">
                    <strong>Nota:</strong> A cotação terá validade automática
                    de 5 dias após a data da sua emissão.
                  </p>

                </section>
              )}

              {/* PRODUTOS SELECCIONADOS */}

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-5">
                  <h2 className="text-lg font-bold text-[#071B2D]">
                    Produtos seleccionados para cotação
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {quantidadeSelecionada} unidade(s) em{" "}
                    {itensSelecionados.length} produto(s).
                  </p>
                </div>

                <div className="space-y-5">

                  {itensSelecionados.map((item) => {

                    const produto = item.produto;

                    const promocional = temPromocao(produto);

                    const precoOriginal =
                      obterPrecoOriginal(produto);

                    const precoFinal =
                      obterPrecoFinal(produto);

                    const descontoUnitario =
                      obterDescontoUnitario(produto);

                    const descontoProduto =
                      descontoUnitario * item.quantidade;

                    return (

                      <div
                        key={produto.id}
                        className="flex items-center gap-4 border-b border-gray-100 pb-5 last:border-0 last:pb-0"
                      >

                        {/* IMAGEM */}

                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">

                          {produto.image ? (

                            <Image
                              src={produto.image}
                              alt={produto.name}
                              fill
                              sizes="64px"
                              className="object-contain p-1"
                              unoptimized
                            />

                          ) : (

                            <div className="flex h-full items-center justify-center text-xs text-gray-400">
                              Sem imagem
                            </div>

                          )}

                        </div>

                        {/* INFORMAÇÃO */}

                        <div className="min-w-0 flex-1">

                          <h3 className="text-sm font-bold text-[#071B2D]">
                            {produto.name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            Quantidade: {item.quantidade}
                          </p>

                          {promocional && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">

                              <span className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold uppercase text-red-600">
                                Promoção
                              </span>

                              <span className="text-xs font-bold text-green-600">
                                -{obterPercentagemDesconto(produto)}%
                              </span>

                            </div>
                          )}

                          <div className="mt-2 space-y-1">

                            {promocional && (
                              <p className="text-xs text-gray-400 line-through">
                                {formatarPreco(
                                  precoOriginal * item.quantidade
                                )}
                              </p>
                            )}

                            <p className="text-sm font-bold text-cyan-700">
                              {formatarPreco(
                                precoFinal * item.quantidade
                              )}
                            </p>

                            {promocional && (
                              <p className="flex items-center gap-1 text-xs font-semibold text-green-600">
                                <Tag size={12} />
                                Poupança:{" "}
                                {formatarPreco(descontoProduto)}
                              </p>
                            )}

                          </div>

                        </div>

                        {/* REMOVER */}

                        <button
                          type="button"
                          onClick={() =>
                            remover(produto.id)
                          }
                          className="shrink-0 rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remover ${produto.name}`}
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    );
                  })}

                </div>

              </section>

            </div>

            {/* RESUMO DA COTAÇÃO */}

            <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <h2 className="text-lg font-bold text-[#071B2D]">
                Resumo da cotação
              </h2>

              <div className="mt-5 flex justify-between text-sm text-gray-600">
                <span>Produtos seleccionados</span>
                <span>{itensSelecionados.length}</span>
              </div>

              <div className="mt-3 flex justify-between text-sm text-gray-600">
                <span>Quantidade</span>
                <span>{quantidadeSelecionada}</span>
              </div>

              <div className="mt-3 flex justify-between text-sm text-gray-600">
                <span>Produtos em promoção</span>
                <span>{quantidadeProdutosPromocionais}</span>
              </div>

              <div className="my-5 border-t border-gray-200" />

              {/* SUBTOTAL ORIGINAL */}

              <div className="flex justify-between gap-3 text-sm text-gray-500">
                <span>Subtotal original</span>

                <span className="text-right line-through">
                  {formatarPreco(subtotalOriginal)}
                </span>
              </div>

              {/* DESCONTO */}

              <div className="mt-4 flex justify-between gap-3 text-sm text-green-600">
                <span>Desconto promocional</span>

                <span className="text-right font-semibold">
                  - {formatarPreco(descontoTotal)}
                </span>
              </div>

              {/* TOTAL */}

              <div className="my-5 border-t border-gray-200" />

              <div className="flex items-center justify-between gap-3">

                <span className="font-bold text-[#071B2D]">
                  Total estimado
                </span>

                <span className="text-xl font-black text-cyan-700">
                  {formatarPreco(subtotalPromocional)}
                </span>

              </div>

              {/* INFORMAÇÃO PROMOCIONAL */}

              {descontoTotal > 0 && (
                <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3">

                  <div className="flex items-center gap-2 text-sm font-bold text-green-700">
                    <Tag size={16} />
                    Está a poupar!
                  </div>

                  <p className="mt-1 text-sm text-green-700">
                    Poupa{" "}
                    <strong>
                      {formatarPreco(descontoTotal)}
                    </strong>{" "}
                    nos produtos seleccionados.
                  </p>

                </div>
              )}

              {/* AVISO */}

              <p className="mt-5 rounded-lg bg-cyan-50 p-3 text-xs leading-relaxed text-cyan-800">
                Os descontos apresentados são estimativas baseadas
                nos preços actuais dos produtos. O valor definitivo
                será calculado e confirmado pelo servidor no momento
                da emissão da cotação.
              </p>

              <Link
                href="/carrinho"
                className="mt-4 block text-center text-sm text-gray-500 transition hover:text-cyan-600"
              >
                Voltar ao carrinho
              </Link>

            </aside>

            {/* ERRO E BOTÃO */}

            <div className="lg:col-span-3">

              {erro && (
                <div className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle
                    size={18}
                    className="shrink-0"
                  />
                  <p>{erro}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  aVerificarSessao ||
                  itensSelecionados.length === 0 ||
                  !contactoVerificado ||
                  !mostrarDados
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-4 font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading ? (

                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    A criar cotação...
                  </>

                ) : (

                  <>
                    <FileText size={18} />
                    Gerar cotação
                  </>

                )}

              </button>

              {!contactoVerificado && !aVerificarSessao && (
                <p className="mt-2 text-center text-xs text-gray-400">
                  Verifique o contacto para continuar.
                </p>
              )}

            </div>

          </form>

        )}

      </div>
    </main>
  );
}
