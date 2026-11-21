
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
          <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 bg-[#071B2D] md:block" />
        }
      >
        <AdminSidebar />
      </Suspense>

      {/* Área principal */}
      <div className="min-h-screen min-w-0 md:pl-64">
        {/* Cabeçalho */}
        <Suspense
          fallback={
            <header className="sticky top-0 z-30 min-h-16 border-b border-gray-200 bg-white md:min-h-20" />
          }
        >
          <AdminHeader />
        </Suspense>

        {/* Conteúdo */}
        <main className="w-full min-w-0 p-3 sm:p-5 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menu lateral */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 bg-[#071B2D] md:block" />

      {/* Área principal */}
      <div className="min-h-screen md:pl-64">
        {/* Cabeçalho */}
        <header className="min-h-16 border-b border-gray-200 bg-white md:min-h-20" />

        {/* Conteúdo */}
        <main className="p-3 sm:p-5 md:p-8">
          <div className="h-8 w-48 max-w-full animate-pulse rounded-lg bg-gray-200" />

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
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
    <Suspense fallback={<DashboardLoading />}>
      <AreaAdministrativa>{children}</AreaAdministrativa>
    </Suspense>
  );
}
