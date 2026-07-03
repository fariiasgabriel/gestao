import React, { useEffect, useState } from "react";
import { Bell, Calendar, Clock, ShieldCheck } from "lucide-react";

interface HeaderProps {
  currentView: string;
}

export default function Header({ currentView }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getViewTitle = () => {
    switch (currentView) {
      case "dashboard": return "Painel Geral / Dashboard";
      case "products": return "Catálogo de Produtos";
      case "categories": return "Gerenciamento de Categorias";
      case "suppliers": return "Gerenciamento de Fornecedores";
      case "marketplaces": return "Canais de Marketplaces";
      case "orders": return "Lançador de Pedidos & Vendas";
      case "expenses": return "Entradas de Estoque & Gastos";
      case "reports": return "Relatórios Operacionais";
      case "recommendations": return "Previsão e Sugestões de Compra";
      case "settings": return "Configurações Globais";
      default: return "Marketplace Operations Manager";
    }
  };

  const formattedDate = () => {
    return time.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formattedTime = () => {
    return time.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <header className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Title block */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{getViewTitle()}</h2>
        <p className="text-xs text-slate-500 font-mono hidden md:block">
          Marketplace Business Intelligence Console
        </p>
      </div>

      {/* Dynamic Actions & Metrics Block */}
      <div className="flex items-center gap-6">
        {/* Date and Time block */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl text-slate-600">
          <div className="flex items-center gap-1.5 text-xs font-medium border-r border-slate-200 pr-3.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="capitalize">{formattedDate()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
            <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>{formattedTime()}</span>
          </div>
        </div>

        {/* Database status */}
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-mono">ONLINE (localhost)</span>
        </div>

        {/* Action Button */}
        <button className="p-2.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
}
