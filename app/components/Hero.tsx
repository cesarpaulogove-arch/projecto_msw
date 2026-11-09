
import { ArrowRight, Cpu, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#071B2D] text-white">
      <div className="max-w-7xl mx-auto px-6 py-5 md:py-6 grid md:grid-cols-2 gap-5 items-center">

        {/* Conteúdo textual */}
        <div>

          <h2 className="text-2xl md:text-3xl font-black mt-2 leading-tight">
            O futuro da
            <span className="text-cyan-400"> electrónica</span>
            começa aqui.
          </h2>

        </div>

        {/* Imagem do banner */}
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"
            alt="Componentes electrónicos MSW BUSINESS"
            className="rounded-xl w-full h-[155px] md:h-[180px] object-cover"
          />
        </div>

      </div>
    </section>
  );
}
