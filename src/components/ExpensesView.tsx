import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw, 
  DollarSign, 
  Package, 
  FileText, 
  Calendar, 
  AlertCircle, 
  CheckCircle2 
} from "lucide-react";
import api from "../api";
import { Expense, Product } from "../types";

export default function ExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [tipo, setTipo] = useState<"PRODUTO" | "GERAL">("PRODUTO");
  const [descricao, setDescricao] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [custoUnitario, setCustoUnitario] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().substring(0, 10));
  
  // Inline/New product creation state
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  
  // Feedback States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<"TODOS" | "PRODUTO" | "GERAL">("TODOS");

  const fetchExpensesAndProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [expRes, prodRes, suppRes, catRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/products"),
        api.get("/suppliers"),
        api.get("/categories")
      ]);
      setExpenses(expRes.data);
      setProducts(prodRes.data);
      setSuppliers(suppRes.data);
      setCategories(catRes.data);
    } catch (err: any) {
      setError("Não foi possível carregar os dados de despesas, produtos, fornecedores e categorias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndProducts();
  }, []);

  // When selected product changes, pre-populate cost unitario
  useEffect(() => {
    if (tipo === "PRODUTO" && produtoId) {
      const selectedProd = products.find(p => p.id === parseInt(produtoId));
      if (selectedProd) {
        setCustoUnitario(selectedProd.custo.toString());
      }
    }
  }, [produtoId, tipo, products]);

  // Calculated properties for form
  const totalCalculado = tipo === "PRODUTO" 
    ? (parseFloat(quantidade) || 0) * (parseFloat(custoUnitario) || 0)
    : parseFloat(valor) || 0;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      let payload: any = {
        tipo,
        data,
      };

      if (fornecedorId) {
        payload.fornecedorId = parseInt(fornecedorId);
      }

      if (tipo === "PRODUTO") {
        if (isNewProduct) {
          if (!newProductName.trim()) {
            setError("Informe o nome do novo produto.");
            setSaving(false);
            return;
          }
          payload.produtoId = "new";
          payload.newProduct = {
            nome: newProductName.trim(),
            categoriaId: newProductCategoryId ? parseInt(newProductCategoryId) : 0
          };
        } else {
          if (!produtoId) {
            setError("Selecione um produto para a entrada.");
            setSaving(false);
            return;
          }
          payload.produtoId = parseInt(produtoId);
        }

        if (!quantidade || parseInt(quantidade) <= 0) {
          setError("Informe uma quantidade válida superior a zero.");
          setSaving(false);
          return;
        }
        if (!custoUnitario || parseFloat(custoUnitario) < 0) {
          setError("Informe um custo unitário válido.");
          setSaving(false);
          return;
        }

        payload.quantidade = parseInt(quantidade);
        payload.custoUnitario = parseFloat(custoUnitario);
        payload.valor = payload.quantidade * payload.custoUnitario;
        
        if (isNewProduct) {
          payload.descricao = `Entrada de Estoque: ${newProductName.trim()}`;
        } else {
          const selectedProd = products.find(p => p.id === parseInt(produtoId));
          payload.descricao = `Entrada de Estoque: ${selectedProd ? selectedProd.nome : "Produto"}`;
        }
      } else {
        if (!descricao.trim()) {
          setError("Informe uma descrição para o gasto.");
          setSaving(false);
          return;
        }
        if (!valor || parseFloat(valor) <= 0) {
          setError("Informe um valor total válido.");
          setSaving(false);
          return;
        }
        payload.descricao = descricao.trim();
        payload.valor = parseFloat(valor);
      }

      await api.post("/expenses", payload);
      setSuccess("Lançamento registrado com sucesso!");
      
      // Reset Form fields keeping tipo and data
      setDescricao("");
      setProdutoId("");
      setFornecedorId("");
      setQuantidade("");
      setCustoUnitario("");
      setValor("");
      setIsNewProduct(false);
      setNewProductName("");
      setNewProductCategoryId("");

      // Refresh list
      fetchExpensesAndProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao registrar o lançamento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/expenses/${id}`);
      setSuccess("Lançamento removido com sucesso e estoque atualizado!");
      setDeleteConfirmId(null);
      fetchExpensesAndProducts();
    } catch (err: any) {
      setError("Erro ao excluir o lançamento.");
    }
  };

  // Financial calculations
  const totalGeral = expenses.reduce((acc, exp) => acc + exp.valor, 0);
  const totalProdutosInflow = expenses
    .filter(exp => exp.tipo === "PRODUTO")
    .reduce((acc, exp) => acc + exp.valor, 0);
  const totalGerais = expenses
    .filter(exp => exp.tipo === "GERAL")
    .reduce((acc, exp) => acc + exp.valor, 0);

  // Filters application
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.descricao.toLowerCase().includes(search.toLowerCase()) || 
      (exp.produtoNome && exp.produtoNome.toLowerCase().includes(search.toLowerCase()));
    
    const matchesTipo = filterTipo === "TODOS" || exp.tipo === filterTipo;
    
    return matchesSearch && matchesTipo;
  });

  return (
    <div className="space-y-8">
      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Cost Outlay Card */}
        <div id="metric-total-general" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Custo Total Acumulado</span>
            <h3 className="text-3xl font-bold font-sans text-slate-800">
              R$ {totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400">Total de produtos comprados + despesas</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-600">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>

        {/* Product Inflows Card */}
        <div id="metric-total-stock" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Entrada de Produtos (Estoque)</span>
            <h3 className="text-3xl font-bold font-sans text-slate-800 text-emerald-600">
              R$ {totalProdutosInflow.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400">Investimento em mercadorias/fornecedores</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <Package className="w-8 h-8" />
          </div>
        </div>

        {/* General Operational Expenses Card */}
        <div id="metric-total-general-costs" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Outros Gastos e Despesas</span>
            <h3 className="text-3xl font-bold font-sans text-slate-800 text-amber-600">
              R$ {totalGerais.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400">Custos fixos, anúncios, embalagens, etc.</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <FileText className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* 2. Notification System */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 3. Main Workspace Area: Inputs Form (Left) & Historical logs table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Launching Form Card (Left Column) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="bg-slate-900 px-6 py-5 text-white">
            <h3 className="font-bold text-base">Lançar Novo Custo / Entrada</h3>
            <p className="text-xs text-slate-400 mt-1">Insira entradas de mercadorias no estoque ou registre despesas operacionais</p>
          </div>
          
          <form onSubmit={handleRegister} className="p-6 space-y-5">
            {/* Tipo Selector Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Tipo de Custo</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTipo("PRODUTO");
                    setError(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    tipo === "PRODUTO"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Entrada de Produto</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipo("GERAL");
                    setError(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    tipo === "GERAL"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Gasto Geral / Despesa</span>
                </button>
              </div>
            </div>

            {/* Form Fields depend on selected type */}
            {tipo === "PRODUTO" ? (
              <div className="space-y-4">
                {/* Product Selection Mode Toggle Header */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">Produto Adquirido</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewProduct(!isNewProduct);
                      setProdutoId("");
                      setNewProductName("");
                      setNewProductCategoryId("");
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {isNewProduct ? "← Escolher Existente" : "+ Cadastrar Novo Produto Inline"}
                  </button>
                </div>

                {isNewProduct ? (
                  <div className="space-y-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60">
                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider font-mono">Novo Produto - Cadastro Rápido</p>
                    
                    {/* New Product Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="new-product-name" className="text-xs font-medium text-slate-600 block">Nome do Produto *</label>
                      <input
                        id="new-product-name"
                        type="text"
                        placeholder="Ex: Novo Smartwatch Series 9"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        required={isNewProduct}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    {/* New Product Category */}
                    <div className="space-y-1.5">
                      <label htmlFor="new-product-category" className="text-xs font-medium text-slate-600 block">Categoria *</label>
                      <select
                        id="new-product-category"
                        value={newProductCategoryId}
                        onChange={(e) => setNewProductCategoryId(e.target.value)}
                        required={isNewProduct}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      >
                        <option value="">-- Selecione a Categoria --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <select
                      id="product-select"
                      value={produtoId}
                      onChange={(e) => setProdutoId(e.target.value)}
                      required={!isNewProduct}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                      <option value="">-- Selecione o Produto --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (Estoque atual: {p.quantidadeEstoque})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">O produto selecionado terá seu estoque atual incrementado e o custo unitário atualizado.</p>
                  </div>
                )}

                {/* Grid for Quantity and Unit Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="quantity-input" className="text-xs font-bold text-slate-700 block">Quantidade</label>
                    <input
                      id="quantity-input"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Ex: 50"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="cost-unit-input" className="text-xs font-bold text-slate-700 block">Custo Unitário (R$)</label>
                    <input
                      id="cost-unit-input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Ex: 45.00"
                      value={custoUnitario}
                      onChange={(e) => setCustoUnitario(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Description input */}
                <div className="space-y-1.5">
                  <label htmlFor="description-input" className="text-xs font-bold text-slate-700 block">Descrição do Gasto / Despesa</label>
                  <input
                    id="description-input"
                    type="text"
                    placeholder="Ex: Aluguel mensal do galpão, Meta Ads, etc."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Value input */}
                <div className="space-y-1.5">
                  <label htmlFor="value-input" className="text-xs font-bold text-slate-700 block">Valor Total do Gasto (R$)</label>
                  <input
                    id="value-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Ex: 1500.00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Supplier Selector Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="fornecedor-select" className="text-xs font-bold text-slate-700 block">Fornecedor Associado</label>
              <select
                id="fornecedor-select"
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="">-- Selecione o Fornecedor (Previamente cadastrado) --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">O fornecedor deve ser cadastrado previamente na aba "Fornecedores" no menu lateral.</p>
            </div>

            {/* Date input (Common) */}
            <div className="space-y-1.5">
              <label htmlFor="date-input" className="text-xs font-bold text-slate-700 block">Data de Ocorrência</label>
              <div className="relative">
                <input
                  id="date-input"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Total Summary Row */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase font-mono">Valor do Lançamento:</span>
              <span className="text-xl font-extrabold font-sans text-slate-800">
                R$ {totalCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>{saving ? "Salvando Lançamento..." : "Registrar Lançamento"}</span>
            </button>
          </form>
        </div>

        {/* Historical Logs List (Right Column) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Histórico de Lançamentos</h3>
              <p className="text-xs text-slate-400">Acompanhe e audite todas as saídas financeiras e entradas de produtos</p>
            </div>
            
            <button 
              onClick={fetchExpensesAndProducts} 
              disabled={loading}
              className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-50 rounded-xl transition-all self-end"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Table Filters header */}
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row gap-3">
            {/* Search filter */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar descrição ou produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 pl-10 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Tipo filter */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="TODOS">Todos os Lançamentos</option>
              <option value="PRODUTO">Apenas Entradas de Estoque</option>
              <option value="GERAL">Apenas Gastos / Despesas</option>
            </select>
          </div>

          {/* Loading state or logs */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm font-medium">Buscando lançamentos no servidor...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-bold">Nenhum lançamento encontrado</p>
              <p className="text-xs">Tente alterar os filtros de busca ou crie um novo lançamento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-slate-50/20">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Descrição / Produto</th>
                    <th className="px-6 py-4 text-right">Qtd</th>
                    <th className="px-6 py-4 text-right">Custo Unit.</th>
                    <th className="px-6 py-4 text-right">Valor Total</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((exp) => {
                    const isProduct = exp.tipo === "PRODUTO";
                    return (
                      <tr key={exp.id} className="text-xs text-slate-700 hover:bg-slate-50/60 transition-all">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono">
                          {new Date(exp.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isProduct ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                              Estoque
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                              <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                              Gasto Geral
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          <div>{exp.descricao}</div>
                          {exp.fornecedorNome && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-slate-100 text-slate-500">
                              Fornecedor: {exp.fornecedorNome}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {isProduct ? exp.quantidade : "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {isProduct && exp.custoUnitario ? `R$ ${exp.custoUnitario.toFixed(2)}` : "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800 font-mono">
                          R$ {exp.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {deleteConfirmId === exp.id ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleDelete(exp.id)}
                                className="px-2 py-1 text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-md transition-all"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(exp.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mx-auto block"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
