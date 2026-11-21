
"use client";

import Link from "next/link";
import {
  ShoppingCart,
  MessageCircle,
  MessagesSquare,
  ArrowUp,
} from "lucide-react";

import { useCarrinho } from "@/app/components/carrinho/CartProvider";

const WHATSAPP_NUMBER = "258864018233";

const WHATSAPP_MESSAGE =
  "Olá! Gostaria de obter informações sobre os produtos e serviços da MSW BUSINESS.";

const actions = [
  {
    label: "Carrinho",
    icon: ShoppingCart,
    href: "/carrinho",
    type: "link",
  },
  {
    label: "WhatsApp",
    icon: MessageCircle,
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
    type: "external",
  },
 {
  label: "Atendimento",
  icon: MessagesSquare,
  href: "/contactos",
  type: "link",
},
];

export default function FloatingActions() {
  const { quantidadeTotal } = useCarrinho();

  return (
    <div className="fixed right-0 bottom-20 z-[90] flex flex-col items-center border border-gray-200 bg-white shadow-lg md:bottom-8">

      {actions.map((action) => {
        const Icon = action.icon;

        const isWhatsApp = action.type === "external";

        const content = (
          <>
            <Icon size={23} strokeWidth={1.8} />

            {/* CONTADOR DO CARRINHO */}
            {action.href === "/carrinho" && quantidadeTotal > 0 && (
              <span className="absolute right-[7px] top-[5px] flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                {quantidadeTotal > 99 ? "99+" : quantidadeTotal}
              </span>
            )}

            {/* TEXTO AO PASSAR O RATO */}
            <span className="pointer-events-none absolute right-[68px] whitespace-nowrap rounded-md bg-[#071B2D] px-3 py-2 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              {action.label}
              {action.href === "/carrinho" && quantidadeTotal > 0
                ? ` (${quantidadeTotal})`
                : ""}
            </span>
          </>
        );

        const className = `group relative flex h-[58px] w-[58px] items-center justify-center transition-all duration-200 ${
          isWhatsApp
            ? "bg-green-500 text-white hover:bg-green-600"
            : "text-gray-800 hover:bg-[#071B2D] hover:text-cyan-400"
        }`;

        if (isWhatsApp) {
          return (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactar a MSW BUSINESS pelo WhatsApp"
              title="WhatsApp"
              className={className}
            >
              {content}
            </a>
          );
        }

        return (
          <Link
            key={action.href}
            href={action.href}
            aria-label={
              action.label === "Carrinho"
                ? `Carrinho com ${quantidadeTotal} produtos`
                : action.label
            }
            title={action.label}
            className={className}
          >
            {content}
          </Link>
        );
      })}

      {/* VOLTAR AO TOPO */}
      <button
        type="button"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          })
        }
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
        className="group relative flex h-[58px] w-[58px] items-center justify-center border-t border-gray-200 text-gray-800 transition-all duration-200 hover:bg-[#071B2D] hover:text-cyan-400"
      >
        <ArrowUp size={23} strokeWidth={1.8} />

        <span className="pointer-events-none absolute right-[68px] whitespace-nowrap rounded-md bg-[#071B2D] px-3 py-2 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
          Voltar ao topo
        </span>
      </button>

    </div>
  );
}
