
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
  Hash,
} from "lucide-react";

import {
  gerarPDFCotacao,
  type DadosPDFCotacao,
} from "@/lib/gerar-pdf-cotacao";

type CustomerType = "INDIVIDUAL" | "COMPANY";

interface CotacaoItem {
  id: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: string | number;
  total: string | number;
}

interface Cotacao {
  id: string;
  quoteNumber: string;
  customerType?: CustomerType | null;
  customerName: string;
  company?: string | null;
  nuit?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
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

// Formatar datas usando o fuso horário de Maputo.
function formatarData(data?: string | null) {
  if (!data) return "—";

  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-MZ", {
    timeZone: "Africa/Maputo",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(dataConvertida);
}

function CotacaoConteudo() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [aGerarPDF, setAGerarPDF] = useState(false);
  const [erroPDF, setErroPDF] = useState("");

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
          throw new Error(
            dados.error || "Não foi possível carregar a cotação."
          );
        }

        if (ativo) {
          const cotacaoRecebida = dados.quotation as Cotacao;

          const customerType =
            cotacaoRecebida.customerType ??
            (cotacaoRecebida.company ? "COMPANY" : "INDIVIDUAL");

          setCotacao({
            ...cotacaoRecebida,
            customerType,
          });
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
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarCotacao();

    return () => {
      ativo = false;
    };
  }, [id]);

  // Descarregar cotação em PDF.
  async function descarregarPDF() {
    if (!cotacao || aGerarPDF) return;

    try {
      setAGerarPDF(true);
      setErroPDF("");

      await gerarPDFCotacao(cotacao as DadosPDFCotacao);
    } catch (error) {
      setErroPDF(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o PDF."
      );
    } finally {
      setAGerarPDF(false);
    }
  }

  // Imprimir ou guardar a cotação em PDF pelo navegador.
  function imprimirCotacao() {
    window.print();
  }

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

  const isCompany = cotacao.customerType === "COMPANY";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl">

        {/* Botões superiores */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-600"
          >
            <ArrowLeft size={18} />
            Voltar à loja
          </Link>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={descarregarPDF}
              disabled={aGerarPDF}
              className="inline-flex items-center gap-2 rounded-lg bg-[#071B2D] px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aGerarPDF ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <FileText size={18} />
              )}

              {aGerarPDF ? "A gerar PDF..." : "Descarregar PDF"}
            </button>

            <button
              type="button"
              onClick={imprimirCotacao}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              <Printer size={18} />
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>

        {/* Erro ao gerar PDF */}
        {erroPDF && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{erroPDF}</span>
          </div>
        )}

        <article className="overflow-hidden rounded-xl bg-white shadow-sm print:rounded-none print:shadow-none">

          {/* Cabeçalho */}
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

            {/* Dados do cliente e informação da cotação */}
            <section className="grid gap-8 sm:grid-cols-2">

              {/* Dados do cliente */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <User size={18} className="text-cyan-600" />
                  Dados do cliente
                </h2>

                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-500">
                      Tipo de cliente:
                    </span>{" "}
                    <span className="font-semibold text-slate-900">
                      {isCompany ? "Empresa" : "Pessoa individual"}
                    </span>
                  </p>

                  <p className="font-semibold text-slate-900">
                    {cotacao.customerName}
                  </p>

                  {isCompany && cotacao.company && (
                    <p className="flex items-center gap-2">
                      <Building2
                        size={15}
                        className="shrink-0 text-cyan-600"
                      />
                      Empresa: {cotacao.company}
                    </p>
                  )}

                  {isCompany && cotacao.nuit && (
                    <p className="flex items-center gap-2">
                      <Hash
                        size={15}
                        className="shrink-0 text-cyan-600"
                      />
                      NUIT: {cotacao.nuit}
                    </p>
                  )}

                  <p className="flex items-center gap-2">
                    <Phone size={15} className="shrink-0" />
                    {cotacao.phone}
                  </p>

                  {cotacao.email && (
                    <p className="flex items-center gap-2 break-all">
                      <Mail size={15} className="shrink-0" />
                      {cotacao.email}
                    </p>
                  )}

                  {cotacao.address && (
                    <p className="flex items-center gap-2">
                      <MapPin size={15} className="shrink-0" />
                      {cotacao.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Informação da cotação */}
              <div className="sm:text-right">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 sm:justify-end">
                  <CalendarDays size={18} className="text-cyan-600" />
                  Informação da cotação
                </h2>

                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    Emissão:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatarData(cotacao.createdAt)}
                    </span>
                  </p>

                  <p>
                    Validade:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatarData(cotacao.validUntil)}
                    </span>
                  </p>

                  <div className="flex items-start gap-2 sm:justify-end">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-cyan-600"
                    />

                    <p className="text-left sm:text-right">
                      <strong className="text-slate-900">
                        Localização MSW BUSINESS
                      </strong>
                      <br />
                      Alto-Maé, cruzamento entre a Av. Mário Nguabi e a Rua da Guiné,
                      Maputo.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Produtos */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Produtos e serviços
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Produto</th>
                      <th className="px-3 py-3 text-center">Qtd.</th>
                      <th className="px-3 py-3 text-right">
                        Preço unit.
                      </th>
                      <th className="px-3 py-3 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {cotacao.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100"
                      >
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
                                <FileText
                                  size={20}
                                  className="text-slate-400"
                                />
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

                        <td className="px-3 py-4 text-right font-semibold text-slate-900">
                          {formatarMoeda(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Total */}
            <section className="flex justify-end">
              <div className="w-full max-w-sm">
                <div className="flex justify-between border-t-2 border-slate-900 pt-4 text-lg font-black text-slate-950">
                  <span>TOTAL</span>
                  <span>{formatarMoeda(cotacao.total)}</span>
                </div>
              </div>
            </section>

            {/* Observações */}
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

            {/* Carimbo da empresa */}
            <section className="w-full pt-6 text-center print:break-inside-avoid">
              <div className="mx-auto flex w-full justify-center">
                <Image
                  src="/msw_carrimbo.png"
                  alt="Carimbo MSW BUSINESS"
                  width={220}
                  height={140}
                  className="mx-auto block h-auto w-[180px] object-contain"
                  priority
                  unoptimized
                />
              </div>
            </section>

            {/* Rodapé */}
            <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400 print:break-inside-avoid">
              <p className="font-semibold text-slate-600">
                MSW BUSINESS — Obrigado pela preferência.
              </p>

              <p className="mt-2">
                <MapPin size={13} className="mr-1 inline-block" />
                Alto-Maé, cruzamento entre a Av. Mário Nguabi e a Rua da Guiné, Maputo.
              </p>

              <p className="mt-1">
                Esta cotação é válida por 5 dias após a emissão.
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
