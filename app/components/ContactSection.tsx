
"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Send,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  CheckCircle2,
  Loader2,
  LockKeyhole,
} from "lucide-react";

const initialForm = {
  subject: "",
  message: "",
};

export default function ContactSection() {
  const [form, setForm] = useState(initialForm);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Verificar se o cliente iniciou sessão
  useEffect(() => {
    let cancelled = false;

    async function verificarSessao() {
      try {
        const response = await fetch("/api/contactos", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!cancelled) {
          setAuthenticated(response.ok);
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    verificarSessao();

    return () => {
      cancelled = true;
    };
  }, []);

  // Iniciar sessão e regressar à secção de contactos
  function handleLogin() {
    const destino = "/#contactos";

    window.location.href =
      "/minha-conta?redirect=" + encodeURIComponent(destino);
  }

  // Enviar mensagem
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    if (!authenticated) {
      setError("Inicie sessão antes de enviar a sua mensagem.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/contactos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subject: form.subject,
          message: form.message,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setAuthenticated(false);
        throw new Error(
          "A sua sessão terminou. Inicie sessão novamente para enviar a mensagem."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível enviar a mensagem."
        );
      }

      setSuccess(
        "Mensagem enviada com sucesso! Entraremos em contacto consigo."
      );

      setForm(initialForm);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao enviar a mensagem."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="contactos"
      className="scroll-mt-32 bg-gray-50 py-20"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Cabeçalho */}
        <div className="mb-12 text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-cyan-600">
            Estamos disponíveis
          </span>

          <h2 className="mt-3 text-3xl font-black text-[#071B2D] md:text-4xl">
            Fale connosco
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-500">
            Precisa de informações sobre produtos, componentes electrónicos,
            encomendas ou assistência técnica? Envie-nos uma mensagem.
          </p>
        </div>

        <div className="grid gap-10 overflow-hidden rounded-2xl bg-white shadow-sm md:grid-cols-5">

          {/* Informações */}
          <div className="bg-[#071B2D] p-8 text-white md:col-span-2 md:p-10">
            <h3 className="text-2xl font-bold">
              MSW <span className="text-cyan-400">BUSINESS</span>
            </h3>

            <p className="mt-4 text-sm leading-7 text-gray-300">
              Tecnologia, componentes e soluções electrónicas.
              Estamos disponíveis para ajudar nos seus projectos.
            </p>

            <div className="mt-10 space-y-7">

              <div className="flex items-center gap-4">
                <Mail className="text-cyan-400" size={22} />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm">Contacto por definir</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Phone className="text-cyan-400" size={22} />
                <div>
                  <p className="text-xs text-gray-400">Telefone</p>
                  <p className="text-sm">Contacto por definir</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <MapPin className="text-cyan-400" size={22} />
                <div>
                  <p className="text-xs text-gray-400">Localização</p>
                  <p className="text-sm">Moçambique</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <MessageSquare className="text-cyan-400" size={22} />
                <div>
                  <p className="text-xs text-gray-400">Atendimento</p>
                  <p className="text-sm">Envie-nos uma mensagem</p>
                </div>
              </div>

            </div>
          </div>

          {/* Formulário */}
          <div className="p-8 md:col-span-3 md:p-10">

            <h3 className="mb-7 text-xl font-bold text-[#071B2D]">
              Enviar mensagem
            </h3>

            {/* A verificar sessão */}
            {checkingSession ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2
                  size={32}
                  className="animate-spin text-cyan-600"
                />
                <p className="mt-4 text-sm text-gray-500">
                  A verificar a sua sessão...
                </p>
              </div>
            ) : !authenticated ? (

              /* Cliente sem sessão */
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100">
                  <LockKeyhole
                    size={26}
                    className="text-cyan-700"
                  />
                </div>

                <h4 className="mt-5 text-lg font-bold text-[#071B2D]">
                  Inicie sessão para continuar
                </h4>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
                  Para enviar uma mensagem à MSW BUSINESS,
                  precisa primeiro de iniciar sessão na sua conta.
                  Os seus dados de contacto serão preenchidos
                  automaticamente através da sua conta.
                </p>

                <button
                  type="button"
                  onClick={handleLogin}
                  className="mt-7 inline-flex items-center justify-center gap-3 rounded-lg bg-[#071B2D] px-7 py-4 text-sm font-bold text-white transition hover:bg-cyan-700"
                >
                  <LockKeyhole size={18} />
                  Iniciar sessão
                </button>

                {error && (
                  <p className="mt-4 text-sm text-red-600">
                    {error}
                  </p>
                )}

              </div>

            ) : (

              /* Cliente autenticado */
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-cyan-800">
                    <CheckCircle2 size={18} />
                    Sessão iniciada
                  </div>

                  <p className="mt-1 text-xs leading-5 text-cyan-700">
                    Os seus dados pessoais serão associados
                    automaticamente à mensagem.
                  </p>
                </div>

                {/* Assunto */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Assunto *
                  </label>

                  <select
                    required
                    value={form.subject}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        subject: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500"
                  >
                    <option value="">
                      Seleccione o assunto
                    </option>

                    <option value="Informações sobre produtos">
                      Informações sobre produtos
                    </option>

                    <option value="Encomendas">
                      Encomendas
                    </option>

                    <option value="Assistência técnica">
                      Assistência técnica
                    </option>

                    <option value="Projectos">
                      Projectos
                    </option>

                    <option value="Parcerias">
                      Parcerias
                    </option>

                    <option value="Outros">
                      Outros
                    </option>
                  </select>
                </div>

                {/* Mensagem */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Mensagem *
                  </label>

                  <textarea
                    required
                    minLength={10}
                    maxLength={3000}
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        message: e.target.value,
                      })
                    }
                    placeholder="Escreva a sua mensagem..."
                    className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />

                  <p className="mt-1 text-right text-xs text-gray-400">
                    {form.message.length}/3000
                  </p>
                </div>

                {/* Sucesso */}
                {success && (
                  <div className="flex items-start gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                    <CheckCircle2
                      size={20}
                      className="shrink-0"
                    />
                    {success}
                  </div>
                )}

                {/* Erro */}
                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    {error}

                    {!authenticated && (
                      <button
                        type="button"
                        onClick={handleLogin}
                        className="ml-1 font-bold underline"
                      >
                        Iniciar sessão
                      </button>
                    )}
                  </div>
                )}

                {/* Botão enviar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#071B2D] px-6 py-4 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      A enviar...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar mensagem
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
