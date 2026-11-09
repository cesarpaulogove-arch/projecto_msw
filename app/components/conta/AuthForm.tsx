"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type Mode = "login" | "registo";

export default function AuthForm() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    confirmarPassword: "",
  });

  function atualizarCampo(
    campo: keyof typeof form,
    valor: string
  ) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function mudarModo(novoModo: Mode) {
    setMode(novoModo);
    setErro("");
    setSucesso("");
    setMostrarPassword(false);

    setForm((anterior) => ({
      ...anterior,
      confirmarPassword: "",
    }));
  }

  async function submeter(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    // VALIDAÇÃO DA PALAVRA-PASSE

    if (
      mode === "registo" &&
      form.password !== form.confirmarPassword
    ) {
      setErro("As palavras-passe não coincidem.");
      return;
    }

    if (
      mode === "registo" &&
      form.password.length < 8
    ) {
      setErro("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "registo"
          ? "/api/auth/registo"
          : "/api/auth/login";

      // DADOS ENVIADOS PARA A API

      const dadosEnvio =
        mode === "registo"
          ? {
              nome: form.nome.trim(),
              email: form.email.trim(),
              password: form.password,
            }
          : {
              email: form.email.trim(),
              password: form.password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosEnvio),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível continuar."
        );
      }

      // REGISTO CONCLUÍDO

      if (mode === "registo") {
        setSucesso(
          "Conta criada com sucesso. Já podes iniciar sessão."
        );

        setForm({
          nome: "",
          email: form.email,
          password: "",
          confirmarPassword: "",
        });

        setMostrarPassword(false);
        setMode("login");

        return;
      }

      // LOGIN CONCLUÍDO

      window.dispatchEvent(
        new Event("msw-auth-changed")
      );

      router.replace(
        data.role === "GESTOR"
          ? "/admin/dashboard"
          : "/"
      );

      router.refresh();

    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado."
      );
    } finally {
      setLoading(false);
    }
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
            <ShieldCheck
              className="text-cyan-400"
              size={22}
            />

            Acesso protegido
          </div>

        </section>

        {/* FORMULÁRIO */}

        <section className="p-6 sm:p-10">

          {/* CABEÇALHO */}

          <div className="mb-8">

            <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">
              Minha conta
            </span>

            <h2 className="mt-2 text-2xl font-bold text-[#071B2D]">
              {mode === "login"
                ? "Bem-vindo de volta"
                : "Criar uma conta"}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {mode === "login"
                ? "Introduz os teus dados para entrar."
                : "Preenche os dados para te registares."}
            </p>

          </div>

          {/* ALTERNAR MODO */}

          <div className="mb-7 grid grid-cols-2 rounded-lg bg-gray-100 p-1">

            <button
              type="button"
              onClick={() => mudarModo("login")}
              className={`rounded-md py-2.5 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-[#071B2D] shadow"
                  : "text-gray-500"
              }`}
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => mudarModo("registo")}
              className={`rounded-md py-2.5 text-sm font-semibold transition ${
                mode === "registo"
                  ? "bg-white text-[#071B2D] shadow"
                  : "text-gray-500"
              }`}
            >
              Registar
            </button>

          </div>

          {/* FORMULÁRIO DE AUTENTICAÇÃO */}

          <form
            onSubmit={submeter}
            className="space-y-5"
          >

            {/* NOME */}

            {mode === "registo" && (
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Nome completo
                </label>

                <div className="relative">

                  <User
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    value={form.nome}
                    onChange={(e) =>
                      atualizarCampo("nome", e.target.value)
                    }
                    placeholder="O teu nome"
                    className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-600"
                  />

                </div>

              </div>
            )}

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>

              <div className="relative">

                <Mail
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) =>
                    atualizarCampo("email", e.target.value)
                  }
                  placeholder="exemplo@gmail.com"
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
                  type={mostrarPassword ? "text" : "password"}
                  minLength={8}
                  maxLength={128}
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  value={form.password}
                  onChange={(e) =>
                    atualizarCampo("password", e.target.value)
                  }
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-cyan-600"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(!mostrarPassword)
                  }
                  aria-label={
                    mostrarPassword
                      ? "Ocultar palavra-passe"
                      : "Mostrar palavra-passe"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {mostrarPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* CONFIRMAR PALAVRA-PASSE */}

            {mode === "registo" ? (

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Confirmar palavra-passe
                </label>

                <div className="relative">

                  <Lock
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    required
                    type={mostrarPassword ? "text" : "password"}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={form.confirmarPassword}
                    onChange={(e) =>
                      atualizarCampo(
                        "confirmarPassword",
                        e.target.value
                      )
                    }
                    placeholder="Confirma a tua palavra-passe"
                    className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-cyan-600"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarPassword(!mostrarPassword)
                    }
                    aria-label={
                      mostrarPassword
                        ? "Ocultar confirmação"
                        : "Mostrar confirmação"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {mostrarPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

                {/* INDICAÇÃO DE CORRESPONDÊNCIA */}

                {form.confirmarPassword.length > 0 && (
                  <p
                    className={`mt-2 text-xs ${
                      form.password === form.confirmarPassword
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {form.password === form.confirmarPassword
                      ? "As palavras-passe coincidem."
                      : "As palavras-passe não coincidem."}
                  </p>
                )}

              </div>

            ) : null}

            {/* ERRO */}

            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {/* SUCESSO */}

            {sucesso && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {sucesso}
              </div>
            )}

            {/* BOTÃO SUBMETER */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#071B2D] py-3.5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  A processar...
                </>
              ) : (
                <>
                  {mode === "login"
                    ? "Entrar na conta"
                    : "Criar conta"}

                  <ArrowRight size={18} />
                </>
              )}

            </button>

          </form>

          {/* RODAPÉ */}

          <p className="mt-7 text-center text-xs text-gray-400">
            Ao continuar, concordas com as condições de utilização da MSW TECH.
          </p>

        </section>

      </div>

    </main>
  );
}