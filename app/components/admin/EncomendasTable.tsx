
import Link from "next/link";
import {
  Eye,
  Package,
  CalendarDays,
  Phone,
  ShoppingBag,
} from "lucide-react";

type EstadoEncomenda =
  | "PENDENTE"
  | "CONFIRMADA"
  | "EM_PREPARACAO"
  | "ENVIADA"
  | "ENTREGUE"
  | "CANCELADA";

interface Encomenda {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  total: number | string;
  status: EstadoEncomenda;
  createdAt: Date | string;
  items: {
    quantity: number;
  }[];
}

interface EncomendasTableProps {
  encomendas: Encomenda[];
}

const ESTADOS: Record<
  EstadoEncomenda,
  { label: string; classes: string }
> = {
  PENDENTE: {
    label: "Pendente",
    classes: "bg-amber-100 text-amber-700",
  },
  CONFIRMADA: {
    label: "Confirmada",
    classes: "bg-blue-100 text-blue-700",
  },
  EM_PREPARACAO: {
    label: "Em preparação",
    classes: "bg-purple-100 text-purple-700",
  },
  ENVIADA: {
    label: "Enviada",
    classes: "bg-cyan-100 text-cyan-700",
  },
  ENTREGUE: {
    label: "Entregue",
    classes: "bg-green-100 text-green-700",
  },
  CANCELADA: {
    label: "Cancelada",
    classes: "bg-red-100 text-red-700",
  },
};

function formatarPreco(valor: number | string) {
  return Number(valor).toLocaleString("pt-MZ", {
    style: "currency",
    currency: "MZN",
  });
}

function formatarData(data: Date | string) {
  return new Date(data).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EncomendasTable({
  encomendas,
}: EncomendasTableProps) {
  if (encomendas.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
        <ShoppingBag className="mx-auto h-14 w-14 text-gray-300" />

        <h3 className="mt-4 text-lg font-bold text-gray-800">
          Nenhuma encomenda encontrada
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Quando os clientes realizarem encomendas, elas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Versão desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-4">Referência</th>
              <th className="px-5 py-4">Cliente</th>
              <th className="px-5 py-4">Produtos</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Data</th>
              <th className="px-5 py-4 text-right">Detalhes</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {encomendas.map((encomenda) => {
              const estado = ESTADOS[encomenda.status];

              const quantidade = encomenda.items.reduce(
                (total, item) => total + item.quantity,
                0
              );

              return (
                <tr
                  key={encomenda.id}
                  className="transition hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="font-bold text-cyan-700">
                      {encomenda.orderNumber}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800">
                      {encomenda.customerName}
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <Phone size={12} />
                      {encomenda.phone}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <Package size={16} />
                      {quantidade} {quantidade === 1 ? "unidade" : "unidades"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 font-bold text-gray-800">
                    {formatarPreco(encomenda.total)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${estado.classes}`}
                    >
                      {estado.label}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                    {formatarData(encomenda.createdAt)}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/dashboard/encomendas/${encomenda.id}`}
                      title="Ver detalhes"
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      <Eye size={18} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Versão mobile */}
      <div className="divide-y divide-gray-100 md:hidden">
        {encomendas.map((encomenda) => {
          const estado = ESTADOS[encomenda.status];

          const quantidade = encomenda.items.reduce(
            (total, item) => total + item.quantity,
            0
          );

          return (
            <article key={encomenda.id} className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">Referência</p>
                  <p className="font-bold text-cyan-700">
                    {encomenda.orderNumber}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${estado.classes}`}
                >
                  {estado.label}
                </span>
              </div>

              <div>
                <p className="font-bold text-gray-800">
                  {encomenda.customerName}
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Phone size={14} />
                  {encomenda.phone}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Produtos</p>
                  <p className="mt-1 font-bold text-gray-800">
                    {quantidade} unidades
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="mt-1 font-bold text-gray-800">
                    {formatarPreco(encomenda.total)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <CalendarDays size={14} />
                  {formatarData(encomenda.createdAt)}
                </p>

                <Link
                  href={`/admin/dashboard/encomendas/${encomenda.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#071B2D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  <Eye size={16} />
                  Detalhes
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
