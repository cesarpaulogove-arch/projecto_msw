
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

type ImagemItem = {
  url: string;
  file?: File;
  preview: string;
  nova: boolean;
};

type Conteudo = {
  id: string;
  title: string;
  type: string;
  summary: string | null;
  content: string;
  image: string | null;
  images: string[];
  order: number;
  status: string;
};

export default function EditarConteudoForm({
  id,
}: {
  id: string;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("SERVICOS");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");

  const [images, setImages] = useState<ImagemItem[]>([]);
  const [principalIndex, setPrincipalIndex] = useState(0);

  const [order, setOrder] = useState("0");
  const [statusActual, setStatusActual] = useState("RASCUNHO");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const imagesRef = useRef<ImagemItem[]>([]);

  const usaImagens = type !== "SERVICOS";

  // Manter referência actualizada das imagens
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Libertar previews ao sair
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((imagem) => {
        if (imagem.nova) {
          URL.revokeObjectURL(imagem.preview);
        }
      });
    };
  }, []);

  // Carregar conteúdo existente
  useEffect(() => {
    let activo = true;

    async function carregarConteudo() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/conteudos/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Não foi possível carregar o conteúdo."
          );
        }

        if (!activo) return;

        const conteudo: Conteudo = data;

        setTitle(conteudo.title || "");
        setType(conteudo.type || "SERVICOS");
        setSummary(conteudo.summary || "");
        setContent(conteudo.content || "");
        setOrder(String(conteudo.order ?? 0));
        setStatusActual(conteudo.status || "RASCUNHO");

        const galeria =
          conteudo.type === "SERVICOS"
            ? []
            : Array.isArray(conteudo.images)
              ? conteudo.images
              : [];

        const urls = [...galeria];

        if (
          conteudo.type !== "SERVICOS" &&
          conteudo.image &&
          !urls.includes(conteudo.image)
        ) {
          urls.unshift(conteudo.image);
        }

        const imagensExistentes: ImagemItem[] = urls
          .filter(
            (url) => typeof url === "string" && url.trim() !== ""
          )
          .map((url) => ({
            url,
            preview: url,
            nova: false,
          }));

        setImages(imagensExistentes);

        const indicePrincipal = conteudo.image
          ? imagensExistentes.findIndex(
              (imagem) => imagem.url === conteudo.image
            )
          : 0;

        setPrincipalIndex(Math.max(0, indicePrincipal));
      } catch (err) {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar conteúdo."
          );
        }
      } finally {
        if (activo) setLoading(false);
      }
    }

    carregarConteudo();

    return () => {
      activo = false;
    };
  }, [id]);

  // Seleccionar novas imagens
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

      if (
        ficheiro.size === 0 ||
        ficheiro.size > MAX_FILE_SIZE
      ) {
        setError(
          `A imagem "${ficheiro.name}" deve ter no máximo 5 MB.`
        );
        return;
      }
    }

    const novasImagens: ImagemItem[] = seleccionadas.map((file) => ({
      file,
      url: "",
      preview: URL.createObjectURL(file),
      nova: true,
    }));

    setImages((anteriores) => [
      ...anteriores,
      ...novasImagens,
    ]);
  }

  // Remover imagem
  function removerImagem(index: number) {
    const imagem = images[index];

    if (imagem?.nova) {
      URL.revokeObjectURL(imagem.preview);
    }

    const novasImagens = images.filter((_, i) => i !== index);

    setImages(novasImagens);

    if (novasImagens.length === 0) {
      setPrincipalIndex(0);
    } else if (principalIndex === index) {
      setPrincipalIndex(0);
    } else if (principalIndex > index) {
      setPrincipalIndex((anterior) => anterior - 1);
    }
  }

  // Mudar categoria
  function alterarCategoria(novoTipo: string) {
    setType(novoTipo);

    if (novoTipo === "SERVICOS") {
      images.forEach((imagem) => {
        if (imagem.nova) {
          URL.revokeObjectURL(imagem.preview);
        }
      });

      setImages([]);
      setPrincipalIndex(0);
    }
  }

  // Guardar alterações
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

    if (
      !Number.isInteger(ordemNumerica) ||
      ordemNumerica < 0
    ) {
      setError(
        "A ordem deve ser um número inteiro igual ou superior a zero."
      );
      return;
    }

    if (usaImagens && images.length > MAX_IMAGENS) {
      setError(`Pode seleccionar no máximo ${MAX_IMAGENS} imagens.`);
      return;
    }

    setSaving(true);

    try {
      // Serviços não podem guardar imagens
      let imagensFinais: string[] = [];
      let imagemPrincipal = "";

      if (usaImagens) {
        // 1. Separar imagens novas
        const imagensNovas = images.filter(
          (imagem) => imagem.nova && imagem.file
        );

        let urlsCarregadas: string[] = [];

        // 2. Carregar apenas imagens novas
        if (imagensNovas.length > 0) {
          const formData = new FormData();

          imagensNovas.forEach((imagem) => {
            formData.append("images", imagem.file!);
          });

          const uploadResponse = await fetch(
            "/api/conteudos/upload",
            {
              method: "POST",
              body: formData,
            }
          );

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok) {
            throw new Error(
              uploadData.error ||
                "Não foi possível carregar as imagens."
            );
          }

          if (
            !Array.isArray(uploadData.images) ||
            uploadData.images.length !== imagensNovas.length ||
            !uploadData.images.every(
              (url: unknown) => typeof url === "string"
            )
          ) {
            throw new Error(
              "O servidor não devolveu correctamente as imagens."
            );
          }

          urlsCarregadas = uploadData.images;
        }

        // 3. Reconstruir galeria na ordem original
        let indiceNova = 0;

        imagensFinais = images.map((imagem) => {
          if (imagem.nova) {
            const url = urlsCarregadas[indiceNova];
            indiceNova++;
            return url;
          }

          return imagem.url;
        });

        imagemPrincipal =
          imagensFinais[principalIndex] || "";
      }

      // 4. Actualizar conteúdo
      const response = await fetch(`/api/conteudos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          type,
          summary: summary.trim(),
          content: content.trim(),
          image: imagemPrincipal,
          images: imagensFinais,
          order: ordemNumerica,
          status: publicar ? "PUBLICADO" : "RASCUNHO",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível actualizar o conteúdo."
        );
      }

      window.location.href = "/admin/dashboard/conteudos";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro inesperado."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <p className="text-sm text-gray-500">
          A carregar conteúdo...
        </p>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-10">
        <Link
          href="/admin/dashboard/conteudos"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Voltar aos conteúdos
        </Link>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
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
          Editar conteúdo
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Actualize as informações, imagens e estado de publicação.
        </p>
      </div>

      {/* Informações principais */}
      <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">

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
            maxLength={160}
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-lime-500 disabled:bg-gray-100"
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
            onChange={(e) => alterarCategoria(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-lime-500 disabled:bg-gray-100"
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
            maxLength={500}
            rows={3}
            disabled={saving}
            placeholder="Escreva um resumo breve..."
            className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-lime-500 disabled:bg-gray-100"
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {summary.length}/500 caracteres
          </p>
        </div>

        {/* Conteúdo */}
        <div>
          <label
            htmlFor="content"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700"
          >
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
                ? "Introduza uma actividade por linha:\n\nConsultoria empresarial\nAssistência técnica\nSoluções inteligentes\nManutenção técnica"
                : "Descreva detalhadamente o projecto ou solução..."
            }
            rows={type === "SERVICOS" ? 8 : 12}
            disabled={saving}
            className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 leading-7 outline-none focus:border-lime-500 disabled:bg-gray-100"
          />

          <p className="mt-1 text-xs text-gray-400">
            {type === "SERVICOS"
              ? "Cada linha será apresentada como um elemento de uma lista não ordenada."
              : "Actualize a descrição completa do conteúdo."
            }
          </p>
        </div>
      </section>

      {/* Galeria: apenas Projectos e Soluções */}
      {usaImagens && (
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-lime-100 p-2">
              <ImageIcon className="h-5 w-5 text-lime-700" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Galeria de imagens
              </h2>
              <p className="text-sm text-gray-500">
                Imagens actuais e novas imagens seleccionadas.
              </p>
            </div>
          </div>

          <label
            htmlFor="images"
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center transition hover:border-lime-500 hover:bg-lime-50 ${
              saving || images.length >= MAX_IMAGENS
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            <div className="mb-3 rounded-full bg-lime-100 p-4">
              <Upload className="h-7 w-7 text-lime-700" />
            </div>

            <span className="text-sm font-semibold text-gray-800">
              Adicionar imagens
            </span>

            <span className="mt-1 text-xs text-gray-500">
              Escolha imagens do computador ou telemóvel
            </span>

            <span className="mt-3 rounded-full bg-white px-3 py-1 text-xs text-gray-600">
              JPG, PNG, WEBP ou GIF · Máximo 5 MB
            </span>
          </label>

          <input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={saving || images.length >= MAX_IMAGENS}
            onChange={(e) => {
              adicionarImagens(e.target.files);
              e.target.value = "";
            }}
            className="sr-only"
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>Máximo de {MAX_IMAGENS} imagens.</span>
            <span className="font-semibold">
              {images.length}/{MAX_IMAGENS}
            </span>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {images.map((imagem, index) => {
                const principal = principalIndex === index;

                return (
                  <div
                    key={`${imagem.preview}-${index}`}
                    className={`overflow-hidden rounded-xl border ${
                      principal
                        ? "border-lime-500 ring-2 ring-lime-100"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="relative aspect-video bg-gray-100">
                      <img
                        src={imagem.preview}
                        alt={`Imagem ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {principal && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-lime-500 px-3 py-1 text-xs font-bold text-gray-950">
                          <Star size={13} />
                          Principal
                        </span>
                      )}

                      {imagem.nova && (
                        <span className="absolute bottom-2 left-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
                          Nova imagem
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removerImagem(index)}
                        disabled={saving}
                        title="Remover imagem"
                        className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-600 shadow hover:bg-red-50 disabled:opacity-50"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-3 p-3">
                      <p className="truncate text-xs text-gray-500">
                        {imagem.file?.name || imagem.url}
                      </p>

                      {principal ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-lime-700">
                          <Check size={15} />
                          Imagem principal
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrincipalIndex(index)}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:border-lime-500 hover:text-lime-700 disabled:opacity-50"
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
                Este conteúdo ainda não tem imagens.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-lime-50 p-4 text-sm text-lime-900">
            <p className="font-semibold">Imagem principal</p>
            <p className="mt-1 text-xs leading-relaxed">
              A imagem principal será utilizada como capa do conteúdo.
              Pode seleccionar qualquer imagem da galeria.
            </p>
          </div>
        </section>
      )}

      {/* Organização */}
      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
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
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-lime-500 disabled:bg-gray-100"
          />

          <p className="mt-1 text-xs text-gray-400">
            Números menores serão apresentados primeiro.
          </p>
        </div>
      </section>

      {/* Estado */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <FolderOpen className="h-5 w-5 text-gray-700" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Estado do conteúdo
            </h2>
            <p className="text-sm text-gray-500">
              Estado actual: {statusActual}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-800">Rascunho</p>
            <p className="mt-1 text-sm text-amber-700">
              Guarda sem apresentar publicamente.
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

      {/* Erro */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Link
          href="/admin/dashboard/conteudos"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>

        <button
          type="button"
          disabled={saving}
          onClick={() => guardar(false)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Save size={17} />
          Guardar rascunho
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => guardar(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime-500 px-5 py-3 text-sm font-semibold text-gray-950 hover:bg-lime-400 disabled:opacity-50"
        >
          <Send size={17} />
          {saving ? "A actualizar..." : "Guardar e publicar"}
        </button>
      </div>

      {saving && (
        <p className="text-center text-sm text-gray-500">
          A actualizar o conteúdo. Aguarde...
        </p>
      )}
    </div>
  );
}
