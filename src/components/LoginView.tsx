import React, { useState } from "react";
import { Lock, User, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import api from "../api";

interface LoginViewProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { username, password });
      const { token, username: resUser } = response.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("username", resUser);
      
      onLoginSuccess(token, resUser);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.status === 401) {
        setError("Usuário ou senha incorretos.");
      } else {
        setError("Erro ao tentar conectar ao servidor local.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Absolute decorative glow overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10">
        {/* Brand visual header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">MktManager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão de Operações de Marketplace
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl text-sm mb-6 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Usuário
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Insira seu usuário"
                className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Senha
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 font-bold py-4 px-6 rounded-2xl text-sm hover:bg-emerald-400 active:scale-98 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {loading ? "Autenticando..." : "Entrar no Painel"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-8">
          Dev: Gabriel Farias {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
