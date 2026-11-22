
"use client";

import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  PackageCheck,
  MapPin,
} from "lucide-react";

interface ResumoCarrinhoProps {
  quantidadeTotal: number;
  totalProdutos: number;
  custoEntrega?: number;
  carregando?: boolean;
}

export default function ResumoCarrinho({
  quantidadeTotal,
  totalProdutos,
  custoEntrega,
  carregando = false,
}: ResumoCarrinhoProps) {
  const entregaConfirmada = custoEntrega !== undefined;

  const total = totalProdutos + (custoEntrega ?? 0);

  const bloqueado = quantidadeTotal === 0 || carregando;

  function formatarPreco(valor: number) {
    return valor.toLocaleString("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* CABEÇALHO */}
      <h2 className="flex items-center gap-2 text-xl font-black text-[#071B2D]">
        <ShoppingBag className="text-cyan-700" size={22} />
        Resumo da compra
      </h2>

      {/* QUANTIDADE */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <span>Produtos</span>

        <span className="font-semibold text-[#071B2D]">
          {quantidadeTotal}{" "}
          {quantidadeTotal === 1 ? "unidade" : "unidades"}
        </span>
      </div>

      {/* TOTAL DOS PRODUTOS */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Total dos produtos</span>

        <span className="font-semibold text-[#071B2D]">
          {formatarPreco(totalProdutos)}
        </span>
      </div>

      {/* ENTREGA */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span className="flex items-center gap-2">
          <Truck size={16} />
          Entrega
        </span>

        <span
          className={`font-semibold ${
            entregaConfirmada ? "text-green-700" : "text-amber-600"
          }`}
        >
          {entregaConfirmada
            ? formatarPreco(custoEntrega)
            : "Por confirmar"}
        </span>
      </div>

      {/* INFORMAÇÃO SOBRE ENTREGA */}
      {!entregaConfirmada && (
        <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 p-3">
          <p className="flex items-center gap-2 text-xs font-bold text-[#071B2D]">
            <MapPin size={15} className="text-cyan-700" />
            Taxas de entrega
          </p>

          <div className="mt-2 space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Maputo</span>
              <span className="font-semibold">400,00 MT</span>
            </div>

            <div className="flex justify-between">
              <span>Matola</span>
              <span className="font-semibold">900,00 MT</span>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
            A taxa aplicável será adicionada após a seleção da zona de entrega.
          </p>
        </div>
      )}

      {/* TOTAL FINAL */}
      <div className="mt-6 border-t border-gray-200 pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-bold text-[#071B2D]">
            {entregaConfirmada ? "Total da compra" : "Subtotal"}
          </span>

          <span className="text-2xl font-black text-cyan-700">
            {formatarPreco(total)}
          </span>
        </div>

        {!entregaConfirmada && (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Este valor corresponde apenas aos produtos. A entrega será
            adicionada na finalização da encomenda.
          </p>
        )}
      </div>

      {/* FINALIZAR COMPRA */}
      <Link
        href="/finalizar-encomenda"
        aria-disabled={bloqueado}
        onClick={(event) => {
          if (bloqueado) {
            event.preventDefault();
          }
        }}
        className={`mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-bold text-white transition ${
          bloqueado
            ? "pointer-events-none cursor-not-allowed bg-gray-400"
            : "bg-cyan-700 hover:bg-cyan-800"
        }`}
      >
        {carregando ? (
          "A carregar..."
        ) : (
          <>
            Finalizar compra
            <ArrowRight size={19} />
          </>
        )}
      </Link>

      {/* CONTINUAR A COMPRAR */}
      <Link
        href="/"
        className="mt-3 flex w-full items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-cyan-600 hover:text-cyan-700"
      >
        Continuar a comprar
      </Link>

      {/* GARANTIAS */}
      <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck size={17} className="text-green-600" />
          Registo seguro da compra
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <PackageCheck size={17} className="text-green-600" />
          Disponibilidade validada antes da confirmação
        </div>
      </div>
    </aside>
  );
}
