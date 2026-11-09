
"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  UserPlus,
} from "lucide-react";

import { useCarrinho } from "@/app/components/carrinho/CartProvider";

interface CotacaoCriada {
  id: string;
  quoteNumber: string;
}

interface Cliente {
  customerName: string;
  company: string | null;
  phone: string;
  email: string | null;
  address: string | null;
}

interface RespostaApi {
  error?: string;
  quotation?: CotacaoCriada;
}

export default function SolicitarCotacaoPage() {
  const { itens, remover, limpar, total, quantidadeTotal } =
    useCarrinho();

  const [customerName, setCustomerName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [contactoVerificado, setContactoVerificado] = useState(false);
  const [clienteExistente, setClienteExistente] = useState(false);
  const [mostrarDados, setMostrarDados] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagemContacto, setMensagemContacto] = useState("");
  const [cotacao, setCotacao] = useState<CotacaoCriada | null>(null);

  const formatarPreco = (valor: number) =>
    new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);

  function dataMinima() {
    const data = new Date();
    data.setDate(data.getDate() + 1);

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function alterarTelefone(valor: string) {
    setPhone(valor);
    setContactoVerificado(false);
    setClienteExistente(false);
    setMostrarDados(false);
    setMensagemContacto("");
    setErro("");
    setCustomerName("");
    setCompany("");
    setEmail("");
    setAddress("");
  }

  async function verificarContacto() {
    setErro("");
    setMensagemContacto("");

    const telefone = phone.trim();

    if (telefone.length < 7) {
      setErro("Introduza um número de telefone válido.");
      return;
    }

    setVerificando(true);

    try {
      const resposta = await fetch(
        `/api/quotations/contact?phone=${encodeURIComponent(telefone)}`,
        { cache: "no-store" }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.error || "Não foi possível verificar o contacto.");
      }

      setContactoVerificado(true);

      if (dados.found && dados.customer) {
        const cliente: Cliente = dados.customer;

        setCustomerName(cliente.customerName || "");
        setCompany(cliente.company || "");
        setPhone(cliente.phone || telefone);
        setEmail(cliente.email || "");
        setAddress(cliente.address || "");

        setClienteExistente(true);
        setMostrarDados(true);
        setMensagemContacto(
          "Encontrámos um registo associado a este contacto. Confirme os dados antes de continuar."
        );
      } else {
        setClienteExistente(false);
        setMostrarDados(true);
        setMensagemContacto(
          "Este contacto ainda não tem registo. Preencha os seus dados para continuar."
        );
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao verificar o contacto."
      );
    } finally {
      setVerificando(false);
    }
  }

  async function submeterCotacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (itens.length === 0) {
      setErro("O carrinho não possui produtos para cotação.");
      return;
    }

    if (!contactoVerificado) {
      setErro("Verifique primeiro o seu contacto telefónico.");
      return;
    }

    if (!customerName.trim() || !phone.trim()) {
      setErro("Preencha o nome e o contacto telefónico.");
      return;
    }

    setLoading(true);

    try {
      const resposta = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          company: company.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
          validUntil: validUntil
            ? new Date(`${validUntil}T23:59:59`).toISOString()
            : undefined,
          items: itens.map((item) => ({
            productId: item.produto.id,
            quantity: item.quantidade,
          })),
        }),
      });

      const resultado: RespostaApi | null =
        await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          resultado?.error || "Não foi possível criar a cotação."
        );
      }

      if (!resultado?.quotation?.id || !resultado.quotation.quoteNumber) {
        throw new Error("A resposta do servidor não contém os dados da cotação.");
      }

      setCotacao({
        id: resultado.quotation.id,
        quoteNumber: resultado.quotation.quoteNumber,
      });

      limpar();
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

  if (cotacao) {
    return (
      <main className="min-h-[70vh] bg-gray-50 px-5 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 size={60} className="mx-auto text-green-500" />

          <h1 className="mt-5 text-2xl font-black text-[#071B2D]">
            Cotação criada!
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            A sua solicitação foi registada com sucesso. Guarde o número da
            cotação para futuras consultas.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Número da cotação
            </p>
            <p className="mt-2 text-xl font-black text-cyan-700">
              {cotacao.quoteNumber}
            </p>
          </div>

          <Link
            href={`/cotacoes/${cotacao.id}`}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-white transition hover:bg-cyan-600"
          >
            <FileText size={18} />
            Consultar cotação
          </Link>

          <Link href="/" className="mt-4 inline-block text-sm text-gray-500 hover:text-cyan-600">
            Voltar à loja
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-5">
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
            Comece por indicar o seu contacto telefónico.
          </p>
        </div>

        {itens.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <FileText size={50} className="mx-auto text-gray-300" />
            <h2 className="mt-5 text-xl font-bold text-[#071B2D]">
              Não existem produtos para cotação
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
        ) : (
          <form
            onSubmit={submeterCotacao}
            className="grid grid-cols-1 gap-8 lg:grid-cols-3"
          >
            <div className="space-y-6 lg:col-span-2">
              {/* ETAPA 1: CONTACTO */}
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                    Etapa 1
                  </span>
                  <h2 className="mt-1 text-lg font-bold text-[#071B2D]">
                    Identificação do contacto
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Introduza o telefone utilizado nas suas solicitações anteriores.
                  </p>
                </div>

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
                    onChange={(e) => alterarTelefone(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />

                  <button
                    type="button"
                    onClick={verificarContacto}
                    disabled={verificando || !phone.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#071B2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {verificando ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Search size={17} />
                    )}
                    {verificando ? "A verificar..." : "Verificar contacto"}
                  </button>
                </div>

                {mensagemContacto && (
                  <div className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-sm ${
                    clienteExistente
                      ? "border border-green-200 bg-green-50 text-green-700"
                      : "border border-cyan-200 bg-cyan-50 text-cyan-800"
                  }`}>
                    {clienteExistente ? (
                      <CheckCircle2 size={18} className="shrink-0" />
                    ) : (
                      <UserPlus size={18} className="shrink-0" />
                    )}
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
                      {clienteExistente ? "Confirmar dados do cliente" : "Registo de novo cliente"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {clienteExistente
                        ? "Confirme ou atualize os dados recuperados."
                        : "Preencha os seus dados para criar o primeiro registo."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <User size={16} />
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={150}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nome do cliente"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Building2 size={16} />
                        Empresa
                      </label>
                      <input
                        type="text"
                        maxLength={150}
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Nome da empresa (opcional)"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Mail size={16} />
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cliente@email.com"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MapPin size={16} />
                        Endereço
                      </label>
                      <input
                        type="text"
                        maxLength={500}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Morada ou localização"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <CalendarDays size={16} />
                        Validade pretendida
                      </label>
                      <input
                        type="date"
                        min={dataMinima()}
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        Opcional. Pode deixar em branco.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MessageSquare size={16} />
                        Observações
                      </label>
                      <textarea
                        rows={4}
                        maxLength={2000}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Informações adicionais sobre a cotação..."
                        className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* PRODUTOS */}
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-[#071B2D]">
                    Produtos seleccionados
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {quantidadeTotal} unidade(s) em {itens.length} produto(s).
                  </p>
                </div>

                <div className="space-y-4">
                  {itens.map((item) => (
                    <div
                      key={item.produto.id}
                      className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.produto.image && (
                          <Image
                            src={item.produto.image}
                            alt={item.produto.name}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                            unoptimized
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-[#071B2D]">
                          {item.produto.name}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Quantidade: {item.quantidade}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-cyan-700">
                          {formatarPreco(item.produto.price * item.quantidade)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => remover(item.produto.id)}
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remover ${item.produto.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* RESUMO */}
            <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071B2D]">
                Resumo da cotação
              </h2>

              <div className="mt-5 flex justify-between text-sm text-gray-600">
                <span>Produtos</span>
                <span>{itens.length}</span>
              </div>

              <div className="mt-3 flex justify-between text-sm text-gray-600">
                <span>Quantidade</span>
                <span>{quantidadeTotal}</span>
              </div>

              <div className="mt-4 flex justify-between text-sm text-gray-600">
                <span>Subtotal estimado</span>
                <span>{formatarPreco(total)}</span>
              </div>

              <div className="my-5 border-t border-gray-200" />

              <p className="text-xs leading-relaxed text-gray-400">
                O IVA será calculado individualmente para cada produto,
                utilizando a taxa configurada na base de dados.
              </p>

              {erro && (
                <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{erro}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || itens.length === 0 || !contactoVerificado || !mostrarDados}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    A criar cotação...
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    Gerar cotação
                  </>
                )}
              </button>

              {!contactoVerificado && (
                <p className="mt-2 text-center text-xs text-gray-400">
                  Verifique o contacto para continuar.
                </p>
              )}

              <Link
                href="/carrinho"
                className="mt-4 block text-center text-sm text-gray-500 transition hover:text-cyan-600"
              >
                Voltar ao carrinho
              </Link>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
