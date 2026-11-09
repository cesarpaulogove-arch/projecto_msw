"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Loader2,
  AlertCircle,
  FileText,
  CalendarDays,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
} from "lucide-react";

interface CotacaoItem {
  id: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: string | number;
  ivaRate: string | number;
  subtotal: string | number;
  ivaAmount: string | number;
  total: string | number;
}

interface Cotacao {
  id: string;
  quoteNumber: string;
  customerName: string;
  company?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  subtotal: string | number;
  ivaTotal: string | number;
  total: string | number;
  currency: string;
  status: string;
  notes?: string | null;
  validUntil?: string | null;
  createdAt: string;
  items: CotacaoItem[];
}

function formatarMoeda(valor: string | number) {
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 2,
  }).format(Number(valor));
}

function formatarData(data?: string | null) {
  if (!data) return "—";

  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(data));
}

function CotacaoConteudo() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) return;

    let ativo = true;

    async function carregarCotacao() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch(`/api/quotations/${id}`, {
          cache: "no-store",
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(dados.error || "Não foi possível carregar a cotação.");
        }

        if (ativo) {
          setCotacao(dados.quotation);
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Erro ao carregar a cotação."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarCotacao();

    return () => {
      ativo = false;
    };
  }, [id]);

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (erro || !cotacao) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />

        <h1 className="text-xl font-bold text-slate-900">
          Cotação não encontrada
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {erro || "Não foi possível localizar esta cotação."}
        </p>

        <Link
          href="/"
          className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Voltar à página inicial
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-600"
          >
            <ArrowLeft size={18} />
            Voltar à loja
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
          >
            <Printer size={18} />
            Imprimir / Guardar PDF
          </button>
        </div>

        <article className="overflow-hidden rounded-xl bg-white shadow-sm print:rounded-none print:shadow-none">
          <header className="border-b-4 border-cyan-500 bg-slate-950 p-8 text-white">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black tracking-wide">
                  MSW <span className="text-cyan-400">BUSINESS</span>
                </h1>

                <p className="mt-2 text-sm text-slate-300">
                  Tecnologia, componentes e soluções electrónicas
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-center gap-2 text-cyan-400 sm:justify-end">
                  <FileText size={22} />
                  <span className="text-xl font-bold">COTAÇÃO</span>
                </div>

                <p className="mt-2 text-sm text-slate-300">
                  Nº {cotacao.quoteNumber}
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Emitida: {formatarData(cotacao.createdAt)}
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-8 p-6 sm:p-8">
            <section className="grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <User size={18} className="text-cyan-600" />
                  Dados do cliente
                </h2>

                <div className="space-y-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">
                    {cotacao.customerName}
                  </p>

                  {cotacao.company && (
                    <p className="flex items-center gap-2">
                      <Building2 size={15} />
                      {cotacao.company}
                    </p>
                  )}

                  <p className="flex items-center gap-2">
                    <Phone size={15} />
                    {cotacao.phone}
                  </p>

                  {cotacao.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={15} />
                      {cotacao.email}
                    </p>
                  )}

                  {cotacao.address && (
                    <p className="flex items-center gap-2">
                      <MapPin size={15} />
                      {cotacao.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="sm:text-right">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 sm:justify-end">
                  <CalendarDays size={18} className="text-cyan-600" />
                  Informação da cotação
                </h2>

                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    Estado:{" "}
                    <span className="font-semibold text-slate-900">
                      {cotacao.status}
                    </span>
                  </p>

                  <p>
                    Validade:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatarData(cotacao.validUntil)}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Produtos e serviços
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Produto</th>
                      <th className="px-3 py-3 text-center">Qtd.</th>
                      <th className="px-3 py-3 text-right">Preço unit.</th>
                      <th className="px-3 py-3 text-right">IVA</th>
                      <th className="px-3 py-3 text-right">Subtotal</th>
                      <th className="px-3 py-3 text-right">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cotacao.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            {item.productImage ? (
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-md object-contain"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100">
                                <FileText size={20} className="text-slate-400" />
                              </div>
                            )}

                            <span className="font-medium text-slate-900">
                              {item.productName}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-4 text-center">
                          {item.quantity}
                        </td>

                        <td className="px-3 py-4 text-right">
                          {formatarMoeda(item.unitPrice)}
                        </td>

                        <td className="px-3 py-4 text-right">
                          {Number(item.ivaRate)}%
                        </td>

                        <td className="px-3 py-4 text-right">
                          {formatarMoeda(item.subtotal)}
                        </td>

                        <td className="px-3 py-4 text-right font-semibold text-slate-900">
                          {formatarMoeda(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="flex justify-end">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatarMoeda(cotacao.subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total de IVA</span>
                  <span>{formatarMoeda(cotacao.ivaTotal)}</span>
                </div>

                <div className="flex justify-between border-t-2 border-slate-900 pt-4 text-lg font-black text-slate-950">
                  <span>TOTAL</span>
                  <span>{formatarMoeda(cotacao.total)}</span>
                </div>
              </div>
            </section>

            {cotacao.notes && (
              <section className="border-t border-slate-200 pt-5">
                <h2 className="mb-2 font-bold text-slate-900">
                  Observações
                </h2>

                <p className="whitespace-pre-wrap text-sm text-slate-600">
                  {cotacao.notes}
                </p>
              </section>
            )}

            <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
              <p>MSW BUSINESS — Obrigado pela preferência.</p>
              <p className="mt-1">
                Esta cotação está sujeita às condições de validade indicadas.
              </p>
            </footer>
          </div>
        </article>
      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          body {
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          article {
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}

export default function CotacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      }
    >
      <CotacaoConteudo />
    </Suspense>
  );
}