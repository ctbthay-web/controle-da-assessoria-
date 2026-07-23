import React, { useState } from "react";
import { 
  History, Search, Filter, ShieldCheck, Download, Trash2, 
  Plus, RefreshCw, AlertTriangle, X, User, ShieldAlert,
  Clock, CheckCircle, FileText, Lock, Database
} from "lucide-react";
import { AuditLog, User as UserType } from "../types";

interface LogsViewProps {
  logs: AuditLog[];
  users: UserType[];
  onCreateLog: (acao: string, detalhes: string, usuarioNome?: string) => Promise<void>;
  onDeleteLog?: (id: string) => Promise<void>;
  onClearLogs?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export function LogsView({
  logs,
  users,
  onCreateLog,
  onDeleteLog,
  onClearLogs,
  onRefresh
}: LogsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Modal State
  const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [logAcao, setLogAcao] = useState("");
  const [logDetalhes, setLogDetalhes] = useState("");
  const [logUsuario, setLogUsuario] = useState("");
  const [savingLog, setSavingLog] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Set default user option
  React.useEffect(() => {
    if (users && users.length > 0 && !logUsuario) {
      setLogUsuario(users[0].name);
    }
  }, [users, logUsuario]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logAcao.trim() || !logDetalhes.trim()) return;

    const nomeFinal = logUsuario || (users[0] ? users[0].name : "Usuário do Sistema");

    setSavingLog(true);
    try {
      await onCreateLog(logAcao.trim(), logDetalhes.trim(), nomeFinal);
      setLogAcao("");
      setLogDetalhes("");
      setIsNewLogModalOpen(false);
    } catch {
      alert("Erro ao criar registro de log.");
    } finally {
      setSavingLog(false);
    }
  };

