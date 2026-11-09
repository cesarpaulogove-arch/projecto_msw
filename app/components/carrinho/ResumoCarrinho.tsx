
"use client";

import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  PackageCheck,
} from "lucide-react";

interface ResumoCarrinhoProps {
  quantidadeTotal: number;
  subtotal: number;
  custoEntrega?: number;
  carregando?: boolean;
}

export default function ResumoCarrinho({
  quantidadeTotal,
  subtotal,
  custoEntrega,
  carregando = false,
}: ResumoCarrinhoProps) {
  const entregaConfirmada = custoEntrega !== undefined;
  const total = subtotal + (custoEntrega ?? 0);
  const bloqueado = quantidadeTotal === 0 || carregando;

  function formatarPreco(valor: number) {
    return valor.toLocaleString("pt-MZ", {
      style: "currency",
      currency: "MZN",
    });
  }

  return (
    <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-black text-[#071B2D]">
        <ShoppingBag className="text-cyan-700" size={22} />
        Resumo do carrinho
      </h2>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <span>Produtos</span>
        <span className="font-semibold text-[#071B2D]">
          {quantidadeTotal}{" "}
          {quantidadeTotal === 1 ? "unidade" : "unidades"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span className="font-semibold text-[#071B2D]">
          {formatarPreco(subtotal)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span className="flex items-center gap-2">
          <Truck size={16} />
          Entrega
        </span>

        <span className="font-semibold text-amber-600">
          {entregaConfirmada
            ? formatarPreco(custoEntrega)
            : "A confirmar"}
        </span>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-5">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-[#071B2D]">
            {entregaConfirmada ? "Total" : "Subtotal"}
          </span>

          <span className="text-2xl font-black text-cyan-700">
            {formatarPreco(total)}
          </span>
        </div>

        {!entregaConfirmada && (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            O valor apresentado não inclui a entrega. O custo será
            confirmado pela equipa MSW BUSINESS.
          </p>
        )}
      </div>

      <Link
        href="/finalizar-encomenda"
        aria-disabled={bloqueado}
        onClick={(event) => {
          if (bloqueado) event.preventDefault();
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
            Finalizar encomenda
            <ArrowRight size={19} />
          </>
        )}
      </Link>

      <Link
        href="/"
        className="mt-3 flex w-full items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-cyan-600 hover:text-cyan-700"
      >
        Continuar a comprar
      </Link>

      <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck size={17} className="text-green-600" />
          Registo seguro da encomenda
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <PackageCheck size={17} className="text-green-600" />
          Disponibilidade validada antes da confirmação
        </div>
      </div>
    </aside>
  );
}
