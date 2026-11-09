
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  Plus,
  Search,
  Layers,
  Pencil,
  Trash2,
  X,
  Save,
  Package,
  RefreshCw,
  Power,
  Star,
  ChevronUp,
  ChevronDown,
  Check,
  GripVertical,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  showInNav: boolean;
  navOrder: number | null;
  _count: {
    products: number;
  };
}

const LIMITE_CATEGORIAS = 5;

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [nome, setNome] = useState("");

  const [editando, setEditando] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoBarra, setSalvandoBarra] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Categorias seleccionadas e ordenadas
  const categoriasSelecionadas = useMemo(() => {
    return categorias
      .filter((categoria) => categoria.showInNav)
      .sort(
        (a, b) =>
          (a.navOrder ?? 999) - (b.navOrder ?? 999)
      );
  }, [categorias]);

  // Carregar categorias
  const carregarCategorias = useCallback(async () => {
    try {
      setCarregando(true);

      const response = await fetch("/api/categorias", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível carregar as categorias."
        );
      }

      setCategorias(data);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar categorias."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  // Guardar a selecção e a ordem da barra
  const guardarBarra = async (categoryIds: string[]) => {
    if (categoryIds.length > LIMITE_CATEGORIAS) {
      setErro("A barra principal permite apenas 5 categorias.");
      return;
    }

    try {
      setSalvandoBarra(true);
      setErro("");
      setSucesso("");

      const response = await fetch("/api/categorias/barra", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erro ao actualizar a barra principal."
        );
      }

      await carregarCategorias();

      setSucesso("Barra principal actualizada com sucesso.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível actualizar a barra."
      );
    } finally {
      setSalvandoBarra(false);
    }
  };

  // Adicionar ou remover categoria da barra
  const alternarCategoriaBarra = async (categoria: Category) => {
    const selecionadas = categoriasSelecionadas.map(
      (item) => item.id
    );

    let novaSelecao: string[];

    if (categoria.showInNav) {
      // Permitir remover mesmo se estiver inactiva
      novaSelecao = selecionadas.filter(
        (id) => id !== categoria.id
      );
    } else {
      if (!categoria.active) {
        setErro("Não podes adicionar uma categoria inactiva.");
        return;
      }

      if (selecionadas.length >= LIMITE_CATEGORIAS) {
        setErro("Já existem 5 categorias na barra principal.");
        return;
      }

      novaSelecao = [...selecionadas, categoria.id];
    }

    await guardarBarra(novaSelecao);
  };

  // Alterar posição da categoria
  const moverCategoria = async (
    categoriaId: string,
    direcao: "up" | "down"
  ) => {
    const ids = categoriasSelecionadas.map(
      (categoria) => categoria.id
    );

    const index = ids.indexOf(categoriaId);

    if (index === -1) return;

    const novoIndex =
      direcao === "up" ? index - 1 : index + 1;

    if (novoIndex < 0 || novoIndex >= ids.length) return;

    [ids[index], ids[novoIndex]] = [
      ids[novoIndex],
      ids[index],
    ];

    await guardarBarra(ids);
  };

  // Abrir criação
  const abrirNovaCategoria = () => {
    setNome("");
    setEditando(null);
    setErro("");
    setModalAberto(true);
  };

  // Abrir edição
  const abrirEdicao = (categoria: Category) => {
    setNome(categoria.name);
    setEditando(categoria.id);
    setErro("");
    setModalAberto(true);
  };

  // Criar ou editar categoria
  const salvarCategoria = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!nome.trim()) {
      setErro("O nome da categoria é obrigatório.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const response = await fetch(
        editando
          ? `/api/categorias/${editando}`
          : "/api/categorias",
        {
          method: editando ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: nome.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erro ao guardar categoria."
        );
      }

      setModalAberto(false);
      setNome("");
      setEditando(null);

      await carregarCategorias();

      setSucesso(
        editando
          ? "Categoria actualizada com sucesso."
          : "Categoria criada com sucesso."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar."
      );
    } finally {
      setSalvando(false);
    }
  };

  // Activar ou desactivar
  const alterarEstado = async (categoria: Category) => {
    try {
      setErro("");
      setSucesso("");

      const response = await fetch(
        `/api/categorias/${categoria.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            active: !categoria.active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erro ao alterar estado."
        );
      }

      await carregarCategorias();

      setSucesso(
        categoria.active
          ? "Categoria desactivada. A selecção da barra foi preservada."
          : "Categoria activada novamente."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao alterar estado."
      );
    }
  };

  // Eliminar categoria
  const eliminarCategoria = async (categoria: Category) => {
    const confirmar = window.confirm(
      `Desejas realmente eliminar a categoria "${categoria.name}"?`
    );

    if (!confirmar) return;

    try {
      setErro("");
      setSucesso("");

      const response = await fetch(
        `/api/categorias/${categoria.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erro ao eliminar categoria."
        );
      }

      await carregarCategorias();

      setSucesso("Categoria eliminada com sucesso.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível eliminar."
      );
    }
  };

  // Pesquisa
  const categoriasFiltradas = categorias.filter(
    (categoria) =>
      categoria.name
        .toLowerCase()
        .includes(pesquisa.toLowerCase())
  );

  const totalProdutos = categorias.reduce(
    (total, categoria) =>
      total + categoria._count.products,
    0
  );

  return (
    <div className="space-y-7">

      {/* CABEÇALHO */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#071B2D]">
            Gestão de categorias
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Organize os produtos e a navegação da loja MSW TECH.
          </p>
        </div>

        <button
          onClick={abrirNovaCategoria}
          className="flex items-center gap-2 rounded-xl bg-[#071B2D] px-5 py-3 font-semibold text-white transition hover:bg-cyan-600"
        >
          <Plus size={19} />
          Nova categoria
        </button>
      </div>

      {/* MENSAGENS */}
      {erro && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{erro}</span>

          <button onClick={() => setErro("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {sucesso && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <span>{sucesso}</span>

          <button onClick={() => setSucesso("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* INDICADORES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Layers size={23} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total de categorias
              </p>

              <h3 className="text-2xl font-black text-[#071B2D]">
                {categorias.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <Power size={23} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Categorias activas
              </p>

              <h3 className="text-2xl font-black text-[#071B2D]">
                {categorias.filter((c) => c.active).length}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Package size={23} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Produtos associados
              </p>

              <h3 className="text-2xl font-black text-[#071B2D]">
                {totalProdutos}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* GESTÃO DA BARRA PRINCIPAL */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">

        <div className="border-b border-gray-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <div className="flex items-center gap-2">
                <Star size={20} className="text-cyan-600" />

                <h3 className="font-bold text-[#071B2D]">
                  Barra principal da loja
                </h3>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Escolha até 5 categorias para destacar na navegação.
              </p>
            </div>

            <span className="rounded-xl bg-[#071B2D] px-4 py-2 text-sm font-bold text-white">
              {categoriasSelecionadas.length}/{LIMITE_CATEGORIAS}
            </span>
          </div>

          {/* PROGRESSO */}
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs text-gray-500">
              <span>Espaços utilizados</span>

              <span>
                {categoriasSelecionadas.length} de {LIMITE_CATEGORIAS}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                style={{
                  width: `${
                    (categoriasSelecionadas.length /
                      LIMITE_CATEGORIAS) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* CATEGORIAS SELECCIONADAS */}
        <div className="p-5">

          {categoriasSelecionadas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <Star
                size={30}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 font-semibold text-gray-600">
                Nenhuma categoria seleccionada.
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Adicione categorias na tabela abaixo.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {categoriasSelecionadas.map(
                (categoria, index) => (
                  <div
                    key={categoria.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-cyan-300"
                  >
                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                        <GripVertical size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#071B2D]">
                          {categoria.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          Posição {index + 1}
                          {!categoria.active && (
                            <span className="ml-2 text-orange-600">
                              · Inactiva
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">

                      <span
                        className={`hidden rounded-full px-2 py-1 text-xs font-semibold sm:inline-block ${
                          categoria.active
                            ? "bg-green-50 text-green-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {categoria.active ? "Activa" : "Inactiva"}
                      </span>

                      <button
                        onClick={() =>
                          moverCategoria(categoria.id, "up")
                        }
                        disabled={
                          salvandoBarra ||
                          index === 0
                        }
                        title="Mover para cima"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronUp size={17} />
                      </button>

                      <button
                        onClick={() =>
                          moverCategoria(categoria.id, "down")
                        }
                        disabled={
                          salvandoBarra ||
                          index === categoriasSelecionadas.length - 1
                        }
                        title="Mover para baixo"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronDown size={17} />
                      </button>

                      <button
                        onClick={() =>
                          alternarCategoriaBarra(categoria)
                        }
                        disabled={salvandoBarra}
                        title="Remover da barra"
                        className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {salvandoBarra && (
            <p className="mt-3 flex items-center gap-2 text-xs text-cyan-700">
              <RefreshCw size={14} className="animate-spin" />
              A actualizar a barra principal...
            </p>
          )}
        </div>
      </section>

      {/* PESQUISA */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4">

        <div className="relative min-w-[220px] flex-1">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar categoria..."
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-500"
          />
        </div>

        <button
          onClick={carregarCategorias}
          disabled={carregando}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={carregando ? "animate-spin" : ""}
          />
          Actualizar
        </button>
      </div>

      {/* TABELA DE CATEGORIAS */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">

        <div className="border-b border-gray-100 p-5">
          <h3 className="font-bold text-[#071B2D]">
            Categorias registadas
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Seleccione as categorias que pretende apresentar na barra principal.
          </p>
        </div>

        {carregando ? (
          <div className="p-12 text-center text-gray-500">
            A carregar categorias...
          </div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <Layers
              size={40}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 font-semibold text-gray-600">
              Nenhuma categoria encontrada.
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Crie a primeira categoria da sua loja.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">
                    Nome da categoria
                  </th>

                  <th className="px-5 py-4">
                    Produtos
                  </th>

                  <th className="px-5 py-4">
                    Estado
                  </th>

                  <th className="px-5 py-4">
                    Barra principal
                  </th>

                  <th className="px-5 py-4 text-right">
                    Acções
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {categoriasFiltradas.map((categoria) => (
                  <tr
                    key={categoria.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-[#071B2D]">
                          {categoria.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          {categoria.slug}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {categoria._count.products} produtos
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          categoria.active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {categoria.active
                          ? "Activa"
                          : "Inactiva"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() =>
                          alternarCategoriaBarra(categoria)
                        }
                        disabled={
                          salvandoBarra ||
                          (!categoria.active &&
                            !categoria.showInNav) ||
                          (!categoria.showInNav &&
                            categoriasSelecionadas.length >=
                              LIMITE_CATEGORIAS)
                        }
                        className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          categoria.showInNav
                            ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
                            : "border border-gray-200 text-gray-600 hover:border-cyan-400 hover:text-cyan-700"
                        }`}
                      >
                        {categoria.showInNav ? (
                          <>
                            <Check size={15} />
                            Na barra
                          </>
                        ) : (
                          <>
                            <Plus size={15} />
                            Adicionar
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => abrirEdicao(categoria)}
                          title="Editar"
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => alterarEstado(categoria)}
                          title={
                            categoria.active
                              ? "Desactivar"
                              : "Activar"
                          }
                          className="rounded-lg bg-orange-50 p-2 text-orange-600 hover:bg-orange-100"
                        >
                          <Power size={17} />
                        </button>

                        <button
                          onClick={() =>
                            eliminarCategoria(categoria)
                          }
                          title="Eliminar"
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h3 className="text-lg font-bold text-[#071B2D]">
                  {editando
                    ? "Editar categoria"
                    : "Nova categoria"}
                </h3>

                <p className="text-xs text-gray-500">
                  Introduza o nome da categoria.
                </p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={salvarCategoria}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Nome da categoria *
                </label>

                <input
                  required
                  autoFocus
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Sensores de entrada"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </div>

              {erro && (
                <p className="text-sm text-red-600">
                  {erro}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#071B2D] py-3 font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"
                >
                  <Save size={18} />

                  {salvando ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
