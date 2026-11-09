
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  User,
  MapPin,
  Phone,
  Mail,
  Package,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import EstadoEncomenda from "./EstadoEncomenda";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatarEstado(estado: string) {
  const estados: Record<string, string> = {
    PENDENTE: "Pendente",
    CONFIRMADA: "Confirmada",
    EM_PREPARACAO: "Em preparação",
    ENVIADA: "Enviada",
    ENTREGUE: "Entregue",
    CANCELADA: "Cancelada",
  };

  return estados[estado] ?? estado;
}

function formatarMoeda(valor: number) {
  return `${valor.toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;
}

export default function DetalhesEncomendaPage({
  params,
}: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="font-semibold text-gray-600">
            A carregar os detalhes da encomenda...
          </p>
        </div>
      }
    >
      <DetalhesEncomendaConteudo params={params} />
    </Suspense>
  );
}

async function DetalhesEncomendaConteudo({
  params,
}: PageProps) {
  const { id } = await params;

  const encomenda = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!encomenda) {
    notFound();
  }

  const quantidadeTotal = encomenda.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="space-y-8">

      {/* Cabeçalho */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/dashboard/encomendas"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-cyan-600"
          >
            <ArrowLeft size={17} />
            Voltar às encomendas
          </Link>

          <p className="text-sm font-bold text-cyan-600">
            MSW TECH / ENCOMENDAS
          </p>

          <h1 className="mt-2 text-2xl font-black text-[#071B2D]">
            {encomenda.orderNumber}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Registada em{" "}
            {new Date(encomenda.createdAt).toLocaleString("pt-MZ")}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs text-gray-500">
            Estado actual
          </p>

          <p className="mt-1 font-bold text-[#071B2D]">
            {formatarEstado(encomenda.status)}
          </p>
        </div>
      </section>

      {/* Informação do cliente */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
              <User size={22} />
            </div>

            <h2 className="font-bold text-[#071B2D]">
              Dados do cliente
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">
                Nome completo
              </p>

              <p className="mt-1 font-semibold text-gray-800">
                {encomenda.customerName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={17} className="text-gray-400" />
              <span className="text-sm text-gray-700">
                {encomenda.phone}
              </span>
            </div>

            {encomenda.email && (
              <div className="flex items-center gap-3">
                <Mail size={17} className="text-gray-400" />
                <span className="text-sm text-gray-700">
                  {encomenda.email}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <MapPin size={22} />
            </div>

            <h2 className="font-bold text-[#071B2D]">
              Endereço de entrega
            </h2>
          </div>

          <p className="font-semibold text-gray-800">
            {encomenda.address}
          </p>

          {encomenda.district && (
            <p className="mt-2 text-sm text-gray-500">
              Distrito: {encomenda.district}
            </p>
          )}

          {encomenda.notes && (
            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">
                OBSERVAÇÕES
              </p>

              <p className="mt-2 text-sm text-gray-700">
                {encomenda.notes}
              </p>
            </div>
          )}
        </div>

      </section>

      {/* Produtos */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">

        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Package size={22} />
            </div>

            <div>
              <h2 className="font-bold text-[#071B2D]">
                Produtos encomendados
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {quantidadeTotal} unidade(s)
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Produto</th>
                <th className="px-5 py-4">Preço unitário</th>
                <th className="px-5 py-4">Quantidade</th>
                <th className="px-5 py-4">Subtotal</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {encomenda.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-semibold text-[#071B2D]">
                    {item.productName}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {formatarMoeda(Number(item.unitPrice))}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {item.quantity}
                  </td>

                  <td className="px-5 py-4 font-bold text-[#071B2D]">
                    {formatarMoeda(Number(item.subtotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Resumo financeiro e estado */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <ClipboardList size={22} className="text-cyan-600" />

            <h2 className="font-bold text-[#071B2D]">
              Resumo financeiro
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span className="font-semibold text-gray-800">
                {formatarMoeda(Number(encomenda.subtotal))}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Taxa de entrega
              </span>

              <span className="font-semibold text-gray-800">
                {formatarMoeda(Number(encomenda.deliveryFee))}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span className="font-bold text-[#071B2D]">
                  Total da encomenda
                </span>

                <span className="text-xl font-black text-cyan-600">
                  {formatarMoeda(Number(encomenda.total))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <EstadoEncomenda
          encomendaId={encomenda.id}
          estadoInicial={encomenda.status}
        />

      </section>
    </div>
  );
}
