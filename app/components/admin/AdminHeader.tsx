
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Store,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Visão geral",
  "/admin/dashboard/produtos": "Gestão de produtos",
  "/admin/dashboard/produtos/novo": "Adicionar produto",
  "/admin/dashboard/categorias": "Gestão de categorias",
  "/admin/dashboard/stock": "Controlo de stock",
  "/admin/dashboard/promocoes": "Gestão de promoções",
  "/admin/dashboard/definicoes": "Definições",
  "/admin/dashboard/encomendas": "Gestão de encomendas",
  "/admin/dashboard/clientes": "Gestão de clientes",
};

function formatarData() {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  }).format(new Date());
}

export default function AdminHeader() {
  const pathname = usePathname();

  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const atualizarData = () => {
      setCurrentDate(formatarData());
    };

    atualizarData();

    const intervalo = window.setInterval(
      atualizarData,
      60 * 1000
    );

    return () => window.clearInterval(intervalo);
  }, []);

  const title =
    pageTitles[pathname] ||
    (pathname.includes("/editar")
      ? pathname.includes("/produtos/")
        ? "Editar produto"
        : pathname.includes("/categorias/")
          ? "Editar categoria"
          : pathname.includes("/encomendas/")
            ? "Detalhes da encomenda"
            : "Editar registo"
      : pathname.includes("/encomendas/")
        ? "Detalhes da encomenda"
        : "Painel administrativo");

  return (
    <header className="sticky top-0 z-30 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4 md:px-8">

      {/* IDENTIFICAÇÃO DA PÁGINA */}

      <div>
        <h1 className="text-xl font-bold text-[#071B2D]">
          {title}
        </h1>

        <p className="mt-1 text-xs text-gray-500">
          MSW TECH / Administração
        </p>
      </div>

      {/* INFORMAÇÕES E NAVEGAÇÃO */}

      <div className="flex items-center gap-4">

        {/* DATA */}

        <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
          <CalendarDays size={17} />

          <span>
            {currentDate || "A carregar data..."}
          </span>
        </div>

        {/* ESTADO ADMINISTRATIVO */}

        <div className="hidden items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 sm:flex">
          <ShieldCheck size={16} />

          Área administrativa
        </div>

        {/* VOLTAR À LOJA */}

        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-[#071B2D] transition hover:bg-gray-100"
        >
          <Store size={17} />

          <span className="hidden sm:inline">
            Visitar loja
          </span>
        </Link>

      </div>
    </header>
  );
}
