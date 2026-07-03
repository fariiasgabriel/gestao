import React, { useEffect, useState } from "react";
import { 
  Search, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  Lightbulb, 
  ShoppingCart, 
  HelpCircle, 
  Check, 
  Plus, 
  Minus, 
  Filter, 
  Sliders, 
  Package, 
  DollarSign,
  FileText,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import api from "../api";
import { Product, Category, Order } from "../types";

export default function RecommendationsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recommendation Threshold Customization States
  const [minSalesThreshold, setMinSalesThreshold] = useState<number>(3); // Units sold to be considered "Bem vendido"
  const [maxStockThreshold, setMaxStockThreshold] = useState<number>(5);  // Units in stock to be considered "Estoque baixo"
  const [coverageMultiplier, setCoverageMultiplier] = useState<number>(1.5); // Replenishment coverage multiplier

  // Filter & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  // Simulated Cart for Purchase (Interactive simulation)
  const [simulatedItems, setSimulatedItems] = useState<Record<string, number>>({}); // productId -> qtyToBuy

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, orderRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
        api.get("/orders")
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setOrders(orderRes.data);
    } catch (err: any) {
      setError("Erro ao carregar dados operacionais para cálculo de recomendações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate units sold for each product
  const productSalesMap: Record<number, number> = {};
  orders.forEach(order => {
    // Check if the order has sub-items
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        productSalesMap[item.produtoId] = (productSalesMap[item.produtoId] || 0) + item.quantidade;
      });
    } else {
      // Fallback to legacy root order level
      productSalesMap[order.produtoId] = (productSalesMap[order.produtoId] || 0) + order.quantidade;
    }
  });

  // Build the list of recommendations
  const allRecommendations = products.map(product => {
    const totalSold = productSalesMap[product.id] || 0;
    const currentStock = product.quantidadeEstoque;
    
    // Algorithmic suggest qty: (Total sold * multiplier) rounded up, minus current stock. Minimum 0.
    const suggestedQty = Math.max(0, Math.ceil(totalSold * coverageMultiplier) - currentStock);
    
    // Determine priority
    let priority: "CRÍTICA" | "ATENÇÃO" | "PREVENTIVA" | "OK" = "OK";
    let reason = "";

    const isHighlySold = totalSold >= minSalesThreshold;
    const isLowStock = currentStock <= maxStockThreshold;

    if (isHighlySold && isLowStock) {
      priority = "CRÍTICA";
      reason = "Alto giro de vendas e estoque crítico.";
    } else if (isLowStock && totalSold > 0) {
      priority = "ATENÇÃO";
      reason = "Estoque baixo com vendas registradas.";
    } else if (isHighlySold && currentStock <= maxStockThreshold * 2) {
      priority = "PREVENTIVA";
      reason = "Giro alto de vendas. Recomendado manter pulmão de estoque.";
    } else if (currentStock === 0 && totalSold > 0) {
      priority = "CRÍTICA";
      reason = "Estoque esgotado para produto com saída registrada.";
    } else if (suggestedQty > 0) {
      priority = "PREVENTIVA";
      reason = "Sugerido repor estoque preventivamente.";
    }

    return {
      ...product,
      totalSold,
      suggestedQty,
      priority,
      reason,
      estimatedCost: suggestedQty * product.custo
    };
  });

  // Filter recommendations: only show products that have recommendation priority != 'OK' OR suggestedQty > 0
  const activeRecommendations = allRecommendations.filter(rec => {
    if (rec.suggestedQty === 0 && rec.priority === "OK") return false;

    const matchesSearch = rec.nome.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory ? rec.categoriaId === parseInt(selectedCategory) : true;
    const matchesPriority = selectedPriority ? rec.priority === selectedPriority : true;

    return matchesSearch && matchesCat && matchesPriority;
  });

  // Sort recommendations by priority weight (CRÍTICA > ATENÇÃO > PREVENTIVA)
  activeRecommendations.sort((a, b) => {
    const weights = { "CRÍTICA": 3, "ATENÇÃO": 2, "PREVENTIVA": 1, "OK": 0 };
    const weightA = weights[a.priority] || 0;
    const weightB = weights[b.priority] || 0;
    if (weightA !== weightB) return weightB - weightA;
    return b.totalSold - a.totalSold; // Secondary sort by sales volume descending
  });

  // Toggle/Update simulated buy item
  const handleToggleSimulation = (productId: number, defaultQty: number) => {
    const key = String(productId);
    setSimulatedItems(prev => {
      const updated = { ...prev };
      if (updated[key] !== undefined) {
        delete updated[key];
      } else {
        updated[key] = defaultQty || 1;
      }
      return updated;
    });
  };

  const handleUpdateSimulatedQty = (productId: number, qty: number) => {
    const key = String(productId);
    if (qty <= 0) {
      setSimulatedItems(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      return;
    }
    setSimulatedItems(prev => ({
      ...prev,
      [key]: qty
    }));
  };

  // Quick select all critical items to simulation list
  const handleAddAllCritical = () => {
    const criticals = allRecommendations.filter(r => r.priority === "CRÍTICA" && r.suggestedQty > 0);
    setSimulatedItems(prev => {
      const updated = { ...prev };
      criticals.forEach(c => {
        updated[String(c.id)] = c.suggestedQty;
      });
      return updated;
    });
  };

  // Format currency
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // Compute metrics for critical alerts
  const totalCriticalItems = allRecommendations.filter(r => r.priority === "CRÍTICA").length;
  const totalAttentionItems = allRecommendations.filter(r => r.priority === "ATENÇÃO").length;
  
  // Simulated totals
  const simProductsCount = Object.keys(simulatedItems).length;
  const simTotalQty = Object.keys(simulatedItems).reduce((sum, key) => sum + (simulatedItems[key] || 0), 0);
  const simTotalCost = Object.keys(simulatedItems).reduce((sum, key) => {
    const prod = products.find(p => p.id === parseInt(key));
    const qty = simulatedItems[key] || 0;
    return sum + (prod ? prod.custo * qty : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Informational Hero Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl border border-indigo-950 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <Lightbulb className="w-48 h-48 text-indigo-400" />
        </div>
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Inteligência de Catálogo
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Recomendação Automática de Reposição</h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
            O algoritmo calcula as necessidades de compra cruzando a velocidade de saída de cada SKU (vendas acumuladas) com o estoque em tempo real. Ajuste os filtros para gerar previsões ideais de estoque mínimo e pulmão protetor.
          </p>
        </div>

        {/* Dashboard summary indicators row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-3 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Alertas Críticos</p>
              <h3 className="text-lg font-extrabold text-white">{totalCriticalItems} SKUs</h3>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Atenção Necessária</p>
              <h3 className="text-lg font-extrabold text-white">{totalAttentionItems} SKUs</h3>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Simulação de Compra</p>
              <h3 className="text-lg font-extrabold text-white">{simProductsCount} SKUs ({simTotalQty} un)</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Sliders Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          Configurações da Regra de Sugestão
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Slider 1: Sales Velocity */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Giro de Vendas Mínimo:</span>
              <span className="text-indigo-600 font-mono">{minSalesThreshold} un</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={minSalesThreshold} 
              onChange={(e) => setMinSalesThreshold(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none" 
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Volume mínimo de vendas de um produto para que ele seja classificado como "Bem Vendido".
            </p>
          </div>

          {/* Slider 2: Low stock criteria */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Gatilho de Estoque Baixo:</span>
              <span className="text-indigo-600 font-mono">{maxStockThreshold} un</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="20" 
              value={maxStockThreshold} 
              onChange={(e) => setMaxStockThreshold(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none" 
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Nível físico de estoque limite abaixo do qual o SKU passa a necessitar de reposição emergencial.
            </p>
          </div>

          {/* Slider 3: Target safety multiplier */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Multiplicador Protetor:</span>
              <span className="text-indigo-600 font-mono">{coverageMultiplier}x</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.5"
              value={coverageMultiplier} 
              onChange={(e) => setCoverageMultiplier(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none" 
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Fator multiplicador sobre as vendas acumuladas para projetar a quantidade ideal de compra.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
          {/* Search SKU */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nome..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Categories select filter */}
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

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Filtrar por Prioridade (Todas)</option>
            <option value="CRÍTICA">Prioridade: Crítica 🚨</option>
            <option value="ATENÇÃO">Prioridade: Atenção ⚠️</option>
            <option value="PREVENTIVA">Prioridade: Preventiva 🛡️</option>
          </select>

          {/* Add All Critical */}
          <button
            onClick={handleAddAllCritical}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            Simular Todos Críticos
          </button>
        </div>
      </div>

      {/* Table & Recommendations Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Main List Table */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="text-slate-500 text-sm font-medium">Analisando histórico e estoque...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4 pl-6 text-center w-12">Simular</th>
                      <th className="p-4">SKU / Categoria</th>
                      <th className="p-4 text-center">Giro (Vendas)</th>
                      <th className="p-4 text-center">Estoque</th>
                      <th className="p-4 text-right">Sugestão Qtd</th>
                      <th className="p-4 text-center">Prioridade</th>
                      <th className="p-4 pr-6 text-right w-24">Custo Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {activeRecommendations.map((item) => {
                      const isSimulated = simulatedItems[item.id] !== undefined;
                      const displayQty = isSimulated ? simulatedItems[item.id] : item.suggestedQty;

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-50/50 transition-all ${
                            isSimulated ? "bg-indigo-50/20" : ""
                          }`}
                        >
                          <td className="p-4 pl-6 text-center align-middle">
                            <input 
                              type="checkbox"
                              checked={isSimulated}
                              disabled={item.suggestedQty === 0}
                              onChange={() => handleToggleSimulation(item.id, item.suggestedQty)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all cursor-pointer accent-indigo-600 disabled:opacity-30"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{item.nome}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {item.categoriaNome || "Desconhecida"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Custo: {formatBRL(item.custo)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center font-mono text-indigo-950 font-bold">
                            {item.totalSold} un
                          </td>
                          <td className="p-4 text-center">
                            <span className={`font-mono font-bold ${
                              item.quantidadeEstoque === 0 
                                ? "text-red-600" 
                                : item.quantidadeEstoque <= maxStockThreshold 
                                ? "text-amber-600" 
                                : "text-slate-600"
                            }`}>
                              {item.quantidadeEstoque} un
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {isSimulated ? (
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button 
                                  onClick={() => handleUpdateSimulatedQty(item.id, displayQty - 1)}
                                  className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center justify-center font-bold font-mono text-xs transition-all"
                                >
                                  -
                                </button>
                                <input 
                                  type="number"
                                  min="1"
                                  value={displayQty}
                                  onChange={(e) => handleUpdateSimulatedQty(item.id, parseInt(e.target.value) || 0)}
                                  className="w-12 text-center border border-slate-200 rounded font-mono font-bold text-xs bg-white text-indigo-600 py-0.5 focus:outline-none"
                                />
                                <button 
                                  onClick={() => handleUpdateSimulatedQty(item.id, displayQty + 1)}
                                  className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center justify-center font-bold font-mono text-xs transition-all"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="font-mono text-slate-800 font-bold text-right block">
                                {item.suggestedQty} un
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {item.priority === "CRÍTICA" ? (
                              <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-md text-[10px] font-bold inline-block" title={item.reason}>
                                Crítica 🚨
                              </span>
                            ) : item.priority === "ATENÇÃO" ? (
                              <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md text-[10px] font-bold inline-block" title={item.reason}>
                                Atenção ⚠️
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold inline-block" title={item.reason}>
                                Preventiva 🛡️
                              </span>
                            )}
                          </td>
                          <td className="p-4 pr-6 text-right font-mono font-bold text-slate-900">
                            {formatBRL(displayQty * item.custo)}
                          </td>
                        </tr>
                      );
                    })}

                    {activeRecommendations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                          Nenhum SKU necessita de reposição com os parâmetros informados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Purchase Simulation Side Panel */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Simulador de Pedido</h4>
              <p className="text-[10px] text-slate-400 font-medium">Monte e planeje seu lote de compras</p>
            </div>
          </div>

          {simProductsCount === 0 ? (
            <div className="py-12 px-4 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Nenhum item selecionado na simulação de compras. Use os checkboxes à esquerda para adicionar sugestões.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Item checklist inside simulator */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {Object.keys(simulatedItems).map((pId) => {
                  const prod = products.find(p => p.id === parseInt(pId));
                  if (!prod) return null;
                  const qty = simulatedItems[pId] || 0;
                  return (
                    <div key={pId} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 truncate">{prod.nome}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-semibold">
                          {qty} un x {formatBRL(prod.custo)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">{formatBRL(prod.custo * qty)}</span>
                        <button 
                          onClick={() => handleToggleSimulation(prod.id, 0)}
                          className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-all font-bold font-mono text-xs"
                          title="Remover da simulação"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Financial summary metrics */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5 font-medium">
                <div className="flex justify-between text-slate-500">
                  <span>Tipos de SKU:</span>
                  <span className="font-mono font-bold text-slate-800">{simProductsCount} SKUs</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total de Peças:</span>
                  <span className="font-mono font-bold text-slate-800">{simTotalQty} un</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-2 text-sm">
                  <span>Custo de Compra:</span>
                  <span className="font-mono text-indigo-600 font-black">{formatBRL(simTotalCost)}</span>
                </div>
              </div>

              {/* Quick simulation action button */}
              <button
                onClick={() => {
                  alert(`Planejamento de compra exportado com sucesso! \n\nResumo: \n- ${simProductsCount} SKUs \n- ${simTotalQty} unidades \n- Custo total: ${formatBRL(simTotalCost)}`);
                }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/15 active:scale-98"
              >
                <FileText className="w-4 h-4" />
                Exportar Planejamento de Compra
              </button>

              <button
                onClick={() => setSimulatedItems({})}
                className="w-full text-center text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Limpar Simulação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
