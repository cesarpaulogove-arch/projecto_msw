import { Suspense } from "react";
import EditarConteudoForm from "./EditarConteudoForm";

interface Props {
  params: Promise<{ id: string }>;
}

function Carregamento() {
  return (
    <div className="mx-auto max-w-4xl py-20 text-center">
      <p className="text-sm text-gray-500">
        A carregar formulário de edição...
      </p>
    </div>
  );
}

async function ConteudoComParametros({
  params,
}: Props) {
  const { id } = await params;

  return <EditarConteudoForm id={id} />;
}

export default function EditarConteudoPage({ params }: Props) {
  return (
    <Suspense fallback={<Carregamento />}>
      <ConteudoComParametros params={params} />
    </Suspense>
  );
}