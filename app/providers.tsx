
"use client";

import type { ReactNode } from "react";
import { CarrinhoProvider } from "./components/carrinho/CartProvider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <CarrinhoProvider>
      {children}
    </CarrinhoProvider>
  );
}
