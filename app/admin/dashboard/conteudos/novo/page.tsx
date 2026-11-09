
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Send,
  Image as ImageIcon,
  FileText,
  FolderOpen,
  Star,
  Check,
  Upload,
  X,
  List,
} from "lucide-react";

const tipos = [
  { value: "SERVICOS", label: "Serviços" },
  { value: "PROJECTOS", label: "Projectos" },
  { value: "SOLUCOES", label: "Soluções" },
];

const MAX_IMAGENS = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

type ImagemSelecionada = {
  file: File;
  preview: string;
};

export default function NovoConteudoPage() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("SERVICOS");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");

  const [images, setImages] = useState<ImagemSelecionada[]>([]);
  const [principalIndex, setPrincipalIndex] = useState(0);

  const [order, setOrder] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const usaImagens = type !== "SERVICOS";

  // Libertar endereços temporários
  useEffect(() => {
    return () => {
      images.forEach((imagem) => {
        URL.revokeObjectURL(imagem.preview);
      });
    };
  }, [images]);

  // Limpar imagens ao mudar para Serviços
  useEffect(() => {
    if (type === "SERVICOS") {
      setImages([]);
      setPrincipalIndex(0);
    }
  }, [type]);

  function adicionarImagens(ficheiros: FileList | null) {
    if (!ficheiros || !usaImagens) return;

    setError("");

    const seleccionadas = Array.from(ficheiros);

    if (images.length + seleccionadas.length > MAX_IMAGENS) {
      setError(`Pode seleccionar no máximo ${MAX_IMAGENS} imagens.`);
      return;
    }

    for (const ficheiro of seleccionadas) {
      if (!TIPOS_PERMITIDOS.includes(ficheiro.type)) {
        setError("Formato inválido. Utilize JPG, PNG, WEBP ou GIF.");
        return;
      }

      if (ficheiro.size > MAX_FILE_SIZE) {
        setError(`A imagem "${ficheiro.name}" ultrapassa 5 MB.`);
        return;
      }
    }

    const novasImagens = seleccionadas.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((anteriores) => [
      ...anteriores,
      ...novasImagens,
    ]);
  }

  function removerImagem(index: number) {
    const imagemRemovida = images[index];

    if (imagemRemovida) {
      URL.revokeObjectURL(imagemRemovida.preview);
    }

    const novasImagens = images.filter((_, i) => i !== index);

    setImages(novasImagens);

    if (novasImagens.length === 0 || principalIndex === index) {
      setPrincipalIndex(0);
    } else if (principalIndex > index) {
      setPrincipalIndex((anterior) => anterior - 1);
    }
  }

  async function guardar(publicar: boolean) {
    setError("");

    if (!title.trim()) {
      setError("O título é obrigatório.");
      return;
    }

    if (title.trim().length > 160) {
      setError("O título não pode ultrapassar 160 caracteres.");
      return;
    }

    if (summary.trim().length > 500) {
      setError("O resumo não pode ultrapassar 500 caracteres.");
      return;
    }

    if (!content.trim()) {
      setError("O conteúdo é obrigatório.");
      return;
    }

    const ordemNumerica = Number(order);

    if (!Number.isInteger(ordemNumerica) || ordemNumerica < 0) {
      setError("A ordem deve ser um número inteiro igual ou superior a zero.");
      return;
    }

    setLoading(true);

    try {
      let imagensCarregadas: string[] = [];

      // Carregar imagens apenas em Projectos e Soluções
      if (usaImagens && images.length > 0) {
        const formData = new FormData();

        images.forEach((imagem) => {
          formData.append("images", imagem.file);
        });

        const uploadResponse = await fetch("/api/conteudos/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(
            uploadData.error || "Não foi possível carregar as imagens."
          );
        }

        if (
          !Array.isArray(uploadData.images) ||
          uploadData.images.length !== images.length ||
          !uploadData.images.every(
            (url: unknown) => typeof url === "string"
          )
        ) {
          throw new Error("Erro ao receber as imagens carregadas.");
        }

        imagensCarregadas = uploadData.images;
      }

      const imagemPrincipal =
        imagensCarregadas[principalIndex] || "";

      const response = await fetch("/api/conteudos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          type,
          summary: summary.trim(),
          content: content.trim(),
          image: imagemPrincipal,
          images: imagensCarregadas,
          order: ordemNumerica,
          status: publicar ? "PUBLICADO" : "RASCUNHO",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível guardar o conteúdo."
        );
      }

      window.location.href = "/admin/dashboard/conteudos";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro inesperado."
      );

      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">

      {/* Cabeçalho */}
      <div>
        <Link
          href="/admin/dashboard/conteudos"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Voltar aos conteúdos
        </Link>

        <p className="text-sm font-semibold text-lime-700">
          MSW BUSINESS
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Criar conteúdo
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Crie e organize os conteúdos apresentados publicamente.
        </p>
      </div>

      {/* Informações principais */}
      <section className="space-y-5 rounded-xl border bg-white p-5 sm:p-7">

        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-lime-100 p-2">
            <FileText className="h-5 w-5 text-lime-700" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Informações principais
            </h2>
            <p className="text-sm text-gray-500">
              Identificação e descrição do conteúdo.
            </p>
          </div>
        </div>

        {/* Título */}
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
            Título *
          </label>

          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Assistência técnica especializada"
            maxLength={160}
            required
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {title.length}/160 caracteres
          </p>
        </div>

        {/* Categoria */}
        <div>
          <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-700">
            Categoria *
          </label>

          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-lime-500"
          >
            {tipos.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Resumo */}
        <div>
          <label htmlFor="summary" className="mb-2 block text-sm font-medium text-gray-700">
            Resumo
          </label>

          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Introduza um pequeno resumo..."
            rows={3}
            maxLength={500}
            disabled={loading}
            className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-lime-500"
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {summary.length}/500 caracteres
          </p>
        </div>

        {/* Conteúdo */}
        <div>
          <label htmlFor="content" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            {type === "SERVICOS" ? (
              <>
                <List size={17} />
                Lista de actividades *
              </>
            ) : (
              <>
                <FileText size={17} />
                Conteúdo completo *
              </>
            )}
          </label>

          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === "SERVICOS"
                ? "Introduza uma actividade por linha:\n\nConsultoria empresarial\nAssistência técnica\nDesenvolvimento de soluções inteligentes\nManutenção de equipamentos"
                : "Descreva detalhadamente o projecto ou solução..."
            }
            rows={type === "SERVICOS" ? 8 : 12}
            required
            disabled={loading}
            className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 leading-7 outline-none focus:border-lime-500"
          />

          <p className="mt-1 text-xs text-gray-400">
            {type === "SERVICOS"
              ? "Cada linha será apresentada como um elemento de uma lista não ordenada no site público."
              : "Introduza a descrição completa do conteúdo."
            }
          </p>
        </div>
      </section>

      {/* Galeria: apenas Projectos e Soluções */}
      {usaImagens && (
        <section className="space-y-5 rounded-xl border bg-white p-5 sm:p-7">

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-lime-100 p-2">
              <ImageIcon className="h-5 w-5 text-lime-700" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Galeria de imagens
              </h2>
              <p className="text-sm text-gray-500">
                Seleccione até 10 imagens.
              </p>
            </div>
          </div>

          <label
            htmlFor="images"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center transition hover:border-lime-500 hover:bg-lime-50"
          >
            <Upload className="mb-3 h-8 w-8 text-lime-700" />
            <span className="text-sm font-semibold text-gray-800">
              Carregar imagens
            </span>
            <span className="mt-1 text-xs text-gray-500">
              JPG, PNG, WEBP ou GIF · Máximo 5 MB por imagem
            </span>
          </label>

          <input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={loading || images.length >= MAX_IMAGENS}
            onChange={(e) => {
              adicionarImagens(e.target.files);
              e.target.value = "";
            }}
            className="sr-only"
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>Máximo de {MAX_IMAGENS} imagens</span>
            <span className="font-semibold">
              {images.length}/{MAX_IMAGENS}
            </span>
          </div>

          {images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((imagem, index) => {
                const principal = principalIndex === index;

                return (
                  <div
                    key={`${imagem.file.name}-${index}`}
                    className={`overflow-hidden rounded-xl border ${
                      principal
                        ? "border-lime-500 ring-2 ring-lime-100"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="relative aspect-video bg-gray-100">
                      <img
                        src={imagem.preview}
                        alt={imagem.file.name}
                        className="h-full w-full object-cover"
                      />

                      {principal && (
                        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-lime-500 px-3 py-1 text-xs font-bold text-gray-950">
                          <Star size={13} />
                          Principal
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removerImagem(index)}
                        disabled={loading}
                        className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-600 shadow hover:bg-red-50"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-3 p-3">
                      <p className="truncate text-xs font-medium text-gray-700">
                        {imagem.file.name}
                      </p>

                      <p className="text-xs text-gray-400">
                        {(imagem.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>

                      {principal ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-lime-700">
                          <Check size={15} />
                          Imagem principal
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrincipalIndex(index)}
                          disabled={loading}
                          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs hover:border-lime-500 hover:text-lime-700"
                        >
                          <Star size={14} />
                          Definir como principal
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-200 px-5 py-10 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-600">
                Ainda não seleccionou imagens.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-lime-50 p-4 text-sm text-lime-900">
            <p className="font-semibold">Imagem principal</p>
            <p className="mt-1 text-xs leading-relaxed">
              A primeira imagem é seleccionada automaticamente como principal.
              Pode escolher outra imagem a qualquer momento.
            </p>
          </div>
        </section>
      )}

      {/* Organização */}
      <section className="space-y-3 rounded-xl border bg-white p-5 sm:p-7">
        <h2 className="font-semibold text-gray-900">
          Organização
        </h2>

        <div>
          <label htmlFor="order" className="mb-2 block text-sm font-medium text-gray-700">
            Ordem de apresentação
          </label>

          <input
            id="order"
            type="number"
            min="0"
            step="1"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-lime-500"
          />

          <p className="mt-1 text-xs text-gray-400">
            Números menores serão apresentados primeiro.
          </p>
        </div>
      </section>

      {/* Estado de publicação */}
      <section className="rounded-xl border bg-white p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-5 w-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">
            Estado do conteúdo
          </h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-800">Rascunho</p>
            <p className="mt-1 text-sm text-amber-700">
              Guarda o conteúdo sem o apresentar publicamente.
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-800">Publicado</p>
            <p className="mt-1 text-sm text-green-700">
              Disponibiliza o conteúdo aos visitantes do site.
            </p>
          </div>
        </div>
      </section>

      {/* Erros */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Acções */}
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Link
          href="/admin/dashboard/conteudos"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>

        <button
          type="button"
          disabled={loading}
          onClick={() => guardar(false)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Save size={17} />
          Guardar rascunho
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => guardar(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime-500 px-5 py-3 text-sm font-semibold text-gray-950 hover:bg-lime-400 disabled:opacity-50"
        >
          <Send size={17} />
          {loading ? "A guardar..." : "Publicar conteúdo"}
        </button>
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-500">
          A carregar imagens e a guardar o conteúdo. Aguarde...
        </p>
      )}
    </div>
  );
}