  const handleClearSubmit = async () => {
    if (!onClearLogs) return;
    setClearingLogs(true);
    try {
      await onClearLogs();
      setIsClearModalOpen(false);
    } catch {
      alert("Erro ao limpar histórico de logs.");
    } finally {
      setClearingLogs(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!onDeleteLog) return;
    if (confirm("Deseja realmente remover esta entrada de log de auditoria?")) {
      try {
        await onDeleteLog(id);
      } catch {
        alert("Erro ao excluir log.");
      }
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchSearch = 
      (log.usuarioNome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.acao || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.detalhes || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchUser = selectedUserFilter === "all" || log.usuarioNome === selectedUserFilter;

    let matchCategory = true;
    if (selectedCategoryFilter !== "all") {
      const acaoLower = (log.acao || "").toLowerCase();
      if (selectedCategoryFilter === "sessao") {
        matchCategory = acaoLower.includes("sessão") || acaoLower.includes("login") || acaoLower.includes("logout") || acaoLower.includes("senha");
      } else if (selectedCategoryFilter === "clientes") {
        matchCategory = acaoLower.includes("cliente");
      } else if (selectedCategoryFilter === "servicos") {
        matchCategory = acaoLower.includes("serviço") || acaoLower.includes("tarefa");
      } else if (selectedCategoryFilter === "financeiro") {
        matchCategory = acaoLower.includes("financeiro") || acaoLower.includes("movimento") || acaoLower.includes("caixa");
      } else if (selectedCategoryFilter === "supabase") {
        matchCategory = acaoLower.includes("supabase") || acaoLower.includes("banco") || acaoLower.includes("sincronização");
      } else if (selectedCategoryFilter === "manual") {
        matchCategory = acaoLower.includes("manual") || acaoLower.includes("revisão") || acaoLower.includes("anotação");
      }
    }

    return matchSearch && matchUser && matchCategory;
  });

  // Export to TXT / CSV
  const handleExportLogs = () => {
    const lines = [
      "=== ERP CONTÁBIL - TRILHA DE AUDITORIA E LOGS DO SISTEMA ===",
      `Data de Extração: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
      `Total de Registros Exportados: ${filteredLogs.length}`,
      "--------------------------------------------------------------------------------",
      ""
    ];

    filteredLogs.forEach((l, idx) => {
      const dateStr = l.timestamp ? new Date(l.timestamp).toLocaleString("pt-BR") : "N/I";
      lines.push(`[#${idx + 1}] DATA/HORA: ${dateStr}`);
      lines.push(`USUÁRIO: ${l.usuarioNome}`);
      lines.push(`EVENTO: ${l.acao}`);
      lines.push(`DETALHES: ${l.detalhes}`);
      lines.push("--------------------------------------------------------------------------------");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Audit_Logs_Sistema_${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
  };

  // Helper formatting badge for action type
  const getActionBadge = (acao: string) => {
    const lower = acao.toLowerCase();
    if (lower.includes("sessão") || lower.includes("login")) {
      return { label: acao, color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Lock };
    }
    if (lower.includes("criação") || lower.includes("novo") || lower.includes("nova")) {
      return { label: acao, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Plus };
    }
    if (lower.includes("exclusão") || lower.includes("remoção") || lower.includes("limpeza")) {
      return { label: acao, color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: Trash2 };
    }
    if (lower.includes("senha") || lower.includes("exibição")) {
      return { label: acao, color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: ShieldAlert };
    }
    if (lower.includes("supabase") || lower.includes("sincronização")) {
      return { label: acao, color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: Database };
    }
    return { label: acao, color: "bg-zinc-800 text-zinc-300 border-zinc-700", icon: CheckCircle };
  };

  // Stats calculation
  const totalLogsCount = logs.length;
  const nowMs = Date.now();
  const logsLast24h = logs.filter(l => l.timestamp && (nowMs - new Date(l.timestamp).getTime()) < 24 * 60 * 60 * 1000).length;

  return (
    <div className="space-y-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Logs do Sistema & Trilha de Auditoria</h1>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              Auditoria Ativa
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Histórico detalhado de atividades, acessos e modificações operacionais no ERP contábil.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-[#111113] hover:bg-white/[0.04] text-zinc-300 border border-white/5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>
          
          <button
            onClick={handleExportLogs}
            className="px-3 py-2 bg-[#111113] hover:bg-white/[0.04] text-zinc-200 border border-white/5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Exportar TXT</span>
          </button>

          <button
            onClick={() => setIsNewLogModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-md shadow-blue-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Log Manual</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-white/5 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-medium uppercase font-mono tracking-wider">Total de Eventos</span>
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{totalLogsCount}</div>
          <span className="text-[11px] text-zinc-500 font-mono mt-1 block">Registrados na base local & Supabase</span>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-medium uppercase font-mono tracking-wider">Últimas 24 Horas</span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight">{logsLast24h}</div>
          <span className="text-[11px] text-zinc-500 font-mono mt-1 block">Ocorrências registradas hoje</span>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-medium uppercase font-mono tracking-wider">Status do Log</span>
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-indigo-400 tracking-tight">100%</div>
          <span className="text-[11px] text-zinc-500 font-mono mt-1 block">Rastreabilidade em tempo real</span>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-medium uppercase font-mono tracking-wider">Gestão do Histórico</span>
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="mt-1 text-xs text-rose-400 hover:text-rose-300 font-bold font-mono underline cursor-pointer"
          >
            Redefinir Trilha de Logs
          </button>
          <span className="text-[11px] text-zinc-500 font-mono mt-1 block">Requer permissão de administrador</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Pesquisar por usuário, evento ou detalhes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* User Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="all">Todos os Usuários</option>
            {users.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="all">Todas as Categoria</option>
            <option value="sessao">Sessão e Acessos</option>
            <option value="clientes">Clientes (CRM)</option>
            <option value="servicos">Serviços e Tarefas</option>
            <option value="financeiro">Financeiro / Caixa</option>
            <option value="supabase">Supabase & Banco</option>
            <option value="manual">Registros Manuais</option>
          </select>
        </div>
      </div>

      {/* Main Audit Logs Table */}
      <div className="bg-[#111113] border border-white/5 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Registros da Trilha de Auditoria ({filteredLogs.length})
            </h2>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            Exibindo registros ordenados dos mais recentes para os mais antigos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0c0c0e] text-zinc-400 font-mono text-[10px] uppercase border-b border-white/5 tracking-wider">
                <th className="p-3.5 font-semibold w-48">Data e Horário</th>
                <th className="p-3.5 font-semibold w-48">Usuário / Operador</th>
                <th className="p-3.5 font-semibold w-52">Evento / Ação</th>
                <th className="p-3.5 font-semibold">Detalhes Operacionais</th>
                <th className="p-3.5 font-semibold w-16 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-500 font-mono text-xs">
                    Nenhum evento de log localizado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.acao);
                  const Icon = badge.icon;
                  const formattedDate = log.timestamp 
                    ? new Date(log.timestamp).toLocaleDateString("pt-BR") + " " + new Date(log.timestamp).toLocaleTimeString("pt-BR")
                    : "Em tempo real";

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-3.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                            {(log.usuarioNome || "U")[0]}
                          </div>
                          <span className="font-semibold text-zinc-200 text-xs">{log.usuarioNome || "Sistema"}</span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${badge.color}`}>
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="p-3.5 text-zinc-300 text-xs leading-relaxed font-mono">
                        {log.detalhes}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        {onDeleteLog && (
                          <button
                            onClick={() => handleDeleteSingle(log.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Excluir este log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Log Manual */}
      {isNewLogModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#111113] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setIsNewLogModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Registrar Evento de Auditoria</h3>
                <p className="text-[11px] text-zinc-500 font-sans leading-tight">Cria uma nova entrada de log manual na trilha do sistema.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">Usuário / Responsável pelo Log</label>
                <div className="space-y-2">
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    value={logUsuario}
                    onChange={(e) => setLogUsuario(e.target.value)}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role === 'admin' ? 'Administrador' : 'Colaborador'})
                      </option>
                    ))}
                    <option value="outro">+ Digitar outro nome...</option>
                  </select>
                  {(!logUsuario || logUsuario === "outro" || !users.some(u => u.name === logUsuario)) && (
                    <input
                      type="text"
                      placeholder="Digite o nome do usuário/responsável"
                      className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 placeholder-zinc-650 font-mono"
                      value={logUsuario === "outro" ? "" : logUsuario}
                      onChange={(e) => setLogUsuario(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">Ação / Fato Realizado</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conciliação Bancária Trimestral efetuada"
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 placeholder-zinc-650 font-mono"
                  value={logAcao}
                  onChange={(e) => setLogAcao(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">Detalhes Operacionais</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Descreva a atividade efetuada, cliente envolvido e conferências..."
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 placeholder-zinc-650 resize-none font-mono"
                  value={logDetalhes}
                  onChange={(e) => setLogDetalhes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsNewLogModalOpen(false)}
                  disabled={savingLog}
                  className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-50 text-zinc-300 border border-white/5 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLog}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/10"
                >
                  {savingLog && (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                  )}
                  {savingLog ? "Gravando..." : "Gravar Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Limpeza de Logs */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0e0e11] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Limpar Trilha de Auditoria</h3>
                <p className="text-[11px] text-zinc-500 font-mono">Esta ação é irreversível</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Tem certeza que deseja apagar permanentemente todos os registros da trilha de logs de auditoria do sistema?
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={clearingLogs}
                className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 border border-white/5 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearSubmit}
                disabled={clearingLogs}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-md shadow-rose-500/15"
              >
                {clearingLogs && (
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                )}
                {clearingLogs ? "Limpando..." : "Confirmar Limpeza"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
