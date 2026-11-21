
"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Cpu,
  Lightbulb,
  GraduationCap,
  HousePlug,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function CompletarRegistoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function obterDestinoAposRegisto() {
    const redirect = searchParams.get("redirect");

    if (!redirect) return "/";

    try {
      const destino = new URL(redirect, window.location.origin);

      if (destino.origin !== window.location.origin) {
        return "/";
      }

      return `${destino.pathname}${destino.search}${destino.hash}`;
    } catch {
      return "/";
    }
  }

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.replace(/[\s()-]/g, "");

    if (nomeLimpo.length < 2) {
      setErro("Introduz o teu nome completo.");
      return;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(telefoneLimpo)) {
      setErro(
        "Introduz um telefone válido com indicativo internacional. Exemplo: +258841234567."
      );
      return;
    }

    if (password.length < 8) {
      setErro("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmarPassword) {
      setErro("As palavras-passe não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/registo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          nome: nomeLimpo,
          telefone: telefoneLimpo,
          password,
          confirmarPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErro(
          response.status === 401
            ? "A autorização do Google expirou. Volta ao login e inicia novamente com o Google."
            : data.error ||
                data.message ||
                "Não foi possível concluir o registo. Tenta novamente."
        );
        return;
      }

      window.dispatchEvent(new Event("msw-auth-changed"));

      const destino = obterDestinoAposRegisto();

      router.replace(destino);
      router.refresh();
    } catch (error) {
      console.error("Erro ao concluir registo:", error);
      setErro(
        "Erro de ligação. Verifica a tua internet e tenta novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-2">

      {/* LADO ESQUERDO — MSW BUSINESS */}
      <section className="relative flex min-h-[500px] flex-col justify-between overflow-hidden bg-[#071B35] px-7 py-10 text-white sm:px-12 lg:min-h-screen lg:px-16 lg:py-14">

        {/* Elementos decorativos */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-blue-400/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10">

          {/* Identidade da empresa */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <BriefcaseBusiness size={25} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold tracking-wide">
                MSW <span className="text-blue-400">BUSINESS</span>
              </h2>
              <p className="text-xs tracking-widest text-slate-400">
                TECNOLOGIA E INOVAÇÃO
              </p>
            </div>
          </div>

          {/* Apresentação */}
          <div className="mt-12 max-w-xl lg:mt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-semibold text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              BEM-VINDO À MSW BUSINESS
            </span>

            <h1 className="mt-7 text-4xl font-bold leading-tight sm:text-5xl">
              Tecnologia que transforma
              <span className="text-blue-400">
                {" "}ideias em soluções.
              </span>
            </h1>

            <p className="mt-5 text-base leading-7 text-slate-300">
              Somos uma empresa dedicada a fornecer produtos, conhecimentos
              e soluções tecnológicas para impulsionar projectos, empresas
              e residências.
            </p>
          </div>

          {/* Áreas de actuação */}
          <div className="mt-10">
            <h3 className="mb-5 text-sm font-bold uppercase tracking-widest text-blue-300">
              As nossas áreas de actuação
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <Cpu size={25} className="mb-3 text-blue-400" />
                <h4 className="font-semibold text-white">
                  Componentes electrónicos
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Venda de componentes e equipamentos electrónicos para
                  projectos e aplicações tecnológicas.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <Lightbulb size={25} className="mb-3 text-blue-400" />
                <h4 className="font-semibold text-white">
                  Desenvolvimento de protótipos
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Concepção e desenvolvimento de protótipos e projectos
                  tecnológicos personalizados.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <GraduationCap size={25} className="mb-3 text-blue-400" />
                <h4 className="font-semibold text-white">
                  Formação tecnológica
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Formação e capacitação nas áreas da electrónica e tecnologia.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <HousePlug size={25} className="mb-3 text-blue-400" />
                <h4 className="font-semibold text-white">
                  Instalação de soluções
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Instalação de soluções tecnológicas para empresas e residências.
                </p>
              </div>

            </div>
          </div>

          <div className="mt-8 border-l-2 border-blue-500 pl-4">
            <p className="text-sm italic leading-6 text-slate-300">
              Transformamos necessidades em soluções através da tecnologia,
              inovação e conhecimento.
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="relative z-10 mt-12 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-xs text-slate-500">
            © 2026 MSW BUSINESS. Todos os direitos reservados.
          </p>
          <span className="text-xs font-semibold tracking-wider text-blue-400">
            MSW TECH
          </span>
        </div>
      </section>

      {/* LADO DIREITO — FORMULÁRIO */}
      <section className="flex min-h-screen items-center justify-center bg-white px-5 py-12 sm:px-10 lg:px-12">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck size={30} />
            </div>

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Quase terminado
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Completar registo
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Preenche os teus dados para terminares a criação da tua conta
              MSW TECH.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label
                htmlFor="nome"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nome completo
              </label>

              <input
                id="nome"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="O teu nome completo"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="telefone"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Número de telemóvel
              </label>

              <input
                id="telefone"
                type="tel"
                autoComplete="tel"
                required
                value={telefone}
                onChange={(event) => setTelefone(event.target.value)}
                placeholder="+258841234567"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-2 text-xs text-slate-400">
                Inclui o indicativo internacional. Exemplo: +258.
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Palavra-passe
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  aria-label={
                    mostrarPassword
                      ? "Ocultar palavra-passe"
                      : "Mostrar palavra-passe"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {mostrarPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmarPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirmar palavra-passe
              </label>

              <div className="relative">
                <input
                  id="confirmarPassword"
                  type={mostrarConfirmacao ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmarPassword}
                  onChange={(event) =>
                    setConfirmarPassword(event.target.value)
                  }
                  placeholder="Repete a palavra-passe"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarConfirmacao(!mostrarConfirmacao)
                  }
                  aria-label={
                    mostrarConfirmacao
                      ? "Ocultar confirmação"
                      : "Mostrar confirmação"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {mostrarConfirmacao ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  A criar a tua conta...
                </>
              ) : (
                <>
                  Concluir registo
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <CheckCircle2
              className="mt-0.5 shrink-0 text-green-600"
              size={19}
            />
            <p className="text-xs leading-5 text-slate-500">
              O teu email foi autenticado pelo Google. Os teus dados serão
              utilizados para criar a tua conta.
            </p>
          </div>

          <p className="mt-7 text-center text-sm text-slate-500">
            Já tens uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
