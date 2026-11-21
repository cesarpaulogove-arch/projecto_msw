
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type AuthResponse = {
  success?: boolean;
  role?: "CLIENTE" | "GESTOR";
  error?: string;
  message?: string;
};

export default function AuthForm() {
  const router = useRouter();

  function obterDestinoAposLogin() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  if (!redirect) return "/";

  try {
    const destino = new URL(redirect, window.location.origin);

    // Impede redireccionamentos para sites externos.
    if (destino.origin !== window.location.origin) {
      return "/";
    }

    return `${destino.pathname}${destino.search}${destino.hash}`;
  } catch {
    return "/";
  }
}

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    identificador: "",
    senha: "",
  });

  function atualizarCampo(campo: keyof typeof form, valor: string) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function normalizarTelefone(valor: string) {
    return valor.replace(/[\s()-]/g, "");
  }

  function identificadorEhEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
  }

  async function submeter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    const identificador = form.identificador.trim();
    const senha = form.senha;

    if (!identificador) {
      setErro("Introduz o teu email ou número de telemóvel.");
      return;
    }

    if (!senha) {
      setErro("Introduz a tua palavra-passe.");
      return;
    }

    let dadosEnvio: {
      email?: string;
      telefone?: string;
      password: string;
    };

    if (identificadorEhEmail(identificador)) {
      dadosEnvio = {
        email: identificador.toLowerCase(),
        password: senha,
      };
    } else {
      const telefone = normalizarTelefone(identificador);

      if (!/^\+[1-9]\d{7,14}$/.test(telefone)) {
        setErro(
          "Introduz um email válido ou um número de telemóvel com indicativo internacional. Exemplo: +258841234567."
        );
        return;
      }

      dadosEnvio = {
        telefone,
        password: senha,
      };
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosEnvio),
      });

      let data: AuthResponse;

      try {
        data = await response.json();
      } catch {
        throw new Error("Resposta inválida do servidor.");
      }

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Não foi possível iniciar sessão."
        );
      }

      if (data.role !== "GESTOR" && data.role !== "CLIENTE") {
        throw new Error("O servidor devolveu um tipo de conta inválido.");
      }

      window.dispatchEvent(new Event("msw-auth-changed"));

     const destino =
      data.role === "GESTOR"
        ? "/admin/dashboard"
        : obterDestinoAposLogin();

    router.replace(destino);
    router.refresh();

      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar sessão."
      );
    } finally {
      setLoading(false);
    }
  }

 function entrarComGoogle() {
  const destino = obterDestinoAposLogin();

  window.location.href = `/api/auth/google?redirect=${encodeURIComponent(destino)}`;
}
  return (
    <main className="flex min-h-[calc(100vh-100px)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">

        {/* PAINEL INFORMATIVO */}

        <section className="hidden flex-col justify-between bg-[#071B2D] p-10 text-white md:flex">
          <div>
            <Link
              href="/"
              className="text-2xl font-black tracking-wide"
            >
              MSW <span className="text-cyan-400">TECH</span>
            </Link>

            <div className="mt-20">
              <h1 className="text-3xl font-bold leading-tight">
                Tecnologia e componentes para os teus projectos.
              </h1>

              <p className="mt-5 text-sm leading-7 text-gray-300">
                Acede à tua conta para acompanhares as tuas compras,
                pedidos e informações.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-300">
            <ShieldCheck className="text-cyan-400" size={22} />
            Acesso protegido
          </div>
        </section>

        {/* FORMULÁRIO */}

        <section className="p-6 sm:p-10">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">
              Minha conta
            </span>

            <h2 className="mt-2 text-2xl font-bold text-[#071B2D]">
              Bem-vindo de volta
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Entra com o teu email ou número de telemóvel e palavra-passe.
            </p>
          </div>

          <form onSubmit={submeter} className="space-y-5">

            {/* EMAIL OU TELEFONE */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email ou número de telemóvel
              </label>

              <div className="relative">
                <User
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  required
                  type="text"
                  autoComplete="username"
                  value={form.identificador}
                  onChange={(e) =>
                    atualizarCampo("identificador", e.target.value)
                  }
                  placeholder="Email ou +258841234567"
                  className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-600"
                />
              </div>
            </div>

            {/* PALAVRA-PASSE */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Palavra-passe
              </label>

              <div className="relative">
                <Lock
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  required
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={128}
                  value={form.senha}
                  onChange={(e) =>
                    atualizarCampo("senha", e.target.value)
                  }
                  placeholder="Introduz a tua palavra-passe"
                  className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-cyan-600"
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={
                    mostrarSenha ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {mostrarSenha ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* ERRO */}

            {erro && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {erro}
              </div>
            )}

            {/* ENTRAR */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#071B2D] py-3.5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  A iniciar sessão...
                </>
              ) : (
                <>
                  Entrar na conta
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* GOOGLE */}

          <div className="mt-7">
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">
                  OU
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={entrarComGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <span className="text-lg font-bold">G</span>
              Continuar com Google
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-gray-500">
              Primeira vez na MSW TECH? Continua com Google
              para criares a tua conta.
            </p>
          </div>

          <p className="mt-7 text-center text-xs text-gray-400">
            Ao continuar, concordas com as condições de utilização da MSW TECH.
          </p>
        </section>
      </div>
    </main>
  );
}
