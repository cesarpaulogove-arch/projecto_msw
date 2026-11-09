
import { Suspense } from "react";
import { connection } from "next/server";

import AdminHeader from "@/app/components/admin/AdminHeader";
import AdminSidebar from "@/app/components/admin/AdminSidebar";
import { exigirGestor } from "@/lib/auth-gestor";

async function AreaAdministrativa({
  children,
}: {
  children: React.ReactNode;
}) {
  // Executa esta área apenas durante uma requisição real
  await connection();

  // Protege toda a área administrativa
  await exigirGestor();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menu lateral */}
      <Suspense
        fallback={
          <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#071B2D]" />
        }
      >
        <AdminSidebar />
      </Suspense>

      {/* Área principal */}
      <div className="min-h-screen pl-64">
        {/* Cabeçalho */}
        <Suspense
          fallback={
            <header className="sticky top-0 z-30 min-h-20 border-b border-gray-200 bg-white" />
          }
        >
          <AdminHeader />
        </Suspense>

        {/* Conteúdo */}
        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <aside className="fixed left-0 top-0 h-screen w-64 bg-[#071B2D]" />
          <div className="min-h-screen pl-64">
            <header className="min-h-20 border-b border-gray-200 bg-white" />
            <main className="p-8">
              <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-2xl bg-gray-100"
                  />
                ))}
              </div>
            </main>
          </div>
        </div>
      }
    >
      <AreaAdministrativa>{children}</AreaAdministrativa>
    </Suspense>
  );
}
