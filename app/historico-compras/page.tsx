
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  History,
  Phone,
  ShieldCheck,
  Search,
  ShoppingBag,
  LockKeyhole,
  Package,
  CalendarDays,
  Building2,
  FileText,
  RefreshCw,
} from "lucide-react";

interface ProdutoHistorico {
  id: string;
  nome: string;
  quantidade: number;
  preco: number;
  total: number;
}

interface EncomendaHistorico {
  id: string;
  referencia: string;
  cliente: string;
  tipoCliente: "INDIVIDUAL" | "COMPANY";
  empresa: string | null;
  nuit: string | null;
  telefone: string;
  email: string | null;
  endereco: string | null;
  distrito: string | null;
  observacoes: string | null;
  total: number;
  entrega: number;
  estado: string;
  data: string;
  produtos: ProdutoHistorico[];
}

export default function HistoricoComprasPage() {
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [encomendas, setEncomendas] = useState<
    EncomendaHistorico[]
  >([]);
  const [consultou, setConsultou] = useState(false);

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "");

    let numero = numeros;

    if (numero.startsWith("00258")) {
      numero = numero.slice(5);
    } else if (numero.startsWith("258")) {
      numero = numero.slice(3);
    }

    return numero.slice(0, 9);
  }

  function atualizarTelefone(valor: string) {
    setTelefone(formatarTelefone(valor));
    setErro("");
    setMensagem("");
    setEncomendas([]);
    setConsultou(false);
  }

  function formatarValor(valor: number) {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(valor);
  }

  function formatarData(data: string) {
    return new Intl.DateTimeFormat("pt-MZ", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Africa/Maputo",
    }).format(new Date(data));
  }

  function formatarEstado(estado: string) {
    return estado
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letra) => letra.toUpperCase());
  }

  function corEstado(estado: string) {
    const valor = estado.toUpperCase();

    if (
      valor.includes("ENTREG") ||
      valor.includes("CONCLUID") ||
      valor.includes("FINALIZ")
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      valor.includes("CANCEL")
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      valor.includes("PENDENTE") ||
      valor.includes("PROCESS") ||
      valor.includes("CONFIRM")
    ) {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  async function consultarHistorico(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setErro("");
    setMensagem("");
    setEncomendas([]);
    setConsultou(false);

    const numero = formatarTelefone(telefone);

    if (!/^8\d{8}$/.test(numero)) {
      setErro(
        "Introduz um número de telefone moçambicano válido, com 9 dígitos."
      );
      return;
    }

    setLoading(true);

    try {
      const resposta = await fetch(
        `/api/historico-compras?telefone=${encodeURIComponent(numero)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(
          dados.error || "Não foi possível consultar o histórico."
        );
      }

      setConsultou(true);

      const lista: EncomendaHistorico[] =
        Array.isArray(dados.encomendas)
          ? dados.encomendas
          : [];

      setEncomendas(lista);

      if (lista.length === 0) {
        setMensagem(
          "Não encontrámos encomendas associadas a este número de telefone."
        );
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao consultar o histórico."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">

        {/* VOLTAR */}
        <Link
          href="/carrinho"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-cyan-600"
        >
          <ArrowLeft size={17} />
          Voltar ao carrinho
        </Link>

        {/* CARTÃO PRINCIPAL */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* CABEÇALHO */}
          <div className="bg-[#071B2D] px-6 py-9 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/15">
              <History
                size={32}
                className="text-cyan-400"
              />
            </div>

            <h1 className="mt-5 text-2xl font-black text-white sm:text-3xl">
              Histórico de compras
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-300">
              Consulta as tuas encomendas anteriores através
              do número de telefone utilizado na compra.
            </p>
          </div>

          {/* FORMULÁRIO */}
          <div className="p-6 sm:p-10">
            <div className="mb-7 text-center">
              <h2 className="text-lg font-bold text-[#071B2D]">
                Identifica o teu contacto
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Introduz o número de telefone ou WhatsApp
                associado às tuas encomendas.
              </p>
            </div>

            <form
              onSubmit={consultarHistorico}
              className="space-y-5"
            >
              {/* TELEFONE */}
              <div>
                <label
                  htmlFor="telefone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Número de telefone / WhatsApp
                </label>

                <div className="flex overflow-hidden rounded-lg border border-gray-200 transition focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-100">
                  <div className="flex items-center gap-2 border-r border-gray-200 bg-gray-50 px-4">
                    <Phone
                      size={17}
                      className="text-cyan-600"
                    />

                    <span className="text-sm font-semibold text-gray-700">
                      +258
                    </span>
                  </div>

                  <input
                    id="telefone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    maxLength={9}
                    value={telefone}
                    onChange={(e) =>
                      atualizarTelefone(e.target.value)
                    }
                    placeholder="8XX XXX XXX"
                    className="min-w-0 flex-1 px-4 py-3 text-sm text-[#071B2D] outline-none"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Exemplo: 841234567
                </p>
              </div>

              {/* ERRO */}
              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {erro}
                </div>
              )}

              {/* MENSAGEM */}
              {mensagem && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  {mensagem}
                </div>
              )}

              {/* BOTÃO */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3.5 font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw
                      size={19}
                      className="animate-spin"
                    />
                    A consultar...
                  </>
                ) : (
                  <>
                    <Search size={19} />
                    Consultar histórico
                  </>
                )}
              </button>
            </form>

            {/* SEGURANÇA */}
            <div className="mt-8 rounded-xl bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={22}
                  className="mt-0.5 shrink-0 text-green-600"
                />

                <div>
                  <h3 className="text-sm font-bold text-[#071B2D]">
                    Informação de privacidade
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Nesta fase, a consulta é realizada directamente
                    pelo número de telefone, sem código de confirmação.
                    A verificação por SMS ou WhatsApp poderá ser
                    implementada posteriormente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTADOS */}
        {consultou && (
          <section className="mt-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#071B2D]">
                  As tuas encomendas
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {encomendas.length} encomenda(s) encontrada(s)
                </p>
              </div>

              <span className="rounded-full bg-cyan-100 px-3 py-1.5 text-xs font-bold text-cyan-800">
                +258 {telefone}
              </span>
            </div>

            <div className="space-y-5">
              {encomendas.map((encomenda) => (
                <article
                  key={encomenda.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* CABEÇALHO DA ENCOMENDA */}
                  <div className="border-b border-gray-100 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Referência da encomenda
                        </p>

                        <h3 className="mt-1 break-all text-lg font-black text-[#071B2D]">
                          {encomenda.referencia}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${corEstado(encomenda.estado)}`}
                      >
                        {formatarEstado(encomenda.estado)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                      <CalendarDays
                        size={16}
                        className="text-cyan-600"
                      />
                      {formatarData(encomenda.data)}
                    </div>
                  </div>

                  {/* DADOS DO CLIENTE */}
                  <div className="grid grid-cols-1 gap-4 border-b border-gray-100 bg-gray-50 p-5 sm:grid-cols-2 sm:p-6">
                    <div>
                      <p className="text-xs text-gray-400">
                        Cliente
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#071B2D]">
                        {encomenda.cliente}
                      </p>
                    </div>

                    {encomenda.empresa && (
                      <div>
                        <p className="text-xs text-gray-400">
                          Empresa
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#071B2D]">
                          <Building2
                            size={15}
                            className="text-cyan-600"
                          />
                          {encomenda.empresa}
                        </p>
                      </div>
                    )}

                    {encomenda.nuit && (
                      <div>
                        <p className="text-xs text-gray-400">
                          NUIT
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#071B2D]">
                          <FileText
                            size={15}
                            className="text-cyan-600"
                          />
                          {encomenda.nuit}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-400">
                        Telefone
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#071B2D]">
                        +258 {encomenda.telefone}
                      </p>
                    </div>
                  </div>

                  {/* PRODUTOS */}
                  <div className="p-5 sm:p-6">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#071B2D]">
                      <Package
                        size={17}
                        className="text-cyan-600"
                      />
                      Produtos da encomenda
                    </h4>

                    <div className="space-y-3">
                      {encomenda.produtos.map((produto) => (
                        <div
                          key={produto.id}
                          className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#071B2D]">
                              {produto.nome}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {produto.quantidade} unidade(s) ×{" "}
                              {formatarValor(produto.preco)}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-bold text-[#071B2D]">
                            {formatarValor(produto.total)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* TOTAL */}
                    <div className="mt-5 space-y-2 border-t border-gray-200 pt-4">
                      <div className="flex justify-between gap-3 text-sm text-gray-500">
                        <span>Taxa de entrega</span>
                        <span>
                          {formatarValor(encomenda.entrega)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 pt-2">
                        <span className="font-bold text-[#071B2D]">
                          Total da encomenda
                        </span>

                        <span className="text-lg font-black text-cyan-700">
                          {formatarValor(encomenda.total)}
                        </span>
                      </div>
                    </div>

                    {/* ENTREGA */}
                    {(encomenda.endereco || encomenda.distrito) && (
                      <div className="mt-5 rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-bold text-gray-500">
                          Informação de entrega
                        </p>

                        {encomenda.endereco && (
                          <p className="mt-1 text-sm text-[#071B2D]">
                            {encomenda.endereco}
                          </p>
                        )}

                        {encomenda.distrito && (
                          <p className="mt-1 text-xs text-gray-500">
                            {encomenda.distrito}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* INFORMAÇÕES ADICIONAIS */}
        <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
          <LockKeyhole size={14} />
          <span>Consulta do histórico das tuas encomendas</span>
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-900"
          >
            <ShoppingBag size={16} />
            Continuar a comprar
          </Link>
        </div>
      </div>
    </main>
  );
}
