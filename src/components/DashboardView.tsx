import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  BarChart3,
  AlertTriangle,
  Package,
  Store,
  DollarSign,
  RefreshCw,
  Receipt,
  Wallet
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

  const formatBRL = (val: number) => {
    if (val === null || val === undefined || isNaN(val)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  const safeNum = (val: any) => (isNaN(Number(val)) ? 0 : Number(val));

  return (
    <div className="space-y-5 p-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Atualização em Tempo Real</h3>
          <p className="text-xs text-slate-500">Métricas integradas diretamente da API.</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sincronizar Dados
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Faturamento Bruto
            </span>
            <h4 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {formatBRL(safeNum(indicators.totalVendido))}
            </h4>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-medium block mt-1 font-mono">
              ★ Total integrado
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pedidos Lançados
            </span>
            <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {safeNum(indicators.totalPedidos)}
            </h4>
            <span className="text-[10px] sm:text-xs text-slate-500 block mt-1 font-mono">
              Ticket: {formatBRL(safeNum(indicators.ticketMedio))}
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Lucro Bruto
            </span>
            <h4 className="text-base sm:text-xl font-extrabold text-indigo-950 tracking-tight">
              {formatBRL(safeNum(indicators.lucroBrutoTotal))}
            </h4>
            <span className="text-[10px] sm:text-xs text-indigo-600 font-medium block mt-1 font-mono">
              Margem: {safeNum(indicators.margemBrutaMedia)}%
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Lucro Líquido
            </span>
            <h4 className="text-base sm:text-xl font-extrabold text-emerald-800 tracking-tight">
              {formatBRL(safeNum(indicators.lucroLiquidoTotal))}
            </h4>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-semibold block mt-1 font-mono">
              Margem: {safeNum(indicators.margemLiquidaMedia)}%
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-emerald-100 text-emerald-700 rounded-xl flex-shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Itens em Estoque
            </span>
            <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {safeNum(indicators.totalEstoque)}
            </h4>
            <span className="text-[10px] sm:text-xs text-slate-500 block mt-1 font-mono">
              {safeNum(indicators.produtosCadastrados)} SKUs
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Valor em Estoque
            </span>
            <h4 className="text-base sm:text-xl font-extrabold text-emerald-900 tracking-tight">
              {formatBRL(safeNum(indicators.totalEstoqueValor))}
            </h4>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-medium block mt-1 font-mono">
              ★ {safeNum(indicators.totalEstoque)} itens disponíveis
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-orange-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Custos Op. do Mês
            </span>
            <h4 className="text-base sm:text-xl font-extrabold text-orange-800 tracking-tight">
              {formatBRL(safeNum(indicators.custosOperacionaisMes))}
            </h4>
            <span className="text-[10px] sm:text-xs text-orange-500 font-medium block mt-1 font-mono">
              Total: {formatBRL(safeNum(indicators.totalDespesasMes))}
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-orange-50 text-orange-500 rounded-xl flex-shrink-0">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Canais & Segmentos
            </span>
            <h4 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
              {safeNum(indicators.marketplacesCount)} Mkts / {safeNum(indicators.categoriasCount)} Cats
            </h4>
            <span className="text-[10px] sm:text-xs text-slate-500 block mt-1 font-mono">
              Operações ativas
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-slate-100 text-slate-600 rounded-xl flex-shrink-0">
            <Store className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between col-span-2 xl:col-span-4">
          <div className="flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Alertas de Reposição de Estoque
            </span>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-1">
              <div className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0"></span>
                <span>{safeNum(indicators.semEstoque)} Sem Estoque</span>
              </div>
              <div className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                <span>{safeNum(indicators.estoqueBaixo)} Estoque Baixo (≤5)</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 block mt-2 font-mono">
              * Atualize o estoque na aba Produtos para regularizar as vendas.
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-red-50 text-red-600 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-6">

        {/* Evolução de Vendas */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-8">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">Evolução de Vendas e Margens</h4>
            <p className="text-xs text-slate-500">Histórico de faturamento versus lucros gerados.</p>
          </div>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyEvolution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLiquido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={60} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatBRL(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="vendas" name="Faturamento" stroke="#4f46e5" fillOpacity={1} fill="url(#colorVendas)" strokeWidth={2} />
                <Area type="monotone" dataKey="lucroLiquido" name="Lucro Líquido" stroke="#10b981" fillOpacity={1} fill="url(#colorLiquido)" strokeWidth={2} />
                <Line type="monotone" dataKey="lucroBruto" name="Lucro Bruto" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-4">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">Top Produtos Vendidos</h4>
            <p className="text-xs text-slate-500">Classificação por volume de peças.</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic py-16">
              Nenhum pedido lançado ainda.
            </div>
          ) : (
            <div className="h-64 sm:h-80 overflow-y-auto space-y-2.5 pr-1">
              {topProducts.map((p, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl hover:border-slate-200 transition-all">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${index === 0 ? "bg-amber-100 text-amber-800" :
                      index === 1 ? "bg-slate-200 text-slate-800" :
                        index === 2 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                    }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{p.nome}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{formatBRL(safeNum(p.totalValue))}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-950 font-mono">{p.qty} un</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-6">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">Margens por Categoria (%)</h4>
            <p className="text-xs text-slate-500">Rentabilidade por segmento comercial.</p>
          </div>
          <div className="h-60 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginsByCategory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="categoria" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="margemBruta" name="Margem Bruta" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="margemLiquida" name="Margem Líquida" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-6">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">Desempenho por Marketplace</h4>
            <p className="text-xs text-slate-500">Volume de vendas e lucros por canal.</p>
          </div>
          <div className="h-60 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mktStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="marketplace" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={60} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatBRL(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="valorVendido" name="Valor Vendido" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucroLiquido" name="Lucro Líquido" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-12">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">Estrutura de Custos Mensais</h4>
            <p className="text-xs text-slate-500">Distribuição entre despesas operacionais e investimento em estoque por mês.</p>
          </div>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEvolution} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={60} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatBRL(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="custosEntrada" name="Investimento em Estoque" fill="#10b981" stackId="costs" />
                <Bar dataKey="custosGerais" name="Despesas Operacionais" fill="#f59e0b" stackId="costs" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-12">
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">Indicadores Operacionais por Marketplace</h4>
            <p className="text-xs text-slate-500">Conversões, rentabilidade e contagem de pedidos por canal.</p>
          </div>
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs min-w-[500px]">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">Canal</th>
                  <th className="p-3 text-center">Pedidos</th>
                  <th className="p-3 text-right">Faturamento</th>
                  <th className="p-3 text-right">M. Bruta</th>
                  <th className="p-3 text-right">M. Líquida</th>
                  <th className="p-3 text-right">Lucro Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mktStats.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-800 font-semibold">{item.marketplace}</td>
                    <td className="p-3 text-center text-slate-600 font-mono">{item.pedidos}</td>
                    <td className="p-3 text-right text-indigo-950 font-mono">{formatBRL(safeNum(item.valorVendido))}</td>
                    <td className="p-3 text-right text-blue-600 font-mono">{safeNum(item.margemBruta)}%</td>
                    <td className="p-3 text-right text-emerald-600 font-mono">{safeNum(item.margemLiquida)}%</td>
                    <td className="p-3 text-right text-emerald-700 font-semibold font-mono">{formatBRL(safeNum(item.lucroLiquido))}</td>
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
