import React, { useState } from "react";
import { 
  Plus, Search, Calendar, FileText, CheckCircle, Clock, 
  AlertCircle, DollarSign, X, CheckSquare, RefreshCw, Save, Trash2
} from "lucide-react";
import { FiscalDeadline, Client } from "../types";

interface DeadlinesViewProps {
  deadlines: FiscalDeadline[];
  clients: Client[];
  onCreateDeadline: (deadline: Omit<FiscalDeadline, "id">) => Promise<void>;
  onUpdateDeadline: (id: string, deadline: Partial<FiscalDeadline>) => Promise<void>;
  onDeleteDeadline: (id: string) => Promise<void>;
}

export function DeadlinesView({
  deadlines,
  clients,
  onCreateDeadline,
  onUpdateDeadline,
  onDeleteDeadline
}: DeadlinesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [titulo, setTitulo] = useState<'DAS' | 'DARF' | 'IRPF' | 'DASNS-Simei' | 'EFD Reinf' | 'GIA' | 'Outros'>("GIA");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [status, setStatus] = useState<FiscalDeadline["status"]>("Pendência");
  const [clienteId, setClienteId] = useState("");
  const [valor, setValor] = useState(0);

  const handleOpenCreate = () => {
    setTitulo("GIA");
    setDescricao("");
    setPrazo(new Date().toISOString().split("T")[0]);
    setStatus("Pendência");
    setClienteId(clients.length > 0 ? clients[0].id : "");
    setValor(0);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !prazo) return;

    try {
      await onCreateDeadline({
        titulo,
        descricao: descricao.trim() || `${titulo} - Exercício Corrente`,
        prazo,
        status,
        clienteId,
        clienteNome: clients.find(c => c.id === clienteId)?.name || "Geral",
        valor: Number(valor) || 0
      });
      setIsModalOpen(false);
    } catch {
      alert("Erro ao estipular compromisso fiscal.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: FiscalDeadline["status"]) => {
    let nextStatus: FiscalDeadline["status"] = "Pendência";
    if (currentStatus === "Pendência") nextStatus = "Guia Emitida";
    else if (currentStatus === "Guia Emitida") nextStatus = "Pago";
    else if (currentStatus === "Pago") nextStatus = "Pendência";

    try {
      await onUpdateDeadline(id, { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDeadlines = deadlines.filter(d => {
    const term = searchQuery.toLowerCase();
    const matchSearch = 
      d.clienteNome.toLowerCase().includes(term) ||
      d.titulo.toLowerCase().includes(term) ||
      d.descricao.toLowerCase().includes(term);
    
    const matchStatus = !statusFilter || d.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: FiscalDeadline["status"]) => {
    switch (status) {
      case "Pago": return "bg-emerald-50 text-emerald-600 border-emerald-150";
      case "Guia Emitida": return "bg-indigo-50 text-indigo-600 border-indigo-150";
      case "Vencido": return "bg-rose-50 text-rose-600 border-rose-150";
      default: return "bg-amber-50 text-amber-600 border-amber-150";
    }
  };

  const formatBRL = (val?: number) => {
    if (!val) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Obrigações e Impostos Fiscais</h2>
          <p className="text-zinc-400 text-xs text-left">Geração de guias DAS, DARF e IRPF, controle de competências federais, estaduais e municipais.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2 self-start sm:self-center shadow-lg shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Adicionar Imposto p/ Apuração
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-4 shadow-md flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por imposto, cliente ou competência..."
            className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-9.5 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
        >
          <option value="">Status: Todos</option>
          <option value="Pendência">Pendência (Apuração)</option>
          <option value="Guia Emitida">Guia Emitida (Com Cliente)</option>
          <option value="Pago">Quitada / Paga</option>
          <option value="Vencido">Vencida / Atrasada</option>
        </select>
      </div>

      {/* Columns Grid */}
      <div className="bg-[#111113] border border-white/5 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0c0c0e] border-b border-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-6 py-3.5 font-bold">Imposto / Guia</th>
                <th className="px-6 py-3.5 font-bold">Cliente Vinculado</th>
                <th className="px-6 py-3.5 font-bold">Histórico / Descrição</th>
                <th className="px-6 py-3.5 font-bold">Vencimento</th>
                <th className="px-6 py-3.5 font-bold text-right">Valor Apurado</th>
                <th className="px-6 py-3.5 font-bold text-center">Status Operacional</th>
                <th className="px-6 py-3.5 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {filteredDeadlines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500 font-mono">Nenhum vencimento fiscal programado para apuração.</td>
                </tr>
              ) : (
                filteredDeadlines.map((dl) => (
                  <tr key={dl.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-white bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded font-mono text-[10.5px] block text-center max-w-[90px]">
                        {dl.titulo}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-zinc-100 leading-tight">
                      {dl.clienteNome}
                    </td>
                    <td className="px-6 py-3.5 text-zinc-400 max-w-xs leading-normal">
                      {dl.descricao}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-zinc-300 text-[10.5px]">
                      {new Date(dl.prazo).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-blue-400 font-mono">
                      {formatBRL(dl.valor)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(dl.id, dl.status)}
                        className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border font-bold cursor-pointer hover:opacity-85 transition-opacity ${
                          dl.status === "Pago" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : dl.status === "Guia Emitida"
                            ? "bg-blue-500/10 text-blue-450 border-blue-500/20"
                            : dl.status === "Vencido"
                            ? "bg-rose-500/10 text-rose-450 border-rose-500/15"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                        title="Clique p/ girar status"
                      >
                        <RefreshCw className="w-3 h-3 text-current animate-spin-hover" />
                        {dl.status}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => onDeleteDeadline(dl.id)}
                        className="p-1 hover:bg-rose-500/10 text-rose-450 rounded transition-colors cursor-pointer"
                        title="Remover guia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax input register popup modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/5 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0c0c0e]">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                Adicionar Vencimento de Apuração
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-450 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Empresa / Cliente</label>
                <select
                  required
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                >
                  <option value="">Selecione o Cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-zinc-450 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Imposto / Livro</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value as any)}
                  >
                    <option value="DAS">DAS Simples Nacional</option>
                    <option value="DARF">DARF Imposto Federal</option>
                    <option value="IRPF">IRPF Declaração Quota</option>
                    <option value="GIA">GIA Estadual</option>
                    <option value="EFD Reinf">EFD Reinf Retenção</option>
                    <option value="DASNS-Simei">Declaração Anual MEI</option>
                    <option value="Outros">Outras obrigações</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-450 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Vencimento Legal</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-450 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Status Apuração</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Pendência">Pendência (Apuração p/ Fazer)</option>
                    <option value="Guia Emitida">Guia Emitida (Com Cliente)</option>
                    <option value="Pago">Quitada / Pago</option>
                    <option value="Vencido">Inadimplência / Vencida</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#ffffff85] text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Valor do Imposto (R$)</label>
                  <input
                    type="number"
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    placeholder="Deixe R$ 0,00 se isento"
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-450 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Descrição / Competência (Ex: Ref. Abril 2026)</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Simples Nacional Ref Competência 04/2026"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  Programar Apuração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
