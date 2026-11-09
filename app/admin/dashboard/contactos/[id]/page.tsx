
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  MessageSquare,
  Save,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const estados = [
  { value: "NOVA", label: "Nova" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "RESPONDIDA", label: "Respondida" },
  { value: "ARQUIVADA", label: "Arquivada" },
] as const;

const estadoLabel: Record<string, string> = {
  NOVA: "Nova",
  EM_ANALISE: "Em análise",
  RESPONDIDA: "Respondida",
  ARQUIVADA: "Arquivada",
};

export default function ContactoDetailsPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-gray-500">
            A carregar detalhes da mensagem...
          </p>
        </div>
      }
    >
      <ContactoDetails params={params} />
    </Suspense>
  );
}

async function ContactoDetails({ params }: Props) {
  const { id } = await params;

  const contacto = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!contacto) {
    notFound();
  }

  async function guardarContacto(formData: FormData) {
    "use server";

    const response = String(formData.get("response") || "").trim();
    const status = String(formData.get("status") || "");

    const statusValido = estados.some(
      (estado) => estado.value === status
    );

    if (!statusValido) {
      throw new Error("Estado inválido.");
    }

    if (response.length > 3000) {
      throw new Error("A resposta não pode ultrapassar 3000 caracteres.");
    }

    if (status === "RESPONDIDA" && !response) {
      throw new Error(
        "Escreva uma resposta antes de marcar como respondida."
      );
    }

    await prisma.contactMessage.update({
      where: { id },
      data: {
        response: response || null,
        status: status as
          | "NOVA"
          | "EM_ANALISE"
          | "RESPONDIDA"
          | "ARQUIVADA",
      },
    });

    redirect(`/admin/dashboard/contactos/${id}`);
  }

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-MZ", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Maputo",
    }).format(date);

  return (
    <div className="mx-auto max-w-5xl space-y-7 p-4 md:p-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/dashboard/contactos"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-700"
          >
            <ArrowLeft size={17} />
            Voltar aos contactos
          </Link>

          <h1 className="text-2xl font-black text-gray-800">
            Detalhes da mensagem
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gestão do atendimento da MSW BUSINESS.
          </p>
        </div>

        <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
          {estadoLabel[contacto.status]}
        </span>
      </div>

      {/* Dados do remetente */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 font-bold text-gray-800">
          Dados do remetente
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <User className="text-cyan-600" size={20} />
            <div>
              <p className="text-xs text-gray-400">Nome</p>
              <p className="font-semibold text-gray-800">
                {contacto.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="text-cyan-600" size={20} />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <a
                href={`mailto:${contacto.email}`}
                className="font-semibold text-gray-800 hover:text-cyan-700"
              >
                {contacto.email}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="text-cyan-600" size={20} />
            <div>
              <p className="text-xs text-gray-400">Telefone</p>
              <p className="font-semibold text-gray-800">
                {contacto.phone || "Não informado"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="text-cyan-600" size={20} />
            <div>
              <p className="text-xs text-gray-400">Data de recepção</p>
              <p className="font-semibold text-gray-800">
                {formatDate(contacto.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem recebida */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <MessageSquare className="text-cyan-600" size={21} />
          <h2 className="font-bold text-gray-800">
            Mensagem recebida
          </h2>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-400">Assunto</p>
          <p className="mt-1 font-semibold text-gray-800">
            {contacto.subject}
          </p>
        </div>

        <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-5 text-sm leading-7 text-gray-700">
          {contacto.message}
        </div>
      </div>

      {/* Resposta administrativa */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-bold text-gray-800">
          Gestão e resposta
        </h2>

        <form action={guardarContacto} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Estado do atendimento
            </label>

            <select
              name="status"
              defaultValue={contacto.status}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500"
            >
              {estados.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Resposta ao cliente
            </label>

            <textarea
              name="response"
              rows={6}
              maxLength={3000}
              defaultValue={contacto.response || ""}
              placeholder="Escreva aqui a resposta ao cliente..."
              className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-cyan-500"
            />

            <p className="mt-2 text-xs text-gray-400">
              Máximo de 3000 caracteres.
            </p>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#071B2D] px-6 py-4 text-sm font-bold text-white transition hover:bg-cyan-700 sm:w-auto"
          >
            <Save size={18} />
            Guardar alterações
          </button>
        </form>
      </div>
    </div>
  );
}
