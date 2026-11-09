
"use client";

import { FormEvent, useState } from "react";
import {
  Send,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactSection() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/contactos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível enviar a mensagem.");
      }

      setSuccess("Mensagem enviada com sucesso! Entraremos em contacto consigo.");
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
    <section id="contactos" className="scroll-mt-32 bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">

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

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nome completo *
                  </label>
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="O seu nome"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    maxLength={254}
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="seu@email.com"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  type="tel"
                  maxLength={30}
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="+258 8X XXX XXXX"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Assunto *
                </label>
                <select
                  required
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="">Seleccione o assunto</option>
                  <option value="Informações sobre produtos">
                    Informações sobre produtos
                  </option>
                  <option value="Encomendas">Encomendas</option>
                  <option value="Assistência técnica">Assistência técnica</option>
                  <option value="Projectos">Projectos</option>
                  <option value="Parcerias">Parcerias</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

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
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="Escreva a sua mensagem..."
                  className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.message.length}/3000
                </p>
              </div>

              {success && (
                <div className="flex items-start gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                  <CheckCircle2 size={20} className="shrink-0" />
                  {success}
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#071B2D] px-6 py-4 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
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
          </div>
        </div>
      </div>
    </section>
  );
}
