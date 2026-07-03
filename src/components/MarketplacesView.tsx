import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Search, RefreshCw, X, AlertCircle } from "lucide-react";
import api from "../api";
import { Marketplace } from "../types";

export default function MarketplacesView() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal & Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingMarketplace, setEditingMarketplace] = useState<Marketplace | null>(null);
  const [nome, setNome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchMarketplaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/marketplaces", { params: { search } });
      const sorted = res.data.sort((a: Marketplace, b: Marketplace) => a.nome.localeCompare(b.nome));
      setMarketplaces(sorted);
      setCurrentPage(1);
    } catch (err: any) {
      setError("Erro ao carregar lista de marketplaces.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaces();
  }, [search]);

  const handleOpen = (mkt: Marketplace | null = null) => {
    setError(null);
    if (mkt) {
      setEditingMarketplace(mkt);
      setNome(mkt.nome);
    } else {
      setEditingMarketplace(null);
      setNome("");
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingMarketplace(null);
    setNome("");
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError("O nome do marketplace é obrigatório.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      if (editingMarketplace) {
        // Edit
        await api.put(`/marketplaces/${editingMarketplace.id}`, { nome });
      } else {
        // Add
        await api.post("/marketplaces", { nome });
      }
      fetchMarketplaces();
      handleClose();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro ao salvar marketplace.");
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
      await api.delete(`/marketplaces/${deleteConfirmId}`);
      fetchMarketplaces();
      setDeleteConfirmId(null);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError("Não é possível excluir este marketplace pois há pedidos vinculados a ele.");
      }
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(marketplaces.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = marketplaces.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar marketplace..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={() => handleOpen()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Novo Marketplace
        </button>
      </div>

      {/* Main marketplaces list container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-slate-500 text-sm font-medium">Buscando marketplaces...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4 pl-6">Nome do Marketplace</th>
                    <th className="p-4 pr-6 text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 group">
                      <td className="p-4 pl-6 text-slate-800 font-semibold">{item.nome}</td>
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
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-12 text-center text-slate-400 italic">
                        Nenhum marketplace faturado ou registrado.
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
                  Página {currentPage} de {totalPages} ({marketplaces.length} registros)
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
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">
                {editingMarketplace ? "Editar Marketplace" : "Novo Marketplace"}
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

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nome do Canal de Marketplace
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mercado Livre, Shopee, Amazon"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                  required
                />
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
                  {saving ? "Salvando..." : "Salvar Marketplace"}
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
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Confirmar Exclusão</h3>
            </div>
            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{deleteError}</p>
                </div>
              )}
              <p className="text-sm text-slate-600">
                Deseja realmente excluir este marketplace? Esta ação não poderá ser desfeita e pode falhar se houver pedidos vinculados a ele.
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
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
