
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Warehouse,
  Tag,
  Settings,
  Store,
  ChevronLeft,
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

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-[#071B2D] text-white">

      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 font-black text-[#071B2D]">
          MSW
        </div>

        <div>
          <h2 className="font-black tracking-wide">MSW TECH</h2>
          <p className="text-xs text-cyan-400">Painel administrativo</p>
        </div>
      </div>

      <div className="px-5 pt-7 pb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Menu principal
      </div>

      <nav className="flex-1 space-y-2 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                active
                  ? "bg-cyan-500 text-[#071B2D] font-bold"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-300 hover:bg-white/10"
        >
          <Store size={18} />
          Voltar à loja
        </Link>

        <Link
          href="/admin/dashboard/definicoes"
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-300 hover:bg-white/10"
        >
          <Settings size={18} />
          Definições
        </Link>
      </div>

    </aside>
  );
}
