
"use client";

import { useState } from "react";
import { RefreshCw, Save } from "lucide-react";

const ESTADOS = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONFIRMADA", label: "Confirmada" },
  { value: "EM_PREPARACAO", label: "Em preparação" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "CANCELADA", label: "Cancelada" },
];

interface Props {
  encomendaId: string;
  estadoInicial: string;
}

export default function EstadoEncomenda({
  encomendaId,
  estadoInicial,
}: Props) {
  const [estado, setEstado] = useState(estadoInicial);
  const [estadoGuardado, setEstadoGuardado] = useState(estadoInicial);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);

  async function actualizarEstado() {
    if (estado === estadoGuardado) return;

    if (estado === "CANCELADA") {
      const confirmar = window.confirm(
        "Tem a certeza de que pretende cancelar esta encomenda? O stock dos produtos será devolvido."
      );

      if (!confirmar) {
        setEstado(estadoGuardado);
        return;
      }
    }

    setLoading(true);
    setMensagem("");
    setErro(false);

    try {
      const response = await fetch(`/api/encomendas/${encomendaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível actualizar o estado.");
      }

      setEstadoGuardado(data.encomenda.estado);
      setEstado(data.encomenda.estado);
      setMensagem("Estado actualizado com sucesso.");

      // Actualizar os dados apresentados no servidor
      window.location.reload();
    } catch (error) {
      setErro(true);
      setMensagem(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado."
      );
      setEstado(estadoGuardado);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">

      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-green-50 p-3 text-green-600">
          <RefreshCw size={22} />
        </div>

        <h2 className="font-bold text-[#071B2D]">
          Actualizar estado
        </h2>
      </div>

      <label className="mb-2 block text-sm font-semibold text-gray-600">
        Estado da encomenda
      </label>

      <select
        value={estado}
        disabled={loading || estadoGuardado === "CANCELADA"}
        onChange={(event) => {
          setEstado(event.target.value);
          setMensagem("");
        }}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-cyan-500 disabled:bg-gray-100"
      >
        {ESTADOS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      {estadoGuardado === "CANCELADA" && (
        <p className="mt-3 text-xs text-red-600">
          Esta encomenda foi cancelada e não pode ser reactivada.
        </p>
      )}

      {mensagem && (
        <p
          className={`mt-4 rounded-lg p-3 text-sm ${
            erro
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {mensagem}
        </p>
      )}

      <button
        type="button"
        onClick={actualizarEstado}
        disabled={
          loading ||
          estado === estadoGuardado ||
          estadoGuardado === "CANCELADA"
        }
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071B2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <RefreshCw size={17} className="animate-spin" />
            A actualizar...
          </>
        ) : (
          <>
            <Save size={17} />
            Guardar alteração
          </>
        )}
      </button>

    </div>
  );
}
