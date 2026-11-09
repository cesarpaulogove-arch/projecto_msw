"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#071B2D] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">

        {/* Identidade */}
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            MSW <span className="text-cyan-400">BUSINESS</span>
          </h2>

          <p className="mt-4 max-w-xs text-sm leading-6 text-gray-400">
            Tecnologia, componentes e soluções electrónicas.
            Desenvolvemos soluções para estudantes, técnicos,
            profissionais e entusiastas da electrónica.
          </p>
        </div>

        {/* Navegação */}
        <div>
          <h3 className="mb-4 font-bold text-cyan-400">
            Navegação
          </h3>

          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link href="/" className="hover:text-white transition-colors">Início</Link></li>
            <li><Link href="/produtos" className="hover:text-white transition-colors">Produtos</Link></li>
            <li><Link href="/servicos" className="hover:text-white transition-colors">Serviços</Link></li>
            <li><Link href="/projectos" className="hover:text-white transition-colors">Projectos</Link></li>
            <li><Link href="/sobre" className="hover:text-white transition-colors">Sobre nós</Link></li>
          </ul>
        </div>

        {/* Categorias */}
        <div>
          <h3 className="mb-4 font-bold text-cyan-400">
            Categorias
          </h3>

          <ul className="space-y-3 text-sm text-gray-400">
            <li>Arduino</li>
            <li>ESP32 / ESP8266</li>
            <li>Kits electrónicos</li>
            <li>Sensores</li>
            <li>Dispositivos de saída</li>
          </ul>
        </div>

        {/* Contactos */}
        <div>
          <h3 className="mb-4 font-bold text-cyan-400">
            Contactos
          </h3>

          <ul className="space-y-3 text-sm text-gray-400">
            <li>Moçambique</li>
            <li>Contacto: A definir</li>
            <li>Email: A definir</li>
          </ul>
        </div>

      </div>

      {/* Rodapé inferior */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-gray-500">
            © 2026 MSW BUSINESS. Todos os direitos reservados.
          </p>

          <p className="text-xs text-gray-500">
            Tecnologia e inovação ao seu alcance.
          </p>
        </div>
      </div>
    </footer>
  );
}