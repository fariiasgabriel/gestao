import React from "react";
import { 
  Settings, 
  Database, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Server,
  BookOpen,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export default function ConfigView() {
  return (
    <div className="space-y-6">
      {/* 1. System Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          Status Operacional do Sistema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Servidor Web</span>
              <strong className="text-xs text-slate-800">Express + Vite (Porta 3000)</strong>
            </div>
          </div>
          <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Backend Core</span>
              <strong className="text-xs text-slate-800">Spring Boot (Porta 8080)</strong>
            </div>
          </div>
          <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Banco de Dados</span>
              <strong className="text-xs text-slate-800">PostgreSQL (Local / Container)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Installation Documentation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Guia de Execução Local em Produção
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Instruções passo-a-passo para instalar e rodar a arquitetura completa no seu computador (localhost).
          </p>
        </div>

        <div className="space-y-4">
          {/* Step 1: Database */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs font-mono">
              1
            </div>
            <div>
              <h5 className="font-bold text-slate-800 text-xs">Preparar Banco PostgreSQL</h5>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Crie um banco de dados vazio chamado <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">marketplace_db</code> no seu servidor local PostgreSQL.
              </p>
              <div className="bg-slate-900 text-slate-300 p-3.5 rounded-xl font-mono text-[11px] mt-2 border border-slate-800 leading-relaxed">
                CREATE DATABASE marketplace_db;<br />
                CREATE USER market_user WITH PASSWORD 'admin123';<br />
                GRANT ALL PRIVILEGES ON DATABASE marketplace_db TO market_user;
              </div>
            </div>
          </div>

          {/* Step 2: Backend */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs font-mono">
              2
            </div>
            <div>
              <h5 className="font-bold text-slate-800 text-xs">Inicializar API Spring Boot</h5>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Navegue até a pasta <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">/backend</code>, instale as dependências Maven e compile o microsserviço.
              </p>
              <div className="bg-slate-900 text-slate-300 p-3.5 rounded-xl font-mono text-[11px] mt-2 border border-slate-800 leading-relaxed">
                cd backend<br />
                mvn clean install<br />
                mvn spring-boot:run
              </div>
            </div>
          </div>

          {/* Step 3: Frontend */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs font-mono">
              3
            </div>
            <div>
              <h5 className="font-bold text-slate-800 text-xs">Inicializar Painel Web Frontend</h5>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Instale as dependências com npm e suba o servidor de desenvolvimento.
              </p>
              <div className="bg-slate-900 text-slate-300 p-3.5 rounded-xl font-mono text-[11px] mt-2 border border-slate-800 leading-relaxed">
                npm install<br />
                npm run dev
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Credentials & Security Information */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Segurança e Autenticação
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          O sistema utiliza o padrão da indústria **JWT (JSON Web Token)** para sessões seguras e stateless. Todas as rotas REST que envolvem alteração de dados do catálogo ou lançamento de pedidos exigem o cabeçalho <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">Authorization: Bearer [token]</code>. O tempo padrão de expiração do token local é de 24 horas.
        </p>
      </div>
    </div>
  );
}
