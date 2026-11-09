
"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ShoppingCart,
  UserRound,
  Menu,
  Cpu,
  X,
} from "lucide-react";
import Link from "next/link";

import { useCarrinho } from "@/app/components/carrinho/CartProvider";

export default function Header() {
  const [search, setSearch] = useState("");
  const [montado, setMontado] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const { quantidadeTotal } = useCarrinho();

  useEffect(() => {
    setMontado(true);
  }, []);

  function handleSearch() {
    const termo = search.trim();

    if (!termo) return;

    window.location.href = `/?pesquisa=${encodeURIComponent(termo)}`;
  }

  const quantidadeVisivel = montado ? quantidadeTotal : 0;

  return (
    <header className="bg-white text-[#071B2D]">
      <div className="mx-auto max-w-7xl px-5 py-3">
        <div className="flex items-center justify-between gap-5">

          {/* LOGÓTIPO */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Cpu size={34} className="text-cyan-500" />

            <div>
              <h1 className="text-2xl font-black tracking-wide">
                MSW <span className="text-cyan-500">BUSINESS</span>
              </h1>

              <p className="text-[9px] tracking-[3px] text-gray-500">
                ELECTRONICS STORE
              </p>
            </div>
          </Link>

          {/* PESQUISA DESKTOP */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="hidden max-w-xl flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition focus-within:border-cyan-500 md:flex"
          >
            <input
              type="search"
              placeholder="Pesquisar por nome ou código (ex.: ESP32, LM7805)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none"
            />

            <button
              type="submit"
              className="bg-cyan-500 px-5 text-white transition hover:bg-cyan-600"
              aria-label="Pesquisar componentes"
            >
              <Search size={21} />
            </button>
          </form>

          {/* ACÇÕES */}
          <div className="flex items-center gap-5">

            {/* CARRINHO */}
            <Link
              href="/carrinho"
              className="relative flex items-center gap-2 text-[#071B2D] transition hover:text-cyan-600"
              aria-label={`Carrinho de compras: ${quantidadeVisivel} produtos`}
            >
              <ShoppingCart size={25} />

              <span className="hidden text-sm font-medium lg:inline">
                Carrinho
              </span>

              {quantidadeVisivel > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-white">
                  {quantidadeVisivel > 99 ? "99+" : quantidadeVisivel}
                </span>
              )}
            </Link>

            {/* CONTA */}
            <Link
              href="/minha-conta"
              className="hidden items-center gap-2 text-[#071B2D] transition hover:text-cyan-600 sm:flex"
            >
              <UserRound size={23} />

              <span className="text-sm font-medium">
                Minha conta
              </span>
            </Link>

            {/* MENU MOBILE */}
            <button
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              className="text-[#071B2D] md:hidden"
              aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuAberto}
            >
              {menuAberto ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* PESQUISA MOBILE */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="mt-3 flex overflow-hidden rounded-lg border border-gray-200 bg-gray-100 md:hidden"
        >
          <input
            type="search"
            placeholder="Pesquisar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none"
          />

          <button
            type="submit"
            className="bg-cyan-500 px-4 text-white transition hover:bg-cyan-600"
            aria-label="Pesquisar componentes"
          >
            <Search size={19} />
          </button>
        </form>

        {/* MENU MOBILE */}
        {menuAberto && (
          <nav className="mt-3 space-y-1 border-t border-gray-100 pt-3 md:hidden">
            <Link
              href="/"
              onClick={() => setMenuAberto(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Início
            </Link>

            <Link
              href="/carrinho"
              onClick={() => setMenuAberto(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Carrinho
            </Link>

            <Link
              href="/minha-conta"
              onClick={() => setMenuAberto(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Minha conta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
