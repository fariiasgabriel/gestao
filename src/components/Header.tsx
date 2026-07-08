import React, { useEffect, useState } from "react";
import { Bell, Clock, ShieldCheck, Menu } from "lucide-react";

interface HeaderProps {
  currentView: string;
  onMenuClick?: () => void;
}

export default function Header({ currentView, onMenuClick }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getViewTitle = () => {
    switch (currentView) {
      case "dashboard": return "Dashboard";
      case "products": return "Produtos";
      case "categories": return "Categorias";
      case "suppliers": return "Fornecedores";
      case "marketplaces": return "Marketplaces";
      case "orders": return "Pedidos & Vendas";
      case "expenses": return "Entradas & Gastos";
      case "reports": return "Relatórios";
      case "recommendations": return "Sugestão de Compra";
      case "settings": return "Configurações";
      default: return "Dashboard";
    }
  };

  const formattedTime = () => {
    return time.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className="bg-white border-b border-slate-200 h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 gap-3">
      {/* Hamburger + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate">
          {getViewTitle()}
        </h2>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Time - only sm+ */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-medium text-slate-600">
          <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>{formattedTime()}</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-emerald-50 text-emerald-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border border-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-mono hidden sm:inline">ONLINE</span>
        </div>

        {/* Bell */}
        <button className="p-2 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}
