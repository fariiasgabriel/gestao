import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw, 
  X, 
  AlertCircle, 
  ShoppingCart, 
  DollarSign, 
  Calculator,
  ArrowRight,
  TrendingUp,
  Tag,
  Clock,
  Calendar,
  Edit,
  Trash
} from "lucide-react";
import api from "../api";
import { Order, OrderItem, Product, Category, Marketplace } from "../types";

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filterMarketplace, setFilterMarketplace] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Modal & Form State
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Active items in the order being created/edited
  const [itemsList, setItemsList] = useState<any[]>([]);

  // Item Form Inputs
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valorVenda, setValorVenda] = useState("");

  // Order Form Inputs
  const [marketplaceId, setMarketplaceId] = useState("");
  const [comissaoTipo, setComissaoTipo] = useState<"PERCENTUAL" | "VALOR">("PERCENTUAL");
  const [comissaoInformada, setComissaoInformada] = useState("");
  const [frete, setFrete] = useState("0");
  const [taxaFixa, setTaxaFixa] = useState("0");

  // Selected product meta for item-form prefills
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, prodRes, mktRes] = await Promise.all([
        api.get("/orders", {
          params: {
            marketplaceId: filterMarketplace || undefined,
            categoryId: filterCategory || undefined,
            produtoId: filterProduct || undefined,
            startDate: filterStartDate ? new Date(filterStartDate).toISOString() : undefined,
            endDate: filterEndDate ? new Date(filterEndDate).toISOString() : undefined
          }
        }),
        api.get("/products"),
        api.get("/marketplaces")
      ]);
      setOrders(orderRes.data);
      setProducts(prodRes.data);
      setMarketplaces(mktRes.data);
    } catch (err: any) {
      setError("Erro ao sincronizar dados operacionais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMarketplace, filterCategory, filterProduct, filterStartDate, filterEndDate]);

  // Handle selected product prefill
  const handleProductChange = (prodId: string) => {
    setProdutoId(prodId);
    if (prodId) {
      const prod = products.find(p => p.id === parseInt(prodId)) || null;
      setSelectedProduct(prod);
    } else {
      setSelectedProduct(null);
    }
  };

  const handleOpen = () => {
    setError(null);
    setEditingOrder(null);
    setItemsList([]);
    setProdutoId("");
    setMarketplaceId("");
    setQuantidade("1");
    setValorVenda("");
    setComissaoTipo("PERCENTUAL");
    setComissaoInformada("");
    setFrete("0");
    setTaxaFixa("0");
    setSelectedProduct(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setEditingOrder(null);
    setItemsList([]);
  };

  // Calculate available stock considering stornos if editing
  const getAvailableStock = (prod: Product) => {
    if (!prod) return 0;
    let stock = prod.quantidadeEstoque;
    if (editingOrder && editingOrder.items) {
      const originalItem = editingOrder.items.find((item: any) => item.produtoId === prod.id);
      if (originalItem) {
        stock += originalItem.quantidade;
      }
    }
    return stock;
  };

  // Add item to active list
  const handleAddItem = () => {
    if (!selectedProduct) {
      setError("Por favor, selecione um produto para adicionar.");
      return;
    }
    const qty = parseInt(quantidade);
    if (isNaN(qty) || qty <= 0) {
      setError("A quantidade deve ser maior que zero.");
      return;
    }
    const val = parseFloat(valorVenda);
    if (isNaN(val) || val < 0) {
      setError("O valor de venda não pode ser negativo.");
      return;
    }

    // Check stock
    const existingQty = itemsList
      .filter(item => item.produtoId === selectedProduct.id)
      .reduce((sum, item) => sum + item.quantidade, 0);

    const totalNeeded = existingQty + qty;
    const allowedStock = getAvailableStock(selectedProduct);

    if (allowedStock < totalNeeded) {
      setError(`Estoque insuficiente. Estoque disponível: ${allowedStock} un. (Você já adicionou ${existingQty} un. ao pedido)`);
      return;
    }

    setError(null);

    // Merge or add
    const existingIndex = itemsList.findIndex(item => item.produtoId === selectedProduct.id);
    if (existingIndex !== -1) {
      const updated = [...itemsList];
      updated[existingIndex].quantidade += qty;
      updated[existingIndex].valorVenda = Number((updated[existingIndex].valorVenda + val).toFixed(2));
      setItemsList(updated);
    } else {
      setItemsList([...itemsList, {
        produtoId: selectedProduct.id,
        quantidade: qty,
        valorVenda: val,
        produtoNome: selectedProduct.nome,
        produtoCusto: selectedProduct.custo
      }]);
    }

    // Reset item configuration fields
    setProdutoId("");
    setQuantidade("1");
    setValorVenda("");
    setSelectedProduct(null);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...itemsList];
    updated.splice(index, 1);
    setItemsList(updated);
  };

  // Real-time calculation helpers for form summary display
  const getPreviewFinancials = () => {
    if (itemsList.length === 0) return null;

    const fFreight = parseFloat(frete) || 0;
    const fTaxa = parseFloat(taxaFixa) || 0;
    const commInfo = parseFloat(comissaoInformada) || 0;

    let totalVendaCalc = itemsList.reduce((sum, item) => sum + item.valorVenda, 0);
    let totalCustoCalc = itemsList.reduce((sum, item) => sum + (item.produtoCusto * item.quantidade), 0);

    let comissaoValor = 0;
    if (comissaoTipo === "PERCENTUAL") {
      comissaoValor = Number(((commInfo / 100) * totalVendaCalc).toFixed(2));
    } else {
      comissaoValor = commInfo;
    }

    const lucroBruto = Number((totalVendaCalc - fFreight - fTaxa - comissaoValor).toFixed(2));
    const lucroLiquido = Number((lucroBruto - totalCustoCalc).toFixed(2));
    const margemBruta = totalVendaCalc > 0 ? Number(((lucroBruto / totalVendaCalc) * 100).toFixed(2)) : 0;
    const margemLiquida = totalVendaCalc > 0 ? Number(((lucroLiquido / totalVendaCalc) * 100).toFixed(2)) : 0;

    return { totalVendaCalc, totalCustoCalc, comissaoValor, lucroBruto, lucroLiquido, margemBruta, margemLiquida };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemsList.length === 0) {
      return setError("Por favor, adicione pelo menos um produto ao pedido.");
    }
    if (!marketplaceId) {
      return setError("Por favor, selecione um marketplace.");
    }

    const fFreight = parseFloat(frete);
    if (isNaN(fFreight) || fFreight < 0) return setError("O frete não pode ser negativo.");

    const fTaxa = parseFloat(taxaFixa);
    if (isNaN(fTaxa) || fTaxa < 0) return setError("A taxa fixa não pode ser negativa.");

    const commInfo = parseFloat(comissaoInformada);
    if (isNaN(commInfo) || commInfo < 0) return setError("O valor informado para comissão não pode ser negativo.");

    setError(null);
    setSaving(true);

    const payload = {
      items: itemsList.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        valorVenda: item.valorVenda
      })),
      marketplaceId: parseInt(marketplaceId),
      comissaoTipo,
      comissaoInformada: commInfo,
      frete: fFreight,
      taxaFixa: fTaxa
    };

    try {
      if (editingOrder) {
        await api.put(`/orders/${editingOrder.id}`, payload);
      } else {
        await api.post("/orders", payload);
      }
      loadData();
      handleClose();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro ao registrar pedido.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (order: Order) => {
    setError(null);
    setEditingOrder(order);
    setMarketplaceId(String(order.marketplaceId));
    setComissaoTipo(order.comissaoTipo);
    setComissaoInformada(String(order.comissaoInformada));
    setFrete(String(order.frete));
    setTaxaFixa(String(order.taxaFixa));

    const orderItems = order.items || [];
    setItemsList(orderItems.map((item: any) => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      valorVenda: item.valorVenda,
      produtoNome: item.produtoNome || "Produto Removido",
      produtoCusto: item.produtoCusto || 0
    })));

    setProdutoId("");
    setQuantidade("1");
    setValorVenda("");
    setSelectedProduct(null);

    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteError(null);
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setDeleteError(null);
    try {
      await api.delete(`/orders/${deleteConfirmId}`);
      loadData();
      setDeleteConfirmId(null);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError("Erro ao tentar estornar pedido.");
      }
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  const preview = getPreviewFinancials();

  return (
    <div className="space-y-6">
      {/* Filters toolbar panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Filtros Avançados de Busca</h4>
          <button
            onClick={handleOpen}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Lançar Pedido
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Marketplace Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Marketplace</label>
            <select
              value={filterMarketplace}
              onChange={(e) => setFilterMarketplace(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:bg-white focus:outline-none transition-all"
            >
              <option value="">Todos</option>
              {marketplaces.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Produto SKU</label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:bg-white focus:outline-none transition-all"
            >
              <option value="">Todos</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Period - Start */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">De (Início)</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Period - End */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Até (Fim)</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Reset Filters button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterMarketplace("");
                setFilterCategory("");
                setFilterProduct("");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Main Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-slate-500 text-sm font-medium">Buscando lançamentos...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4 pl-6">Data Pedido</th>
                    <th className="p-4">SKU / Produto</th>
                    <th className="p-4">Marketplace</th>
                    <th className="p-4 text-center">Itens / Qtd</th>
                    <th className="p-4 text-right">Valor Venda</th>
                    <th className="p-4 text-right">Faturamento Líquido</th>
                    <th className="p-4 text-right">Margem Líq.</th>
                    <th className="p-4 pr-6 text-right w-28">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {currentItems.map((item) => {
                    const totalQty = item.items?.reduce((sum, i) => sum + i.quantidade, 0) || item.quantidade;
                    const itemsCount = item.items?.length || 1;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4 pl-6 text-slate-500 font-mono">
                          {new Date(item.dataPedido).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-slate-800">{item.produtoNome}</p>
                            {item.items && item.items.length > 0 ? (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.items.map(i => `${i.produtoNome} (x${i.quantidade})`).join(", ")}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">Custo Un: {formatBRL(item.produtoCusto || 0)}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-bold text-[10px]">
                            {item.marketplaceNome}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono">
                          <div className="text-slate-700 font-bold">{totalQty} un</div>
                          <div className="text-[9px] text-slate-400">{itemsCount} SKU(s)</div>
                        </td>
                        <td className="p-4 text-right text-indigo-950 font-mono font-bold">
                          {formatBRL(item.valorVenda)}
                        </td>
                        <td className={`p-4 text-right font-mono font-semibold ${item.lucroLiquido >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                          {formatBRL(item.lucroLiquido)}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.margemLiquida >= 15 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            item.margemLiquida >= 5 ? "bg-blue-50 text-blue-700 border border-blue-100" :
                            item.margemLiquida >= 0 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-red-50 text-red-700 border border-red-100"
                          }`}>
                            {item.margemLiquida}%
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right space-x-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all inline-flex items-center"
                            title="Editar Pedido"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all inline-flex items-center"
                            title="Estornar Pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                        Nenhum pedido encontrado para as chaves de filtro selecionadas.
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
                  Página {currentPage} de {totalPages} ({orders.length} registros)
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

      {/* Launcher Order Modal popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl border border-slate-100 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-indigo-600">
                <ShoppingCart className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                  {editingOrder ? `Editar Pedido #${editingOrder.id}` : "Novo Lançamento de Pedido"}
                </h3>
              </div>
              <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* INPUT FIELDS SECTION */}
              <div className="lg:col-span-7 space-y-6">
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-100 p-3.5 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {/* STEP 1: Add items to order */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-xs uppercase text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 inline-flex items-center justify-center text-[10px]">1</span>
                    Adicionar Itens ao Pedido
                  </h4>

                  {/* Product Config Row */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Selecione o Produto SKU *
                      </label>
                      <select
                        value={produtoId}
                        onChange={(e) => handleProductChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Escolha um SKU do catálogo...</option>
                        {products.map(p => {
                          const stock = getAvailableStock(p);
                          return (
                            <option key={p.id} value={p.id}>
                              {p.nome} (Estoque real: {stock} un | Custo: {formatBRL(p.custo)})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {selectedProduct && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Qtd a Lançar *</label>
                          <input
                            type="number"
                            min="1"
                            max={getAvailableStock(selectedProduct)}
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Preço Total de Venda (R$) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={valorVenda}
                            onChange={(e) => setValorVenda(e.target.value)}
                            placeholder="Ex: 120.00"
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs mt-1"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-lg text-xs transition-all active:scale-95"
                          >
                            Incluir Item
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Added Items List Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-100 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                      <span>Lista de Itens Incluídos</span>
                      <span>{itemsList.length} SKU(s)</span>
                    </div>

                    {itemsList.length === 0 ? (
                      <p className="p-4 text-xs italic text-slate-400 text-center">
                        Nenhum item adicionado ao pedido ainda. Escolha um produto acima e clique em "Incluir Item".
                      </p>
                    ) : (
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-100 text-[10px]">
                            <th className="p-2.5 pl-4">Produto</th>
                            <th className="p-2.5 text-center">Qtd</th>
                            <th className="p-2.5 text-right">Valor Venda</th>
                            <th className="p-2.5 text-right">Subtotal</th>
                            <th className="p-2.5 text-center w-12">Remover</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {itemsList.map((item, index) => {
                            const prod = products.find(p => p.id === item.produtoId);
                            const allowedStock = prod ? getAvailableStock(prod) : 999999;
                            
                            return (
                              <tr key={index} className="hover:bg-slate-50/30">
                                <td className="p-2 pl-4 truncate max-w-xs align-middle">
                                  <div className="font-bold text-slate-800">{item.produtoNome}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">Disponível: {allowedStock} un</div>
                                </td>
                                <td className="p-2 text-center align-middle">
                                  <input
                                    type="number"
                                    min="1"
                                    max={allowedStock}
                                    value={item.quantidade}
                                    onChange={(e) => {
                                      const qty = parseInt(e.target.value) || 1;
                                      if (qty > allowedStock) {
                                        setError(`Quantidade solicitada (${qty}) para "${item.produtoNome}" excede o estoque disponível (${allowedStock} un).`);
                                        return;
                                      }
                                      setError(null);
                                      const updated = [...itemsList];
                                      updated[index].quantidade = qty;
                                      setItemsList(updated);
                                    }}
                                    className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono bg-slate-50 text-slate-800 font-bold inline-block"
                                  />
                                </td>
                                <td className="p-2 text-right align-middle font-mono text-slate-500">
                                  {formatBRL(item.valorVenda / item.quantidade)}/un
                                </td>
                                <td className="p-2 text-right align-middle">
                                  <div className="flex items-center justify-end gap-1 font-mono">
                                    <span className="text-slate-400 text-[10px]">R$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.valorVenda}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setError(null);
                                        const updated = [...itemsList];
                                        updated[index].valorVenda = val;
                                        setItemsList(updated);
                                      }}
                                      className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-900 font-bold"
                                    />
                                  </div>
                                </td>
                                <td className="p-2 text-center align-middle">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all inline-flex items-center justify-center border border-red-100 bg-red-50/50"
                                    title="Excluir produto do pedido"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* STEP 2: General Order Config */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-xs uppercase text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 inline-flex items-center justify-center text-[10px]">2</span>
                    Logística & Canais Financeiros
                  </h4>

                  {/* Marketplace Select */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Canal Marketplace de Destino *
                    </label>
                    <select
                      value={marketplaceId}
                      onChange={(e) => setMarketplaceId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Selecione o canal de marketplace...</option>
                      {marketplaces.map(m => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Commission Mode and Value */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Tipo de Comissão
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="comissaoTipo"
                            checked={comissaoTipo === "PERCENTUAL"}
                            onChange={() => setComissaoTipo("PERCENTUAL")}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          ○ Percentual (%)
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="comissaoTipo"
                            checked={comissaoTipo === "VALOR"}
                            onChange={() => setComissaoTipo("VALOR")}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          ○ Valor Fixo (R$)
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {comissaoTipo === "PERCENTUAL" ? "Alíquota (%) *" : "Valor de Comissão (R$) *"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={comissaoInformada}
                        onChange={(e) => setComissaoInformada(e.target.value)}
                        placeholder={comissaoTipo === "PERCENTUAL" ? "Ex: 16" : "Ex: 45.00"}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Freight and Fixed Fee Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Frete Pago (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={frete}
                        onChange={(e) => setFrete(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Taxa Fixa do Canal (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={taxaFixa}
                        onChange={(e) => setTaxaFixa(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* REAL-TIME PREVIEW ACCORDION (RIGHT SIDEBAR) */}
              <div className="lg:col-span-5 bg-slate-900 text-slate-100 p-6 rounded-2xl flex flex-col justify-between border border-slate-800 shadow-inner">
                <div>
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <Calculator className="w-5 h-5 animate-pulse" />
                    <h4 className="font-extrabold text-xs uppercase tracking-wider">Simulador de Resultado Real</h4>
                  </div>
                  
                  {!preview ? (
                    <div className="text-center py-12 text-slate-500 text-xs italic space-y-2">
                      <p>Adicione pelo menos um SKU à lista para iniciar as simulações financeiras em tempo real.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Cost breakdown */}
                      <div className="border-b border-slate-800 pb-3 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Faturamento Bruto</span>
                          <span className="font-mono font-bold text-slate-200">{formatBRL(preview.totalVendaCalc)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Comissão Calculada</span>
                          <span className="font-mono text-red-400">-{formatBRL(preview.comissaoValor)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Frete Descontado</span>
                          <span className="font-mono text-red-400">-{formatBRL(parseFloat(frete) || 0)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Taxa Fixa Canal</span>
                          <span className="font-mono text-red-400">-{formatBRL(parseFloat(taxaFixa) || 0)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Custo de Aquisição (COGS)</span>
                          <span className="font-mono text-slate-400">-{formatBRL(preview.totalCustoCalc)}</span>
                        </div>
                      </div>

                      {/* Calculations outputs */}
                      <div className="space-y-3.5">
                        {/* Lucro Bruto */}
                        <div className="flex justify-between items-center bg-slate-850/80 p-3 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Lucro Bruto</span>
                            <span className="text-[9px] text-slate-500 block">Antes do custo do produto</span>
                          </div>
                          <span className="text-sm font-extrabold text-indigo-400 font-mono">{formatBRL(preview.lucroBruto)}</span>
                        </div>

                        {/* Lucro Liquido */}
                        <div className="flex justify-between items-center bg-emerald-950/25 p-3 rounded-xl border border-emerald-900/40">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Lucro Líquido Real</span>
                            <span className="text-[9px] text-emerald-500 block">Resultado líquido operacional</span>
                          </div>
                          <span className="text-base font-extrabold text-emerald-400 font-mono">{formatBRL(preview.lucroLiquido)}</span>
                        </div>

                        {/* Margens progress readout */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-slate-850/50 p-2.5 rounded-xl text-center border border-slate-800">
                            <span className="text-[9px] uppercase text-slate-400 font-bold block">Margem Bruta</span>
                            <strong className="text-xs text-indigo-400 font-mono block mt-1">{preview.margemBruta}%</strong>
                          </div>
                          <div className="bg-slate-850/50 p-2.5 rounded-xl text-center border border-slate-800">
                            <span className="text-[9px] uppercase text-slate-400 font-bold block">Margem Líquida</span>
                            <strong className="text-xs text-emerald-400 font-mono block mt-1">{preview.margemLiquida}%</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Lançamento registrará data-hora atual do servidor local.</span>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-all text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving || itemsList.length === 0}
                      className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
                    >
                      {saving ? "Salvando..." : editingOrder ? "Atualizar Pedido" : "Confirmar Venda"}
                      {!saving && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

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
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Estornar & Excluir Pedido</h3>
            </div>
            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{deleteError}</p>
                </div>
              )}
              <p className="text-sm text-slate-600 leading-relaxed">
                Deseja realmente estornar e excluir este pedido? 
                O estoque de todos os produtos do pedido será devolvido automaticamente ao catálogo.
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
                  Sim, Estornar e Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
