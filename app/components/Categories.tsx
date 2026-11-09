
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  Grid3X3,
  ChevronDown,
  Cpu,
  CircuitBoard,
  Radio,
  Settings,
  Zap,
  ShieldCheck,
  Package,
  type LucideIcon,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  navOrder?: number | null;
  _count: {
    products: number;
  };
}

interface CategoriesMenuResponse {
  allCategories: Category[];
  mainCategories: Category[];
}

interface SessaoResponse {
  autenticado: boolean;
  role: "GESTOR" | null;
}

const categoryIcons: Record<string, LucideIcon> = {
  arduinos: Cpu,
  "esp32-esp8266": CircuitBoard,
  "kits-arduino": Settings,
  "sensores-input": Radio,
  "dispositivos-saida": Zap,
};

export default function CategoriesNav() {
  const [open, setOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [isGestor, setIsGestor] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Verificar se existe uma sessão válida de gestor
  useEffect(() => {
    let mounted = true;

    async function verificarGestor() {
      try {
        const response = await fetch("/api/auth/sessao", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Não foi possível verificar a sessão.");
        }

        const data: SessaoResponse = await response.json();

        if (!mounted) return;

        setIsGestor(
          data.autenticado === true &&
          data.role === "GESTOR"
        );
      } catch {
        if (mounted) {
          setIsGestor(false);
        }
      }
    }

    verificarGestor();

    const handleFocus = () => {
      verificarGestor();
    };

    const handleAuthChange = () => {
      verificarGestor();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("msw-auth-changed", handleAuthChange);

    return () => {
      mounted = false;

      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("msw-auth-changed", handleAuthChange);
    };
  }, []);

  // Carregar categorias
  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const response = await fetch("/api/categorias/menu", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Não foi possível carregar categorias.");
        }

        const data: CategoriesMenuResponse = await response.json();

        if (!mounted) return;

        setCategories(
          Array.isArray(data.allCategories)
            ? data.allCategories
            : []
        );

        setMainCategories(
          Array.isArray(data.mainCategories)
            ? data.mainCategories
            : []
        );
      } catch (error) {
        if (mounted) {
          console.error("Erro ao carregar categorias:", error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    const interval = window.setInterval(loadCategories, 30000);

    const handleFocus = () => {
      loadCategories();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;

      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <nav className="relative z-40 border-b border-gray-200 bg-white">
      <div
        ref={menuRef}
        className="relative mx-auto max-w-7xl px-5"
      >
        <div className="flex min-h-[52px] items-center gap-7">

          {/* TODAS AS CATEGORIAS */}

          <button
            type="button"
            onClick={() => setOpen((previous) => !previous)}
            aria-expanded={open}
            aria-haspopup="true"
            className="flex shrink-0 items-center gap-2 text-[15px] font-bold text-[#071B2D] transition hover:text-cyan-600"
          >
            <Grid3X3 size={20} />

            Todas as categorias

            <ChevronDown
              size={16}
              className={`transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* CATEGORIAS PRINCIPAIS */}

          <div className="hidden flex-1 items-center gap-7 overflow-x-auto whitespace-nowrap md:flex">
            {mainCategories.map((item) => {
              const Icon = categoryIcons[item.slug] || Package;

              return (
                <Link
                  key={item.id}
                  href={`/categoria/${item.slug}`}
                  className="flex items-center gap-2 text-[14px] font-medium text-gray-600 transition hover:text-cyan-600"
                >
                  <Icon size={17} />
                  {item.name}
                </Link>
              );
            })}

            {!loading && mainCategories.length === 0 && (
              <span className="text-sm text-gray-400">
                Nenhuma categoria seleccionada.
              </span>
            )}
          </div>

          {/* BOTÃO GESTOR: APENAS PARA SESSÃO GESTOR */}

          {isGestor && (
            <div className="ml-auto shrink-0">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 rounded-lg bg-[#071B2D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                <ShieldCheck size={17} />
                <span>Gestor</span>
              </Link>
            </div>
          )}
        </div>

        {/* MENU DROPDOWN */}

        {open && (
          <div
            role="menu"
            className="absolute left-0 top-full z-50 max-h-[420px] w-[280px] overflow-y-auto rounded-b-xl border border-gray-100 bg-white p-3 shadow-xl"
          >
            <h3 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              Explorar categorias
            </h3>

            {loading ? (
              <p className="px-3 py-4 text-sm text-gray-400">
                A carregar categorias...
              </p>
            ) : categories.length > 0 ? (
              categories.map((category) => {
                const Icon = categoryIcons[category.slug] || Package;

                return (
                  <Link
                    key={category.id}
                    href={`/categoria/${category.slug}`}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} />
                      {category.name}
                    </span>

                    <span className="text-xs text-gray-400">
                      {category._count.products}
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="px-3 py-4 text-sm text-gray-400">
                Nenhuma categoria disponível.
              </p>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
