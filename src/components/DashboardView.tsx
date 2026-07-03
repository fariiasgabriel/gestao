import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  ShoppingCart, 
  BarChart3, 
  AlertTriangle, 
  Package, 
  Layers, 
  Store, 
  DollarSign, 
  Percent, 
  RefreshCw, 
  FileText 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from "recharts";
import api from "../api";
import { DashboardData } from "../types";

export default function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/dashboard");
      setData(response.data);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao carregar métricas consolidadas do dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Carregando indicadores operacionais...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex p-3 bg-red-100 text-red-600 rounded-full mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Falha ao carregar dashboard</h3>
        <p className="text-slate-500 max-w-md mx-auto mt-1 mb-4">{error}</p>
        <button 
          onClick={fetchMetrics}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-xl text-sm transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { indicators, topProducts, marginsByCategory, mktStats, monthlyEvolution } = data;

  // Format currency helpers
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  return (
    <div className="space-y-8 p-1">
      {/* Dynamic Sync Trigger Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Atualização em Tempo Real</h3>
          <p className="text-xs text-slate-500">Métricas integradas diretamente da API local.</p>
        </div>
        <button 
          onClick={fetchMetrics}
          className="flex items-center gap-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sincronizar Dados
        </button>
      </div>

      {/* Grid of Key Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {/* Total Vendido */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Faturamento Bruto
            </span>
            <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatBRL(indicators.totalVendido)}
            </h4>
            <span className="text-xs text-emerald-600 font-medium block mt-1.5 font-mono">
              ★ Total Canal Integrado
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Pedidos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pedidos Lançados
            </span>
            <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {indicators.totalPedidos}
            </h4>
            <span className="text-xs text-slate-500 block mt-1.5 font-mono">
              Ticket Médio: {formatBRL(indicators.ticketMedio)}
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Lucro Bruto */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Lucro Bruto (Operacional)
            </span>
            <h4 className="text-xl font-extrabold text-indigo-950 tracking-tight">
              {formatBRL(indicators.lucroBrutoTotal)}
            </h4>
            <span className="text-xs text-indigo-600 font-medium block mt-1.5 font-mono">
              Margem Média: {indicators.margemBrutaMedia}%
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Lucro Líquido (Real)
            </span>
            <h4 className="text-xl font-extrabold text-emerald-800 tracking-tight">
              {formatBRL(indicators.lucroLiquidoTotal)}
            </h4>
            <span className="text-xs text-emerald-600 font-semibold block mt-1.5 font-mono">
              Margem Líquida: {indicators.margemLiquidaMedia}%
            </span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Produtos em Estoque */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Itens em Estoque
            </span>
            <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {indicators.totalEstoque}
            </h4>
            <span className="text-xs text-slate-500 block mt-1.5 font-mono">
              {indicators.produtosCadastrados} SKU cadastrados
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Categorias & Marketplaces count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Canais & Segmentos
            </span>
            <h4 className="text-lg font-bold text-slate-900 tracking-tight">
              {indicators.marketplacesCount} Mkts / {indicators.categoriasCount} Cats
            </h4>
            <span className="text-xs text-slate-500 block mt-1.5 font-mono">
              Operações ativas locais
            </span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Store className="w-5 h-5" />
          </div>
        </div>

        {/* Alertas de Estoque Baixo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between sm:col-span-2">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Alertas de Reposição de Estoque
            </span>
            <div className="flex gap-4 mt-1">
              <div className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                <span>{indicators.semEstoque} Sem Estoque</span>
              </div>
              <div className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{indicators.estoqueBaixo} Estoque Baixo (≤5)</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 block mt-2 font-mono">
              * Atualize o estoque na aba Produtos para regularizar as vendas.
            </span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Primary Visualizations - Bento Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-6">
        
        {/* 1. Evolução de Faturamento e Lucro */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-8 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-base">Evolução de Vendas e Margens</h4>
            <p className="text-xs text-slate-500">Histórico de faturamento versus lucros gerados nos últimos meses.</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyEvolution} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLiquido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value: any) => formatBRL(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", pt: 10 }} />
                <Area type="monotone" dataKey="vendas" name="Faturamento" stroke="#4f46e5" fillOpacity={1} fill="url(#colorVendas)" strokeWidth={2} />
                <Area type="monotone" dataKey="lucroLiquido" name="Lucro Líquido" stroke="#10b981" fillOpacity={1} fill="url(#colorLiquido)" strokeWidth={2} />
                <Line type="monotone" dataKey="lucroBruto" name="Lucro Bruto" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Top 10 Produtos Mais Vendidos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-4 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-base">Top Produtos Vendidos</h4>
            <p className="text-xs text-slate-500">Classificação por volume de peças despachadas.</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
              Nenhum pedido lançado ainda.
            </div>
          ) : (
            <div className="h-80 w-full overflow-y-auto space-y-3.5 pr-1">
              {topProducts.map((p, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl hover:border-slate-200 transition-all">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                    index === 0 ? "bg-amber-100 text-amber-800" :
                    index === 1 ? "bg-slate-200 text-slate-800" :
                    index === 2 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{p.nome}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Faturado: {formatBRL(p.totalValue)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-950 font-mono">{p.qty} un</span>
                    <p className="text-[9px] text-slate-400">vendidas</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Margens de Lucro por Categoria */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-6 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-base">Comparativo de Margens por Categoria (%)</h4>
            <p className="text-xs text-slate-500">Rentabilidade bruta e líquida gerada por cada segmento comercial.</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginsByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="categoria" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} suffix="%" />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="margemBruta" name="Margem Bruta" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="margemLiquida" name="Margem Líquida" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Faturamento Consolidado por Marketplace */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-6 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-base">Desempenho por Marketplace</h4>
            <p className="text-xs text-slate-500">Volume de vendas e lucros reais consolidados de cada canal parceiro.</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mktStats} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="marketplace" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value: any) => formatBRL(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="valorVendido" name="Valor Vendido" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucroLiquido" name="Lucro Líquido" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4.5. Estrutura de Custos Mensais (Entrada de Produtos + Gastos Gerais) */}
        <div id="chart-monthly-costs" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-12 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-base">Estrutura de Custos Mensais</h4>
            <p className="text-xs text-slate-500">Distribuição mensal entre despesas operacionais e investimento em aquisição de mercadorias (estoque) registrados no sistema.</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEvolution} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value: any) => formatBRL(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", pt: 10 }} />
                <Bar dataKey="custosEntrada" name="Investimento em Estoque" fill="#10b981" stackId="costs" />
                <Bar dataKey="custosGerais" name="Despesas Operacionais" fill="#f59e0b" stackId="costs" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Pedidos & Rentabilidade Média dos Marketplaces */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-12 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-base">Indicadores Operacionais por Marketplace</h4>
            <p className="text-xs text-slate-500">Planilha de conversões, rentabilidade e contagem de pedidos por canal.</p>
          </div>
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Canal Marketplace</th>
                  <th className="p-3.5 text-center">Nº Pedidos</th>
                  <th className="p-3.5 text-right">Faturamento Consolidado</th>
                  <th className="p-3.5 text-right">Margem Bruta</th>
                  <th className="p-3.5 text-right">Margem Líquida</th>
                  <th className="p-3.5 text-right">Lucro Líquido Real</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mktStats.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-800 font-semibold">{item.marketplace}</td>
                    <td className="p-3.5 text-center text-slate-600 font-mono">{item.pedidos}</td>
                    <td className="p-3.5 text-right text-indigo-950 font-mono">{formatBRL(item.valorVendido)}</td>
                    <td className="p-3.5 text-right text-blue-600 font-mono">{item.margemBruta}%</td>
                    <td className="p-3.5 text-right text-emerald-600 font-mono">{item.margemLiquida}%</td>
                    <td className="p-3.5 text-right text-emerald-700 font-semibold font-mono">{formatBRL(item.lucroLiquido)}</td>
                  </tr>
                ))}
                {mktStats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">Nenhum canal faturado até o momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
