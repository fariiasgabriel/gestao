import React, { useState } from "react";
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
  Building2,
  X
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentView, onNavigate, onLogout, isOpen = true, onClose }: SidebarProps) {
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

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 text-slate-100 flex flex-col h-[100dvh] lg:h-screen border-r border-slate-800
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:transition-none
      `}>
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg text-slate-900">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base leading-tight tracking-tight">MktManager</h1>
            <span className="text-xs text-slate-400 font-mono">v1.0.0</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl mb-1.5 bg-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{username}</p>
              <p className="text-xs text-slate-400 truncate">{username.toLowerCase()}@marketapp.com</p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </div>
    </>
  );
}
