import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import ProductsView from "./components/ProductsView";
import CategoriesView from "./components/CategoriesView";
import MarketplacesView from "./components/MarketplacesView";
import OrdersView from "./components/OrdersView";
import ReportsView from "./components/ReportsView";
import ConfigView from "./components/ConfigView";
import RecommendationsView from "./components/RecommendationsView";
import ExpensesView from "./components/ExpensesView";
import SuppliersView from "./components/SuppliersView";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(localStorage.getItem("username"));
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("username");
    if (storedToken) {
      setToken(storedToken);
      setUsername(storedUser);
    }
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: string) => {
    setToken(newToken);
    setUsername(newUser);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername(null);
  };

  if (!token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const renderViewContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />;
      case "products":
        return <ProductsView />;
      case "categories":
        return <CategoriesView />;
      case "suppliers":
        return <SuppliersView />;
      case "marketplaces":
        return <MarketplacesView />;
      case "orders":
        return <OrdersView />;
      case "expenses":
        return <ExpensesView />;
      case "reports":
        return <ReportsView />;
      case "recommendations":
        return <RecommendationsView />;
      case "settings":
        return <ConfigView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-600 font-sans antialiased">
      {/* Sidebar: hidden on mobile, always visible on lg+ */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-0">
        <Header
          currentView={currentView}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {renderViewContent()}
        </main>
      </div>
    </div>
  );
}
