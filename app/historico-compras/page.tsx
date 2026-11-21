
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  History,
  ShieldCheck,
  ShoppingBag,
  LockKeyhole,
  Package,
  CalendarDays,
  Building2,
  FileText,
  RefreshCw,
  LogIn,
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
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [encomendas, setEncomendas] = useState<EncomendaHistorico[]>([]);

  useEffect(() => {
    let activo = true;

    async function carregarHistorico() {
      setLoading(true);
      setErro("");
      setMensagem("");

      try {
        const resposta = await fetch("/api/historico-compras", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const dados = await resposta.json();

        if (!activo) return;

        // Cliente sem sessão: permanece nesta página
        if (resposta.status === 401) {
          setAutenticado(false);
          setEncomendas([]);
          setMensagem("");
          setErro("");
          return;
        }

        if (!resposta.ok || !dados.success) {
          throw new Error(
            dados.error || "Não foi possível consultar o histórico."
          );
        }

        setAutenticado(true);

        const lista: EncomendaHistorico[] = Array.isArray(dados.encomendas)
          ? dados.encomendas
          : [];

        setEncomendas(lista);

        if (lista.length === 0) {
          setMensagem(
            "Ainda não encontrámos encomendas associadas à tua conta."
          );
        }
      } catch (error) {
        if (!activo) return;

        setErro(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao consultar o histórico."
        );
      } finally {
        if (activo) setLoading(false);
      }
    }

    carregarHistorico();

    return () => {
      activo = false;
    };
  }, []);

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

    if (valor.includes("CANCEL")) {
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

  return (
    <main className="min-h-[70vh] bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/minha-conta"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-cyan-600"
        >
          <ArrowLeft size={17} />
          Voltar à minha conta
        </Link>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-[#071B2D] px-6 py-9 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/15">
              <History size={32} className="text-cyan-400" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-white sm:text-3xl">
              Histórico de compras
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-300">
              Consulta as tuas encomendas, acompanha os estados e
              consulta os detalhes das tuas compras.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            {loading && (
              <div className="py-10 text-center">
                <RefreshCw
                  size={32}
                  className="mx-auto animate-spin text-cyan-600"
                />
                <p className="mt-4 text-sm text-gray-500">
                  A carregar o teu histórico...
                </p>
              </div>
            )}

            {!loading && !autenticado && (
              <div className="py-8 text-center">
                <LockKeyhole
                  size={42}
                  className="mx-auto text-cyan-600"
                />

                <h2 className="mt-5 text-xl font-black text-[#071B2D]">
                  Inicia sessão para continuar
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                  Para proteger as tuas compras, precisas de entrar
                  na tua conta usando Google, email e password ou
                  telefone e password.
                </p>

                <Link
                  href="/minha-conta?redirect=/historico-compras"
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3.5 font-bold text-white transition hover:bg-cyan-600 sm:w-auto"
                >
                  <LogIn size={19} />
                  Entrar na minha conta
                </Link>
              </div>
            )}

            {!loading && autenticado && (
              <>
                <div className="mb-7 rounded-xl bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={23}
                      className="mt-0.5 shrink-0 text-green-600"
                    />
                    <div>
                      <h2 className="text-sm font-bold text-green-800">
                        Conta autenticada
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-green-700">
                        Estás a consultar o histórico associado à tua
                        conta. As tuas informações estão protegidas.
                      </p>
                    </div>
                  </div>
                </div>

                {erro && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {erro}
                  </div>
                )}

                {mensagem && (
                  <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    {mensagem}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-[#071B2D]">
                      As tuas encomendas
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {encomendas.length} encomenda(s) encontrada(s)
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {!loading && autenticado && encomendas.length > 0 && (
          <section className="mt-8 space-y-5">
            {encomendas.map((encomenda) => (
              <article
                key={encomenda.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
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
                    <CalendarDays size={16} className="text-cyan-600" />
                    {formatarData(encomenda.data)}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-b border-gray-100 bg-gray-50 p-5 sm:grid-cols-2 sm:p-6">
                  <div>
                    <p className="text-xs text-gray-400">Cliente</p>
                    <p className="mt-1 text-sm font-semibold text-[#071B2D]">
                      {encomenda.cliente}
                    </p>
                  </div>

                  {encomenda.empresa && (
                    <div>
                      <p className="text-xs text-gray-400">Empresa</p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#071B2D]">
                        <Building2 size={15} className="text-cyan-600" />
                        {encomenda.empresa}
                      </p>
                    </div>
                  )}

                  {encomenda.nuit && (
                    <div>
                      <p className="text-xs text-gray-400">NUIT</p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#071B2D]">
                        <FileText size={15} className="text-cyan-600" />
                        {encomenda.nuit}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-400">Telefone</p>
                    <p className="mt-1 text-sm font-semibold text-[#071B2D]">
                      {encomenda.telefone}
                    </p>
                  </div>

                  {encomenda.email && (
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="mt-1 break-all text-sm font-semibold text-[#071B2D]">
                        {encomenda.email}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#071B2D]">
                    <Package size={17} className="text-cyan-600" />
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

                  <div className="mt-5 space-y-2 border-t border-gray-200 pt-4">
                    <div className="flex justify-between gap-3 text-sm text-gray-500">
                      <span>Taxa de entrega</span>
                      <span>{formatarValor(encomenda.entrega)}</span>
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
          </section>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
          <LockKeyhole size={14} />
          <span>Histórico privado da tua conta MSW BUSINESS</span>
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
