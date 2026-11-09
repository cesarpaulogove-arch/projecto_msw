"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  User,
  Mail,
  Search,
  Pencil,
  Truck,
  ClipboardCheck,
} from "lucide-react";

import { useCarrinho } from "@/app/components/carrinho/CartProvider";

interface EncomendaCriada {
  orderNumber: string;
  total: number;
}

interface ClienteEncontrado {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
}

type EstadoCliente = "inicial" | "pesquisando" | "encontrado" | "novo";

export default function FinalizarEncomendaPage() {
  const {
    itens,
    remover,
    atualizarQuantidade,
    limpar,
    total,
  } = useCarrinho();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");

  const [estadoCliente, setEstadoCliente] =
    useState<EstadoCliente>("inicial");

  const [clienteAntigo, setClienteAntigo] = useState(false);
  const [editarDados, setEditarDados] = useState(false);

  const [aPesquisar, setAPesquisar] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);

  const [erro, setErro] = useState("");

  const [encomenda, setEncomenda] =
    useState<EncomendaCriada | null>(null);

  // A entrega é opcional
  const [zonaEntrega, setZonaEntrega] = useState("");

  const formatarPreco = (valor: number) =>
    valor.toLocaleString("pt-MZ", {
      style: "currency",
      currency: "MZN",
    });

  // PESQUISAR CLIENTE PELO TELEFONE
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

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(
          dados.error || "Não foi possível pesquisar o cliente."
        );
      }

      if (dados.encontrado && dados.cliente) {
        const cliente: ClienteEncontrado = dados.cliente;

        setNome(cliente.nome);
        setTelefone(cliente.telefone || numero);
        setEmail(cliente.email || "");
        setEndereco(cliente.endereco || "");

        setClienteAntigo(true);
        setEstadoCliente("encontrado");
        setEditarDados(false);
      } else {
        setNome("");
        setEmail("");
        setEndereco("");

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

  // ALTERAR TELEFONE
  function alterarTelefone() {
    setEstadoCliente("inicial");
    setClienteAntigo(false);
    setEditarDados(false);

    setNome("");
    setEmail("");
    setEndereco("");
    setZonaEntrega("");

    setErro("");
  }

  // SELECCIONAR OU CANCELAR ENTREGA
  function seleccionarZona(zona: string) {
    setZonaEntrega((actual) => {
      if (actual === zona) {
        return "";
      }

      return zona;
    });

    setErro("");
  }

  // REGISTAR ENCOMENDA
  async function confirmarEncomenda(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (aEnviar) return;

    setErro("");

    if (itens.length === 0) {
      setErro("O carrinho está vazio.");
      return;
    }

    // Nome e telefone são os únicos dados obrigatórios
    if (!nome.trim() || !telefone.trim()) {
      setErro("Preenche o nome e o número de telefone.");
      return;
    }

    // O endereço só é obrigatório quando existe entrega
    if (zonaEntrega && !endereco.trim()) {
      setErro("Introduz o endereço para realizar a entrega.");
      return;
    }

    setAEnviar(true);

    try {
      const resposta = await fetch("/api/encomendas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: nome.trim(),
          phone: telefone.trim(),
          email: email.trim() || undefined,

          // Só envia endereço e zona quando a entrega é seleccionada
          address: zonaEntrega ? endereco.trim() : undefined,
          district: zonaEntrega || undefined,

          items: itens.map((item) => ({
            productId: item.produto.id,
            quantity: item.quantidade,
          })),
        }),
      });

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok || !dados?.success) {
        throw new Error(
          dados?.error || "Não foi possível registar a encomenda."
        );
      }

      if (
        !dados.orderNumber ||
        !Number.isFinite(Number(dados.total))
      ) {
        throw new Error(
          "A resposta do servidor está incompleta."
        );
      }

      setEncomenda({
        orderNumber: String(dados.orderNumber),
        total: Number(dados.total),
      });

      limpar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao confirmar a encomenda."
      );
    } finally {
      setAEnviar(false);
    }
  }

  // ENCOMENDA CONFIRMADA
  if (encomenda) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />

          <h1 className="mt-5 text-2xl font-black text-[#071B2D]">
            Encomenda registada!
          </h1>

          <p className="mt-3 text-gray-600">
            A tua encomenda foi registada com sucesso.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Referência da encomenda
            </p>

            <p className="mt-1 text-xl font-black text-cyan-700">
              {encomenda.orderNumber}
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Total dos produtos
            </p>

            <p className="text-2xl font-black text-[#071B2D]">
              {formatarPreco(encomenda.total)}
            </p>

            <p className="mt-3 text-xs text-gray-500">
              {zonaEntrega
                ? "A equipa MSW BUSINESS confirmará o custo da entrega e os detalhes dos testes dos componentes."
                : "Não foi solicitada entrega. A equipa MSW BUSINESS poderá contactar-te para acompanhar a encomenda."}
            </p>
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
        </div>
      </main>
    );
  }

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
            Finalizar encomenda
          </h1>

          <p className="mt-2 text-gray-500">
            Identifica-te pelo número de telefone para continuar.
          </p>
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {erro}
          </div>
        )}

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
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-7">
              {/* IDENTIFICAÇÃO DO CLIENTE */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <Phone size={21} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-[#071B2D]">
                      Identificação
                    </h2>

                    <p className="text-sm text-gray-500">
                      Primeiro, introduz o teu telefone.
                    </p>
                  </div>
                </div>

                {estadoCliente === "inicial" ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Número de telefone *
                    </label>

                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          pesquisarCliente();
                        }
                      }}
                      placeholder="+258 8X XXX XXXX"
                      autoComplete="tel"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                    />

                    <button
                      type="button"
                      onClick={pesquisarCliente}
                      disabled={aPesquisar}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-bold text-white transition hover:bg-cyan-800 disabled:opacity-60"
                    >
                      {aPesquisar ? (
                        <>
                          <Loader2 size={19} className="animate-spin" />
                          A pesquisar...
                        </>
                      ) : (
                        <>
                          <Search size={19} />
                          Continuar
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Telefone identificado
                        </p>

                        <p className="mt-1 font-bold text-[#071B2D]">
                          {telefone}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={alterarTelefone}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-900"
                      >
                        <Pencil size={15} />
                        Alterar
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm">
                      {clienteAntigo ? (
                        <>
                          <CheckCircle2 size={17} className="text-green-600" />
                          <span className="font-semibold text-green-700">
                            Cliente identificado
                          </span>
                        </>
                      ) : (
                        <>
                          <User size={17} className="text-cyan-700" />
                          <span className="font-semibold text-cyan-700">
                            Novo cliente
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* DADOS DO CLIENTE E ENTREGA */}
              {estadoCliente !== "inicial" && (
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
                      {clienteAntigo && !editarDados ? (
                        <>
                          <div>
                            <p className="text-xs font-semibold uppercase text-gray-500">
                              Nome completo
                            </p>

                            <p className="mt-1 font-bold text-[#071B2D]">
                              {nome}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase text-gray-500">
                              E-mail
                            </p>

                            <p className="mt-1 font-medium text-gray-700">
                              {email || "Não informado"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditarDados(true)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-900"
                          >
                            <Pencil size={16} />
                            Actualizar dados pessoais
                          </button>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <User size={16} />
                              Nome completo *
                            </label>

                            <input
                              required
                              value={nome}
                              onChange={(e) => setNome(e.target.value)}
                              placeholder="Introduz o teu nome"
                              autoComplete="name"
                              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                            />
                          </div>

                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <Mail size={16} />
                              E-mail (opcional)
                            </label>

                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="exemplo@email.com"
                              autoComplete="email"
                              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                            />
                          </div>

                          {clienteAntigo && (
                            <button
                              type="button"
                              onClick={() => setEditarDados(false)}
                              className="text-sm font-semibold text-gray-500 hover:text-cyan-700"
                            >
                              Cancelar edição
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </section>

                  {/* ENTREGA OPCIONAL */}
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
                        onClick={() => setZonaEntrega("")}
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
                        onClick={() => setZonaEntrega("MAPUTO")}
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

                        {/* TESTES NO ACTO DA ENTREGA */}
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
                                Quando a encomenda for entregue, a equipa MSW BUSINESS realizará os testes dos componentes com o cliente.
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
                            Os testes são realizados no acto da entrega, de acordo com as características e possibilidades de cada componente.
                          </p>
                        </div>

                        <p className="text-xs text-gray-500">
                          Maputo: 300–500 MT. Matola: 600–1.000 MT.
                          O custo exacto será confirmado pela equipa MSW BUSINESS.
                          Este valor não está incluído no subtotal.
                        </p>
                      </div>
                    )}
                  </section>

                  <button
                    type="submit"
                    disabled={aEnviar || itens.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-6 py-4 font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {aEnviar ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        A registar encomenda...
                      </>
                    ) : (
                      "Confirmar encomenda"
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
                {itens.map((item) => (
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

                      <p className="mt-1 text-sm font-bold text-cyan-700">
                        {formatarPreco(
                          item.produto.price * item.quantidade
                        )}
                      </p>

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
                          disabled={
                            item.quantidade >= item.produto.stock
                          }
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
                ))}
              </div>

              {/* TOTAIS */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatarPreco(total)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
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
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#071B2D]">
                      Total dos produtos
                    </span>

                    <span className="text-xl font-black text-cyan-700">
                      {formatarPreco(total)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {zonaEntrega
                      ? "O custo exacto da entrega será confirmado pela equipa MSW BUSINESS. Os testes dos componentes serão realizados no acto da entrega."
                      : "A entrega não foi seleccionada. O valor apresentado corresponde apenas aos produtos."}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
