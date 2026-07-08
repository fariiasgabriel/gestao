import React, { useEffect, useState } from "react";
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  DollarSign, 
  ShoppingCart, 
  Percent, 
  TrendingUp, 
  Layers, 
  Store 
} from "lucide-react";
import api from "../api";
import { Order, Product, Category, Marketplace } from "../types";

export default function ReportsView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [mktFilter, setMktFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [orderRes, prodRes, catRes, mktRes] = await Promise.all([
        api.get("/orders"),
        api.get("/products"),
        api.get("/categories"),
        api.get("/marketplaces")
      ]);
      setOrders(orderRes.data);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setMarketplaces(mktRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // Filter Orders dynamically on client side for the active spreadsheet report view
  const getFilteredOrders = () => {
    return orders.filter(o => {
      const matchesMkt = mktFilter ? o.marketplaceId === parseInt(mktFilter) : true;
      const matchesCat = catFilter ? o.categoriaId === parseInt(catFilter) : true;
      const matchesStart = startDate ? new Date(o.dataPedido) >= new Date(startDate) : true;
      let matchesEnd = true;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesEnd = new Date(o.dataPedido) <= end;
      }
      return matchesMkt && matchesCat && matchesStart && matchesEnd;
    });
  };

  const filteredOrders = getFilteredOrders();

  const totalPedidos = filteredOrders.length;
  const valorVendido = filteredOrders.reduce((sum, o) => sum + o.valorVenda, 0);
  const lucroBruto = filteredOrders.reduce((sum, o) => sum + o.lucroBruto, 0);
  const lucroLiquido = filteredOrders.reduce((sum, o) => sum + o.lucroLiquido, 0);
  const totalQtdVendida = filteredOrders.reduce((sum, o) => sum + o.quantidade, 0);
  const ticketMedio = totalPedidos > 0 ? valorVendido / totalPedidos : 0;
  const margemBruta = valorVendido > 0 ? (lucroBruto / valorVendido) * 100 : 0;
  const margemLiquida = valorVendido > 0 ? (lucroLiquido / valorVendido) * 100 : 0;

  const semEstoque = products.filter(p => p.quantidadeEstoque === 0).length;
  const estoqueBaixo = products.filter(p => p.quantidadeEstoque > 0 && p.quantidadeEstoque <= 5).length;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportOrdersReport = () => {
    let csv = "ID;Data;Produto SKU;Categoria;Marketplace;Quantidade;Faturamento Bruto (R$);Frete (R$);Taxa Fixa (R$);Comissão (R$);Lucro Bruto (R$);Lucro Líquido (R$);Margem Líquida (%)\n";
    filteredOrders.forEach(o => {
      csv += `${o.id};${new Date(o.dataPedido).toLocaleDateString("pt-BR")};${o.produtoNome};${o.categoriaNome};${o.marketplaceNome};${o.quantidade};${o.valorVenda.toFixed(2)};${o.frete.toFixed(2)};${o.taxaFixa.toFixed(2)};${o.comissaoValor.toFixed(2)};${o.lucroBruto.toFixed(2)};${o.lucroLiquido.toFixed(2)};${o.margemLiquida.toFixed(2)}\n`;
    });
    downloadCSV(`relatorio_vendas_filtrado_${new Date().toISOString().slice(0,10)}.csv`, csv);
  };

  const exportProductsReport = () => {
    let csv = "ID;SKU Produto;Categoria;Custo (R$);Quantidade Estoque;Status\n";
    products.forEach(p => {
      const status = p.quantidadeEstoque === 0 ? "Sem Estoque" : p.quantidadeEstoque <= 5 ? "Estoque Baixo" : "Regular";
      csv += `${p.id};${p.nome};${p.categoriaNome || "N/A"};${p.custo.toFixed(2)};${p.quantidadeEstoque};${status}\n`;
    });
    downloadCSV("catalogo_produtos.csv", csv);
  };

  const exportCategoriesReport = () => {
    let csv = "ID;Nome Categoria\n";
    categories.forEach(c => {
      csv += `${c.id};${c.nome}\n`;
    });
    downloadCSV("lista_categorias.csv", csv);
  };

  const exportMarketplacesReport = () => {
    let csv = "ID;Nome Marketplace\n";
    marketplaces.forEach(m => {
      csv += `${m.id};${m.nome}\n`;
    });
    downloadCSV("lista_marketplaces.csv", csv);
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-3 min-h-[400px] justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-slate-500 text-sm font-medium">Buscando dados consolidados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
          Filtros de Relatório
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Marketplace */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Marketplace</label>
            <select
              value={mktFilter}
              onChange={(e) => setMktFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:bg-white focus:outline-none transition-all"
            >
              <option value="">Todos</option>
              {marketplaces.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Categoria</label>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:bg-white focus:outline-none transition-all"
            >
              <option value="">Todas</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">De (Início)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Até (Fim)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Faturamento Bruto</span>
            <strong className="text-lg font-extrabold text-slate-900 block mt-1">{formatBRL(valorVendido)}</strong>
            <span className="text-[10px] text-slate-500 block mt-1">Soma de vendas filtradas</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Lucro Líquido Real</span>
            <strong className="text-lg font-extrabold text-emerald-800 block mt-1">{formatBRL(lucroLiquido)}</strong>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Margem: {margemLiquida.toFixed(2)}%</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Volume de Pedidos</span>
            <strong className="text-lg font-extrabold text-slate-900 block mt-1">{totalPedidos} pedidos</strong>
            <span className="text-[10px] text-slate-500 block mt-1">Ticket Médio: {formatBRL(ticketMedio)}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Peças Faturadas</span>
            <strong className="text-lg font-extrabold text-slate-900 block mt-1">{totalQtdVendida} unidades</strong>
            <span className="text-[10px] text-slate-500 block mt-1">Estoque: {semEstoque} SKU zerados</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6">
          <h4 className="font-bold text-slate-800 text-sm">Exportar Planilhas de Produção</h4>
          <p className="text-xs text-slate-500 mt-1">
            Clique nos botões abaixo para fazer o download imediato dos relatórios em formato CSV, compatíveis com Microsoft Excel, Google Sheets ou LibreOffice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="border border-slate-200 p-5 rounded-xl bg-slate-50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <ShoppingCart className="w-5 h-5" />
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">Relatório de Vendas</h5>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Exporta a relação de pedidos registrados aplicando os filtros selecionados acima (Canais, Categorias, Períodos).
              </p>
            </div>
            <button
              onClick={exportOrdersReport}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
            >
              <Download className="w-4 h-4" />
              Baixar Vendas ({filteredOrders.length})
            </button>
          </div>

          <div className="border border-slate-200 p-5 rounded-xl bg-slate-50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">Catálogo / Produtos</h5>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Exporta a planilha com todos os SKU cadastrados, incluindo custos unitários de aquisição, quantidades em estoque e status de reposição.
              </p>
            </div>
            <button
              onClick={exportProductsReport}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
            >
              <Download className="w-4 h-4" />
              Baixar Produtos ({products.length})
            </button>
          </div>

          {/* 3. Categorias */}
          <div className="border border-slate-200 p-5 rounded-xl bg-slate-50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Layers className="w-5 h-5" />
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">Categorias</h5>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Exporta a lista completa de categorias registradas para fins de cruzamento e auditoria tributária/comercial.
              </p>
            </div>
            <button
              onClick={exportCategoriesReport}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
            >
              <Download className="w-4 h-4" />
              Baixar Categorias ({categories.length})
            </button>
          </div>

          <div className="border border-slate-200 p-5 rounded-xl bg-slate-50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Store className="w-5 h-5" />
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">Marketplaces</h5>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Exporta os canais de venda parceiros vinculados à operação, ideal para conciliação bancária/comissão.
              </p>
            </div>
            <button
              onClick={exportMarketplacesReport}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
            >
              <Download className="w-4 h-4" />
              Baixar Marketplaces ({marketplaces.length})
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
