
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Projectos from "../components/conteudos/Projectos";


export default function ProjectosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-950 px-5 py-10 text-white sm:py-12">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-lime-400"
          >
            <ArrowLeft size={17} />
            Voltar ao início
          </Link>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Os nossos projectos
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
        <Suspense
          fallback={
            <p className="text-center text-gray-500">
              A carregar projectos...
            </p>
          }
        >
          <Projectos />
        </Suspense>
      </section>
    </div>
  );
}
