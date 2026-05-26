import React from "react";
import { 
  Users, Briefcase, TrendingUp, AlertTriangle, 
  Clock, DollarSign, Calendar, Eye, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, FileText
} from "lucide-react";
import { FiscalDeadline, AuditLog } from "../types";

interface DashboardStats {
  activeClientsCount: number;
  inProgressServicesCount: number;
  receitaMensal: number;
  despesaMensal: number;
  aReceber: number;
  inadimplente: number;
  nearDeadlines: FiscalDeadline[];
  recentLogs: AuditLog[];
}

interface DashboardViewProps {
  stats: DashboardStats;
  loading: boolean;
  onNavigateToModule: (module: string) => void;
}

export function DashboardView({ stats, loading, onNavigateToModule }: DashboardViewProps) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"></div>
          <div className="h-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"></div>
        </div>
      </div>
    );
  }

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const balance = stats.receitaMensal - stats.despesaMensal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Escritório Geral</h1>
          <p className="text-zinc-400 text-xs">Visão consolidada e controle de obrigações em tempo real.</p>
        </div>
        <div className="text-zinc-400 text-xs font-mono bg-[#111113] px-3 py-1.5 rounded-lg border border-white/5 self-start md:self-center">
          Atualização: {new Date().toLocaleDateString("pt-BR")} | {new Date().toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"})}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Clientes */}
        <div 
          onClick={() => onNavigateToModule("clientes")}
          className="bg-[#111113] hover:bg-white/[0.01] hover:border-white/10 transition-all duration-200 rounded-xl border border-white/5 p-5 cursor-pointer shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Clientes Ativos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{stats.activeClientsCount}</div>
          <div className="text-xs text-blue-400 font-medium flex items-center gap-1 mt-2.5">
            Ver carteira de clientes <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 2: Serviços */}
        <div 
          onClick={() => onNavigateToModule("serviços")}
          className="bg-[#111113] hover:bg-white/[0.01] hover:border-white/10 transition-all duration-200 rounded-xl border border-white/5 p-5 cursor-pointer shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Serviços Ativos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{stats.inProgressServicesCount}</div>
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-2.5">
            Ver processos em aberto <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Receitas consolidadas */}
        <div 
          onClick={() => onNavigateToModule("financeiro")}
          className="bg-[#111113] hover:bg-white/[0.01] hover:border-white/10 transition-all duration-200 rounded-xl border border-white/5 p-5 cursor-pointer shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Faturamento Pago</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-450">{formatBRL(stats.receitaMensal)}</div>
          <div className="text-xs text-emerald-500 mt-2.5 flex items-center gap-1 font-mono">
            <span className="font-semibold">{stats.aReceber > 0 ? `+ ${formatBRL(stats.aReceber)} a receber` : 'Tudo em dia'}</span>
          </div>
        </div>

        {/* KPI 4: Inadimplente */}
        <div 
          onClick={() => onNavigateToModule("financeiro")}
          className="bg-[#111113] hover:bg-white/[0.01] hover:border-white/10 transition-all duration-200 rounded-xl border border-white/5 p-5 cursor-pointer shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Inadimplência</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-500">{formatBRL(stats.inadimplente)}</div>
          <div className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-2.5">
            Visualizar pendentes <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visual Cash Flow & Near Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111113] border border-white/5 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-150 uppercase tracking-wider font-mono">DRE do Mês & Balanço Geral</h3>
                <p className="text-xs text-zinc-400">Comparativo líquido de ingressos versus despesas operacionais.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Saldo Líquido</span>
                <div className={`text-base font-bold ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatBRL(balance)}
                </div>
              </div>
            </div>

            {/* Simulated Clean Graphic via styled custom components to ensure zero build layout breaks */}
            <div className="h-44 flex items-end justify-around border-b border-white/5 pb-1 pt-4 font-mono text-[10px]">
              <div className="flex flex-col items-center gap-2 w-full max-w-[100px]">
                <div className="h-28 bg-emerald-500/5 hover:bg-emerald-500/10 w-full rounded flex items-end justify-center pb-2 border-t-2 border-emerald-500 transition-all">
                  <span className="font-bold text-emerald-400">{formatBRL(stats.receitaMensal)}</span>
                </div>
                <span className="text-zinc-500 uppercase font-semibold text-[9px] tracking-wider">Receitas</span>
              </div>

              <div className="flex flex-col items-center gap-2 w-full max-w-[100px]">
                <div className="h-16 bg-rose-500/5 hover:bg-rose-500/10 w-full rounded flex items-end justify-center pb-2 border-t-2 border-rose-500 transition-all">
                  <span className="font-bold text-rose-400">{formatBRL(stats.despesaMensal)}</span>
                </div>
                <span className="text-zinc-500 uppercase font-semibold text-[9px] tracking-wider">Despesas</span>
              </div>

              <div className="flex flex-col items-center gap-2 w-full max-w-[100px]">
                <div className="h-10 bg-[#2563eb]/5 hover:bg-[#2563eb]/10 w-full rounded flex items-end justify-center pb-2 border-t-2 border-blue-500 transition-all">
                  <span className="font-bold text-blue-400">{formatBRL(stats.aReceber)}</span>
                </div>
                <span className="text-zinc-500 uppercase font-semibold text-[9px] tracking-wider">A Receber</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center mt-4 text-xs font-mono">
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-lg">
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold tracking-wider">Margem Operacional</span>
                <span className="font-bold text-zinc-100 text-sm">
                  {stats.receitaMensal > 0 ? ((balance / stats.receitaMensal) * 100).toFixed(1) + "%" : "0%"}
                </span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-lg">
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold tracking-wider">Faturamento Futuro</span>
                <span className="font-bold text-zinc-100 text-sm">{formatBRL(stats.aReceber)}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-lg">
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold tracking-wider">Índice Inadimplência</span>
                <span className="font-bold text-rose-400 text-sm">
                  {stats.receitaMensal > 0 ? ((stats.inadimplente / stats.receitaMensal) * 100).toFixed(1) + "%" : "0%"}
                </span>
              </div>
            </div>
          </div>

          {/* Near Deadlines Widget */}
          <div className="bg-[#111113] border border-white/5 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-150 uppercase tracking-wider font-mono">Prazos e Obrigações Fiscais Iminentes</h3>
                <p className="text-xs text-zinc-400">Próximos impostos e obrigações de clientes a vencer.</p>
              </div>
              <button 
                onClick={() => onNavigateToModule("prazos fiscais")}
                className="text-xs text-blue-400 font-semibold hover:text-blue-300 transition-colors uppercase tracking-wider font-mono text-[10px]"
              >
                Gerenciar Todos →
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {stats.nearDeadlines.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">Nenhum imposto pendente no momento.</div>
              ) : (
                stats.nearDeadlines.map((dl) => (
                  <div key={dl.id} className="py-3 flex items-center justify-between text-xs group hover:bg-white/[0.01] px-2 rounded-lg transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400 bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.5 rounded font-mono text-[10px]">{dl.titulo}</span>
                        <span className="text-zinc-200 font-medium">{dl.clienteNome}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] font-sans">{dl.descricao}</p>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-zinc-100">{dl.valor ? formatBRL(dl.valor) : "R$ 0,00"}</div>
                      <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-mono font-bold mt-1 ${
                        dl.status === "Vencido" 
                          ? "bg-rose-500/10 text-rose-450 border border-rose-500/20" 
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        Até {new Date(dl.prazo).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active System Audit Logs */}
        <div className="bg-[#111113] border border-white/5 rounded-xl p-6 shadow-md self-start">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider font-mono">Eventos de Auditoria</h3>
              <p className="text-xs text-zinc-500">Logs internos e monitoramento de segurança.</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>

          <div className="space-y-3">
            {stats.recentLogs.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs font-mono">Sem atividades registradas no sistema.</div>
            ) : (
              stats.recentLogs.map((log) => (
                <div key={log.id} className="text-xs leading-normal bg-white/[0.01] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5 font-mono text-[9px]">
                    <span className="font-bold text-blue-450 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/15">
                      {log.usuarioNome}
                    </span>
                    <span className="text-zinc-500">
                      {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  <div className="font-semibold text-zinc-200">{log.acao}</div>
                  <p className="text-zinc-400 text-[11px] mt-1 leading-snug">{log.detalhes}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
