import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Search, RefreshCw, X, AlertCircle, Package } from "lucide-react";
import api from "../api";
import { Product, Category } from "../types";

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState<"nome" | "custo" | "estoque" | "categoria">("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal & Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [nome, setNome] = useState("");
  const [custo, setCusto] = useState("");
  const [quantidadeEstoque, setQuantidadeEstoque] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories")
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setCurrentPage(1);
    } catch (err: any) {
      setError("Erro ao carregar dados do catálogo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const handleOpen = (product: Product | null = null) => {
    setError(null);
    if (product) {
      setEditingProduct(product);
      setNome(product.nome);
      setCusto(product.custo.toString());
      setQuantidadeEstoque(product.quantidadeEstoque.toString());
      setCategoriaId(product.categoriaId.toString());
    } else {
      setEditingProduct(null);
      setNome("");
      setCusto("");
      setQuantidadeEstoque("");
      setCategoriaId(categories.length > 0 ? categories[0].id.toString() : "");
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingProduct(null);
    setNome("");
    setCusto("");
    setQuantidadeEstoque("");
    setCategoriaId("");
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!nome.trim()) return setError("O nome do produto é obrigatório.");
    if (parseFloat(custo) < 0) return setError("O custo do produto não pode ser negativo.");
    if (parseInt(quantidadeEstoque) < 0) return setError("A quantidade em estoque não pode ser negativa.");
    if (!categoriaId) return setError("Por favor, selecione uma categoria válida.");

    setError(null);
    setSaving(true);

    const payload = {
      nome: nome.trim(),
      custo: parseFloat(custo),
      quantidadeEstoque: parseInt(quantidadeEstoque),
      categoriaId: parseInt(categoriaId)
    };

    try {
      if (editingProduct) {
        // Edit
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        // Create
        await api.post("/products", payload);
      }
      fetchProductsAndCategories();
      handleClose();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro ao salvar dados do produto.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteError(null);
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setDeleteError(null);
    try {
      await api.delete(`/products/${deleteConfirmId}`);
      fetchProductsAndCategories();
      setDeleteConfirmId(null);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError("Não é possível remover este produto pois existem vendas registradas vinculadas a ele.");
      }
    }
  };

  // Filter & Search Logic on client side
  let filteredProducts = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory ? p.categoriaId === parseInt(selectedCategory) : true;
    return matchesSearch && matchesCat;
  });

  // Sort Logic
  filteredProducts.sort((a, b) => {
    let fieldA: any = a.nome.toLowerCase();
    let fieldB: any = b.nome.toLowerCase();

    if (sortBy === "custo") {
      fieldA = a.custo;
      fieldB = b.custo;
    } else if (sortBy === "estoque") {
      fieldA = a.quantidadeEstoque;
      fieldB = b.quantidadeEstoque;
    } else if (sortBy === "categoria") {
      fieldA = (a.categoriaNome || "").toLowerCase();
      fieldB = (b.categoriaNome || "").toLowerCase();
    }

    if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Block */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-5 rounded-2xl border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Filtrar por Categoria (Todas)</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          {/* Sorting filter selector */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all flex-1"
            >
              <option value="nome">Ordenar por Nome</option>
              <option value="custo">Ordenar por Custo</option>
              <option value="estoque">Ordenar por Estoque</option>
              <option value="categoria">Ordenar por Categoria</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="px-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition-all flex items-center justify-center"
              title="Alternar ordem"
            >
              {sortOrder === "asc" ? "▲" : "▼"}
            </button>
          </div>
        </div>

        <button
          onClick={() => handleOpen()}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/10 active:scale-98"
        >
          <Plus className="w-4.5 h-4.5" />
          Novo Produto
        </button>
      </div>

      {/* Main Table Grid Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-slate-500 text-sm font-medium">Buscando catálogo de produtos...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4 pl-6">Nome do SKU</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4 text-right">Custo Unitário</th>
                    <th className="p-4 text-center">Qtd Estoque</th>
                    <th className="p-4 pr-6 text-right w-32">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {currentItems.map((item) => {
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4 pl-6 text-slate-800 font-semibold">{item.nome}</td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                            {item.categoriaNome}
                          </span>
                        </td>
                        <td className="p-4 text-right text-indigo-950 font-mono font-bold">
                          {formatBRL(item.custo)}
                        </td>
                        <td className="p-4 text-center text-slate-600 font-mono">{item.quantidadeEstoque} un</td>
                        <td className="p-4 pr-6 text-right space-x-1">
                          <button
                            onClick={() => handleOpen(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all inline-flex items-center"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all inline-flex items-center"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                        Nenhum produto cadastrado no catálogo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Página {currentPage} de {totalPages} ({filteredProducts.length} registros)
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit modal popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">
                {editingProduct ? "Editar SKU do Produto" : "Novo SKU de Produto"}
              </h3>
              <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-100 p-3.5 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Smartphone Android 128GB"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Categoria Select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Categoria Vinculada
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                  required
                >
                  <option value="">Selecione a Categoria...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              {/* Price / Stock row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cost Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={custo}
                    onChange={(e) => setCusto(e.target.value)}
                    placeholder="Ex: 150.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* Stock Qty */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Quantidade em Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantidadeEstoque}
                    onChange={(e) => setQuantidadeEstoque(e.target.value)}
                    placeholder="Ex: 50"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar SKU"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Confirmar Remoção</h3>
            </div>
            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{deleteError}</p>
                </div>
              )}
              <p className="text-sm text-slate-600">
                Deseja realmente remover este produto do catálogo? Esta ação não poderá ser desfeita e pode falhar se houver vendas registradas a ele.
              </p>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10"
                >
                  Sim, Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
