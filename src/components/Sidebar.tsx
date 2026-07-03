import React from "react";
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Store, 
  ShoppingCart, 
  FileText, 
  Settings, 
  LogOut,
  TrendingUp,
  Lightbulb,
  DollarSign,
  Building2
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentView, onNavigate, onLogout }: SidebarProps) {
  const username = localStorage.getItem("username") || "Gabriel";
  const userInitials = username.substring(0, 2).toUpperCase();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Produtos", icon: Package },
    { id: "categories", label: "Categorias", icon: FolderTree },
    { id: "suppliers", label: "Fornecedores", icon: Building2 },
    { id: "marketplaces", label: "Marketplaces", icon: Store },
    { id: "orders", label: "Pedidos", icon: ShoppingCart },
    { id: "expenses", label: "Entradas e Gastos", icon: DollarSign },
    { id: "reports", label: "Relatórios", icon: FileText },
    { id: "recommendations", label: "Sugestão de Compra", icon: Lightbulb },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-emerald-500 rounded-lg text-slate-900">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">MktManager</h1>
          <span className="text-xs text-slate-400 font-mono">v1.0.0 Local</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer Account / Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-3 rounded-xl mb-2 bg-slate-800/40">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{username}</p>
            <p className="text-xs text-slate-400 truncate">{username.toLowerCase()}@mktmanager.com</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </div>
  );
}
