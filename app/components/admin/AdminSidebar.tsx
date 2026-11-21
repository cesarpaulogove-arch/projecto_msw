
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  LayoutDashboard,
  Package,
  Layers,
  Warehouse,
  Tag,
  Settings,
  Store,
  Menu,
  X,
} from "lucide-react";

const menuItems = [
  {
    name: "Visão geral",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Produtos",
    href: "/admin/dashboard/produtos",
    icon: Package,
  },
  {
    name: "Categorias",
    href: "/admin/dashboard/categorias",
    icon: Layers,
  },
  {
    name: "Stock",
    href: "/admin/dashboard/stock",
    icon: Warehouse,
  },
  {
    name: "Promoções",
    href: "/admin/dashboard/promocoes",
    icon: Tag,
  },
];

interface ConteudoMenuProps {
  pathname: string;
  mobile?: boolean;
  onClose?: () => void;
}

function verificarActivo(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/admin/dashboard" &&
      pathname.startsWith(href + "/"))
  );
}

// COMPONENTE DO CONTEÚDO DO MENU
function ConteudoMenu({
  pathname,
  mobile = false,
  onClose,
}: ConteudoMenuProps) {
  return (
    <>
      {/* IDENTIFICAÇÃO */}
      <div className="flex h-20 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500 font-black text-[#071B2D]">
            MSW
          </div>

          <div>
            <h2 className="font-black tracking-wide">
              MSW TECH
            </h2>

            <p className="text-xs text-cyan-400">
              Painel administrativo
            </p>
          </div>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <X size={21} />
          </button>
        )}
      </div>

      {/* MENU PRINCIPAL */}
      <div className="px-5 pb-3 pt-7 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Menu principal
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = verificarActivo(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                active
                  ? "bg-cyan-500 font-bold text-[#071B2D]"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} className="shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* MENU INFERIOR */}
      <div className="shrink-0 space-y-2 border-t border-white/10 p-4">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          <Store size={18} />
          Voltar à loja
        </Link>

        <Link
          href="/admin/dashboard/definicoes"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
            verificarActivo(
              pathname,
              "/admin/dashboard/definicoes"
            )
              ? "bg-cyan-500 font-bold text-[#071B2D]"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Settings size={18} />
          Definições
        </Link>
      </div>
    </>
  );
}

// COMPONENTE PRINCIPAL
export default function AdminSidebar() {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <>
      {/* BOTÃO DE ABRIR MENU - TELEMÓVEL */}
      <button
        type="button"
        onClick={() => setMenuAberto(true)}
        aria-label="Abrir menu de navegação"
        aria-expanded={menuAberto}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[#071B2D] text-white shadow-md transition hover:bg-[#0b2942] md:hidden"
      >
        <Menu size={22} />
      </button>

      {/* FUNDO ESCURO */}
      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu de navegação"
          onClick={fecharMenu}
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
        />
      )}

      {/* MENU LATERAL - TELEMÓVEL */}
      <aside
        className={`fixed left-0 top-0 z-[60] flex h-[100dvh] w-[280px] max-w-[85vw] flex-col bg-[#071B2D] text-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          menuAberto
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
        aria-hidden={!menuAberto}
      >
        <ConteudoMenu
          pathname={pathname}
          mobile={true}
          onClose={fecharMenu}
        />
      </aside>

      {/* MENU LATERAL - COMPUTADOR */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-[#071B2D] text-white md:flex">
        <ConteudoMenu pathname={pathname} />
      </aside>
    </>
  );
}
