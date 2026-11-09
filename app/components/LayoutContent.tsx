"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import Header from "./Header";
import CategoriesNav from "./Categories";
import Footer from "./Footer";
import FloatingActions from "./FloatingActions";

function LayoutContentInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isQuotationPage = pathname.startsWith("/cotacoes/");

  if (isQuotationPage) {
    return (
      <main className="min-h-screen flex-1 bg-white">
        {children}
      </main>
    );
  }

  return (
    <>
      <div className="fixed left-0 top-0 z-[100] w-full bg-white shadow-sm">
        <Header />
        <CategoriesNav />
      </div>

      <main className="flex-1 pt-[166px] md:pt-[116px]">
        {children}
      </main>

      <Footer />

      <FloatingActions />
    </>
  );
}

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex-1 bg-white">
          {children}
        </main>
      }
    >
      <LayoutContentInner>
        {children}
      </LayoutContentInner>
    </Suspense>
  );
}