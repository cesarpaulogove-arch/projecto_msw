
import { Suspense } from "react";
import CompletarRegistoClient from "./CompletarRegistoClient";


export default function CompletarRegistoPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm font-medium">
              A carregar formulário...
            </span>
          </div>
        </main>
      }
    >
      <CompletarRegistoClient />
    </Suspense>
  );
}
