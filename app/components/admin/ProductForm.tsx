
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  X,
  Image as ImageIcon,
  Star,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface Categoria {
  id: string;
  name: string;
}

interface ProdutoInicial {
  id: string;
  code?: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number | string | null;
  image: string;
  images: string[];
  inStock: boolean;
  categoryId: string;
  featured: boolean;
  active: boolean;
  promotion?: boolean;
}

interface ImagemProduto {
  id: string;
  url: string;
  file?: File;
  nova: boolean;
}

interface ProductFormProps {
  categorias: Categoria[];
  produtoInicial?: ProdutoInicial;
}

interface ImagemOrdem {
  type: "existing" | "new";
  url?: string;
  index?: number;
}

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function ProductForm({
  categorias,
  produtoInicial,
}: ProductFormProps) {
  const router = useRouter();
  const inputImagem = useRef<HTMLInputElement>(null);

  const modoEdicao = Boolean(produtoInicial);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [imagens, setImagens] = useState<ImagemProduto[]>(() => {
    if (!produtoInicial) return [];

    const caminhos = produtoInicial.images?.length
      ? produtoInicial.images
      : produtoInicial.image
        ? [produtoInicial.image]
        : [];

    const unicas = Array.from(
      new Set([
        ...caminhos,
        ...(produtoInicial.image
          ? [produtoInicial.image]
          : []),
      ])
    );

    const principal = produtoInicial.image;

    return [
      ...unicas.filter((url) => url === principal),
      ...unicas.filter((url) => url !== principal),
    ].map((url, index) => ({
      id: `existente-${index}`,
      url,
      nova: false,
    }));
  });

  const [imagemPrincipal, setImagemPrincipal] = useState(
    produtoInicial?.image ?? ""
  );

  const [form, setForm] = useState({
    code: produtoInicial?.code ?? "",
    name: produtoInicial?.name ?? "",
    description: produtoInicial?.description ?? "",
    price: produtoInicial
      ? String(produtoInicial.price)
      : "",
    oldPrice:
      produtoInicial?.oldPrice !== null &&
      produtoInicial?.oldPrice !== undefined
        ? String(produtoInicial.oldPrice)
        : "",
    inStock: produtoInicial?.inStock ?? true,
    categoryId: produtoInicial?.categoryId ?? "",
    featured: produtoInicial?.featured ?? false,
    active: produtoInicial?.active ?? true,
    promotion: produtoInicial?.promotion ?? false,
  });

  // Gerir a libertação das URLs temporárias
  const urlsTemporarias = useRef(new Set<string>());

  useEffect(() => {
    return () => {
      urlsTemporarias.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      urlsTemporarias.current.clear();
    };
  }, []);

  function actualizar(
    campo: keyof typeof form,
    valor: string | boolean
  ) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function seleccionarImagens(files: FileList | null) {
    if (!files || files.length === 0) return;

    setErro("");

    const seleccionadas = Array.from(files);
    const novas: ImagemProduto[] = [];

    for (const file of seleccionadas) {
      if (!TIPOS_PERMITIDOS.includes(file.type)) {
        setErro(
          `O ficheiro "${file.name}" não é uma imagem válida.`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErro(
          `A imagem "${file.name}" ultrapassa 5 MB.`
        );
        continue;
      }

      if (imagens.length + novas.length >= MAX_IMAGES) {
        setErro(
          `Pode adicionar no máximo ${MAX_IMAGES} imagens.`
        );
        break;
      }

      const url = URL.createObjectURL(file);

      urlsTemporarias.current.add(url);

      novas.push({
        id: crypto.randomUUID(),
        url,
        file,
        nova: true,
      });
    }

    if (novas.length > 0) {
      setImagens((anterior) => [
        ...anterior,
        ...novas,
      ]);

      if (!imagemPrincipal) {
        setImagemPrincipal(novas[0].url);
      }
    }

    if (inputImagem.current) {
      inputImagem.current.value = "";
    }
  }

  function removerImagem(id: string) {
    const imagemRemovida = imagens.find(
      (imagem) => imagem.id === id
    );

    if (!imagemRemovida) return;

    if (
      imagemRemovida.nova &&
      imagemRemovida.url.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagemRemovida.url);

      urlsTemporarias.current.delete(
        imagemRemovida.url
      );
    }

    const restantes = imagens.filter(
      (imagem) => imagem.id !== id
    );

    setImagens(restantes);

    if (imagemPrincipal === imagemRemovida.url) {
      setImagemPrincipal(restantes[0]?.url ?? "");
    }
  }

  function definirPrincipal(url: string) {
    setImagemPrincipal(url);
  }

  function moverImagem(
    index: number,
    direccao: -1 | 1
  ) {
    const destino = index + direccao;

    if (
      destino < 0 ||
      destino >= imagens.length
    ) {
      return;
    }

    setImagens((anterior) => {
      const copia = [...anterior];

      [copia[index], copia[destino]] = [
        copia[destino],
        copia[index],
      ];

      return copia;
    });
  }

  async function guardarProduto(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setErro("");

    if (!form.name.trim() || !form.categoryId) {
      setErro(
        "Preencha o nome e seleccione uma categoria."
      );
      return;
    }

    if (form.code.trim().length > 80) {
      setErro(
        "O código do componente não pode ultrapassar 80 caracteres."
      );
      return;
    }

    if (imagens.length === 0) {
      setErro(
        "Seleccione pelo menos uma imagem para o produto."
      );
      return;
    }

    if (imagens.length > MAX_IMAGES) {
      setErro(
        `O produto pode ter no máximo ${MAX_IMAGES} imagens.`
      );
      return;
    }

    if (
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      setErro("Introduza um preço válido.");
      return;
    }

    if (
      form.oldPrice &&
      (
        !Number.isFinite(Number(form.oldPrice)) ||
        Number(form.oldPrice) <= Number(form.price)
      )
    ) {
      setErro(
        "O preço anterior deve ser superior ao preço actual."
      );
      return;
    }

    // Garantir que existe uma imagem principal válida
    const indicePrincipal = imagens.findIndex(
      (imagem) => imagem.url === imagemPrincipal
    );

    if (indicePrincipal === -1) {
      setErro(
        "Seleccione uma imagem principal para o produto."
      );
      return;
    }

    try {
      setLoading(true);

      const dados = new FormData();

      // Dados gerais
      dados.append("code", form.code.trim().toUpperCase());
      dados.append("name", form.name.trim());

      dados.append(
        "description",
        form.description.trim()
      );

      dados.append("price", form.price);
      dados.append("oldPrice", form.oldPrice);

      // Disponibilidade booleana
      dados.append(
        "inStock",
        String(form.inStock)
      );

      dados.append("categoryId", form.categoryId);
      dados.append("featured", String(form.featured));
      dados.append("active", String(form.active));
      dados.append("promotion", String(form.promotion));

      // Criar sequência completa da galeria
      const novasImagens = imagens.filter(
        (
          imagem
        ): imagem is ImagemProduto & { file: File } =>
          imagem.nova && Boolean(imagem.file)
      );

      const indicesNovos = new Map<string, number>();

      novasImagens.forEach((imagem, index) => {
        indicesNovos.set(imagem.id, index);
      });

      const ordemImagens: ImagemOrdem[] = imagens.map(
        (imagem) => {
          if (imagem.nova) {
            const index = indicesNovos.get(imagem.id);

            if (index === undefined) {
              throw new Error(
                "Não foi possível identificar uma nova imagem."
              );
            }

            return {
              type: "new",
              index,
            };
          }

          return {
            type: "existing",
            url: imagem.url,
          };
        }
      );

      // Imagem principal pela posição actual
      dados.append(
        "mainImageIndex",
        String(indicePrincipal)
      );

      if (modoEdicao) {
        // Enviar ordem completa para PATCH
        dados.append(
          "imageOrder",
          JSON.stringify(ordemImagens)
        );

        // Enviar novos ficheiros
        novasImagens.forEach((imagem) => {
          dados.append("newImages", imagem.file);
        });
      } else {
        // Na criação, enviar todas as imagens
        // pela ordem definida pelo utilizador
        dados.append(
          "imageOrder",
          JSON.stringify(ordemImagens)
        );

        // A imagem principal deve ser enviada primeiro
        const principal = imagens[indicePrincipal];

        const restantes = imagens.filter(
          (imagem) => imagem.id !== principal.id
        );

        [principal, ...restantes].forEach((imagem) => {
          if (imagem.file) {
            dados.append("images", imagem.file);
          }
        });
      }

      const url = modoEdicao
        ? `/api/produtos/${produtoInicial!.id}`
        : "/api/produtos";

      const resposta = await fetch(url, {
        method: modoEdicao ? "PATCH" : "POST",
        body: dados,
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível guardar o produto."
        );
      }

      // Libertar previews temporárias
      urlsTemporarias.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      urlsTemporarias.current.clear();

      router.push("/admin/dashboard/produtos");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao guardar o produto."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={guardarProduto}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
    >
      {erro && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* Código do componente */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Código do componente
          </label>

          <input
            type="text"
            maxLength={80}
            value={form.code}
            onChange={(e) =>
              actualizar(
                "code",
                e.target.value.toUpperCase()
              )
            }
            placeholder="Ex.: ESP32-WROOM-32"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 uppercase outline-none focus:border-blue-500"
          />

          <p className="mt-1 text-xs text-gray-500">
            Referência única para identificar e pesquisar o componente.
          </p>
        </div>

        {/* Nome */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Nome do produto *
          </label>

          <input
            required
            value={form.name}
            onChange={(e) =>
              actualizar("name", e.target.value)
            }
            placeholder="Ex.: Arduino Mega 2560"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* Descrição */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Descrição
          </label>

          <textarea
            rows={4}
            value={form.description}
            onChange={(e) =>
              actualizar("description", e.target.value)
            }
            placeholder="Descrição do produto..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Categoria *
          </label>

          <select
            required
            value={form.categoryId}
            onChange={(e) =>
              actualizar("categoryId", e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">
              Seleccionar categoria
            </option>

            {categorias.map((categoria) => (
              <option
                key={categoria.id}
                value={categoria.id}
              >
                {categoria.name}
              </option>
            ))}
          </select>
        </div>

        {/* Disponibilidade */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Disponibilidade do produto
          </label>

          <button
            type="button"
            onClick={() =>
              actualizar("inStock", !form.inStock)
            }
            aria-pressed={form.inStock}
            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 transition ${
              form.inStock
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50"
            }`}
          >
            <span
              className={`text-sm font-semibold ${
                form.inStock
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {form.inStock
                ? "Disponível"
                : "Sem stock"}
            </span>

            <span
              className={`relative h-6 w-11 rounded-full transition ${
                form.inStock
                  ? "bg-green-600"
                  : "bg-red-500"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  form.inStock
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </span>
          </button>

          <p className="mt-2 text-xs text-gray-500">
            Controle manualmente se o produto pode ser
            adicionado ao carrinho.
          </p>
        </div>

        {/* Preço */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Preço actual (MT) *
          </label>

          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) =>
              actualizar("price", e.target.value)
            }
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* Preço anterior */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Preço anterior (MT)
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.oldPrice}
            onChange={(e) =>
              actualizar("oldPrice", e.target.value)
            }
            placeholder="Opcional"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* Galeria */}
        <div className="md:col-span-2">

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Galeria de imagens *
              </label>

              <p className="mt-1 text-xs text-gray-400">
                Seleccione até {MAX_IMAGES} imagens. Pode
                alterar a ordem e escolher a imagem principal.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {imagens.length}/{MAX_IMAGES} imagens
            </span>
          </div>

          <input
            ref={inputImagem}
            type="file"
            accept={TIPOS_PERMITIDOS.join(",")}
            multiple
            className="hidden"
            onChange={(e) =>
              seleccionarImagens(e.target.files)
            }
          />

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">

            {imagens.length > 0 ? (
              <>
                {/* Imagem principal */}
                {(() => {
                  const principal = imagens.find(
                    (imagem) =>
                      imagem.url === imagemPrincipal
                  );

                  return principal ? (
                    <div className="border-b border-gray-200 p-4">

                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
                          <Star
                            size={16}
                            fill="currentColor"
                          />
                          Imagem principal
                        </span>

                        <span className="text-xs text-gray-400">
                          Apresentada primeiro na loja
                        </span>
                      </div>

                      <div className="flex justify-center rounded-lg bg-white p-3">
                        <img
                          src={principal.url}
                          alt="Imagem principal do produto"
                          className="h-52 w-full max-w-md object-contain"
                        />
                      </div>

                    </div>
                  ) : null;
                })()}

                {/* Galeria manual */}
                <div className="p-4">

                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      Todas as imagens
                    </p>

                    <p className="text-xs text-gray-400">
                      Deslize horizontalmente
                    </p>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-3">

                    {imagens.map((imagem, index) => {
                      const principal =
                        imagem.url === imagemPrincipal;

                      return (
                        <div
                          key={imagem.id}
                          className={`relative w-36 shrink-0 overflow-hidden rounded-lg border-2 bg-white ${
                            principal
                              ? "border-green-500"
                              : "border-gray-200"
                          }`}
                        >

                          <button
                            type="button"
                            onClick={() =>
                              definirPrincipal(imagem.url)
                            }
                            className="block w-full text-left"
                          >
                            <div className="relative flex h-28 items-center justify-center bg-white">

                              <img
                                src={imagem.url}
                                alt={`Imagem ${index + 1}`}
                                className="h-full w-full object-contain"
                              />

                              {principal && (
                                <span className="absolute left-1 top-1 rounded bg-green-600 px-2 py-1 text-[10px] font-bold text-white">
                                  PRINCIPAL
                                </span>
                              )}

                            </div>

                            <div className="p-2">
                              <p className="truncate text-xs font-semibold text-gray-700">
                                Imagem {index + 1}
                              </p>

                              <p className="mt-1 text-[10px] text-blue-600">
                                {principal
                                  ? "Imagem seleccionada"
                                  : "Definir principal"}
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1">

                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() =>
                                moverImagem(index, -1)
                              }
                              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                              title="Mover para a esquerda"
                            >
                              ←
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removerImagem(imagem.id)
                              }
                              className="rounded p-1 text-red-500 hover:bg-red-50"
                              title="Remover imagem"
                            >
                              <X size={15} />
                            </button>

                            <button
                              type="button"
                              disabled={
                                index === imagens.length - 1
                              }
                              onClick={() =>
                                moverImagem(index, 1)
                              }
                              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                              title="Mover para a direita"
                            >
                              →
                            </button>

                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">

                <div className="mb-3 rounded-full bg-blue-100 p-4 text-blue-700">
                  <ImageIcon size={28} />
                </div>

                <p className="font-semibold text-gray-700">
                  Nenhuma imagem seleccionada
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Carregue imagens para apresentar o produto na loja.
                </p>

              </div>
            )}

            {/* Adicionar imagens */}
            <div className="border-t border-gray-200 p-4">

              <button
                type="button"
                disabled={imagens.length >= MAX_IMAGES}
                onClick={() =>
                  inputImagem.current?.click()
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-300 bg-white px-4 py-4 text-sm font-semibold text-blue-700 transition hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={18} />
                Adicionar imagens
              </button>

              <p className="mt-2 text-center text-xs text-gray-400">
                PNG, JPG, WEBP ou GIF · Máximo 5 MB por imagem
              </p>

            </div>
          </div>
        </div>
      </div>

      {/* Visibilidade */}
      <div className="space-y-5 border-t border-gray-100 pt-5">

        <h3 className="font-semibold text-gray-800">
          Visibilidade e apresentação do produto
        </h3>

        <div className="flex flex-wrap gap-6">

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                actualizar("active", e.target.checked)
              }
              className="h-4 w-4 accent-green-600"
            />
            Produto activo
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                actualizar("featured", e.target.checked)
              }
              className="h-4 w-4 accent-blue-600"
            />
            Produto em destaque
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold text-red-600">
            <input
              type="checkbox"
              checked={form.promotion}
              onChange={(e) =>
                actualizar("promotion", e.target.checked)
              }
              className="h-4 w-4 accent-red-600"
            />
            Activar promoção
          </label>

        </div>

        <p className="text-xs text-gray-500">
          O selo de promoção só será apresentado na loja quando esta opção estiver activa.
        </p>
      </div>

      {/* Acções */}
      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">

        <Link
          href="/admin/dashboard/produtos"
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-[#071B2D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d3452] disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              A guardar...
            </>
          ) : (
            <>
              <Save size={17} />
              {modoEdicao
                ? "Guardar alterações"
                : "Guardar produto"}
            </>
          )}
        </button>

      </div>
    </form>
  );
}
