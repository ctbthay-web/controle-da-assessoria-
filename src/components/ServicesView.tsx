import React, { useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, CheckSquare, Square, 
  Calendar, DollarSign, User, X, PlusCircle, Trash, Save, CheckCircle
} from "lucide-react";
import { Service, Client } from "../types";

interface ServicesViewProps {
  services: Service[];
  clients: Client[];
  onCreateService: (service: Omit<Service, "id">) => Promise<void>;
  onUpdateService: (id: string, service: Partial<Service>) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
}

export function ServicesView({
  services,
  clients,
  onCreateService,
  onUpdateService,
  onDeleteService
}: ServicesViewProps) {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form Fields
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState<Service["tipo"]>("BPO");
  const [valor, setValor] = useState(1000);
  const [status, setStatus] = useState<Service["status"]>("Pendente");
  const [responsavel, setResponsavel] = useState("Thayane Carvalho");
  const [prazo, setPrazo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [checklist, setChecklist] = useState<Array<{ id: string; tarefa: string; concluido: boolean }>>([]);
  const [newCheckItem, setNewCheckItem] = useState("");

  const handleOpenCreate = () => {
    setEditingService(null);
    setClienteId(clients.length > 0 ? clients[0].id : "");
    setTipo("BPO");
    setValor(1000);
    setStatus("Pendente");
    setResponsavel("Thayane Carvalho");
    setPrazo(new Date().toISOString().split("T")[0]);
    setObservacoes("");
    setChecklist([]);
    setNewCheckItem("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setClienteId(service.clienteId);
    setTipo(service.tipo);
    setValor(service.valor);
    setStatus(service.status);
    setResponsavel(service.responsavel);
    setPrazo(service.prazo);
    setObservacoes(service.observacoes || "");
    setChecklist(service.checklist || []);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return;

    const payload = {
      clienteId,
      clienteNome: clients.find(c => c.id === clienteId)?.name || "Desconhecido",
      tipo,
      valor: Number(valor),
      status,
      responsavel,
      prazo,
      checklist,
      observacoes
    };

    try {
      if (editingService) {
        await onUpdateService(editingService.id, payload);
      } else {
        await onCreateService(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("Erro ao salvar serviço em lote.");
    }
  };

  // Checklist Item modifiers
  const handleAddChecklist = () => {
    if (!newCheckItem.trim()) return;
    setChecklist([
      ...checklist,
      { id: "ci_" + Date.now().toString() + Math.random().toString(36).substring(3), tarefa: newCheckItem.trim(), concluido: false }
    ]);
    setNewCheckItem("");
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklist(checklist.filter(ci => ci.id !== id));
  };

  const handleToggleChecklistField = (id: string) => {
    setChecklist(checklist.map(ci => ci.id === id ? { ...ci, concluido: !ci.concluido } : ci));
  };

  // Checklist live state updater directly inside services card
  const handleToggleChecklistInDB = async (service: Service, itemId: string) => {
    const updatedChecklist = service.checklist.map(ci => 
      ci.id === itemId ? { ...ci, concluido: !ci.concluido } : ci
    );
    try {
      await onUpdateService(service.id, { checklist: updatedChecklist });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredServices = services.filter(s => {
    const term = searchQuery.toLowerCase();
    const matchSearch = 
      s.clienteNome.toLowerCase().includes(term) || 
      s.tipo.toLowerCase().includes(term) || 
      s.responsavel.toLowerCase().includes(term);
    
    const matchStatus = !statusFilter || s.status === statusFilter;
    const matchType = !typeFilter || s.tipo === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Gestão de Serviços contratados</h2>
          <p className="text-zinc-400 text-xs text-left">Acompanhe tarefas, checklists e controle de entregas por cliente.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-center shadow-lg shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Novo Processo / Serviço
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-4 shadow-md flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, responsável ou tarefa..."
            className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-9.5 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-550 focus:outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-350 outline-none focus:outline-none focus:border-blue-500"
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
        >
          <option value="">Status: Todos</option>
          <option value="Pendente">Pendente</option>
          <option value="Em Andamento">Em Andamento</option>
          <option value="Concluido">Concluído</option>
          <option value="Cancelado">Cancelado</option>
        </select>

        <select
          className="bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-355 outline-none focus:outline-none focus:border-blue-500"
          value={typeFilter || ""}
          onChange={(e) => setTypeFilter(e.target.value || null)}
        >
          <option value="">Tipo: Todos</option>
          <option value="IRPF">IRPF</option>
          <option value="MEI">MEI</option>
          <option value="Carne-leao">Carnê-leão</option>
          <option value="Regularizacao">Regularização</option>
          <option value="Parcelamentos">Parcelamentos</option>
          <option value="BPO">BPO Financeiro</option>
          <option value="Outros">Outros</option>
        </select>
      </div>

      {/* Services Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredServices.length === 0 ? (
          <div className="col-span-2 bg-[#111113] border border-white/5 rounded-xl py-12 text-center text-zinc-500 text-xs font-mono">
            Nenhum serviço mapeado com os filtros atuais.
          </div>
        ) : (
          filteredServices.map(service => {
            // Calculate checklist completeness progress percentage
            const totalTasks = service.checklist ? service.checklist.length : 0;
            const completedTasks = service.checklist ? service.checklist.filter(t => t.concluido).length : 0;
            const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div 
                key={service.id} 
                className="bg-[#111113] border border-white/5 hover:border-white/10 transition-all rounded-xl p-5 shadow-md space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Service type indicator + Menu */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono tracking-wider">
                        Serviço contratado
                      </span>
                      <h3 className="font-bold text-white text-sm leading-snug mt-0.5 text-left">{service.clienteNome}</h3>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      service.status === "Concluido" ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" :
                      service.status === "Em Andamento" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      service.status === "Cancelado" ? "bg-rose-500/10 text-rose-450 border-rose-500/15" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {service.status}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs">
                    <div className="p-2.5 bg-[#0c0c0e]/45 border border-white/5 rounded-lg flex-1">
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono">Tipo / Categoria</span>
                      <span className="font-semibold text-zinc-200">{service.tipo}</span>
                    </div>
                    <div className="p-2.5 bg-[#0c0c0e]/45 border border-white/5 rounded-lg flex-1">
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono">Honorário</span>
                      <span className="font-bold text-blue-400 font-mono">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Checklist Subtask list */}
                  <div className="space-y-2 pt-1 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-505 uppercase font-mono text-[9px]">Checklist de Etapas</span>
                      <span className="text-[10px] font-mono text-zinc-400">{completedTasks}/{totalTasks} ({pct}%)</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#0c0c0e] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    {totalTasks === 0 ? (
                      <div className="text-[11px] text-zinc-500 italic">Nenhuma subetapa estipulada.</div>
                    ) : (
                      <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
                        {service.checklist.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleChecklistInDB(service, item.id)}
                            className="flex items-center gap-2 text-xs text-zinc-350 hover:text-white cursor-pointer select-none"
                          >
                            {item.concluido ? (
                              <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                            )}
                            <span className={item.concluido ? "line-through text-zinc-500" : ""}>{item.tarefa}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {service.observacoes && (
                    <div className="text-[11px] bg-[#0c0c0e]/30 rounded-lg p-2.5 text-zinc-400 border border-white/5 text-left">
                      <strong>Orientações:</strong> {service.observacoes}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{service.responsavel}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold font-mono text-[9px] border border-amber-500/10">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Venc.: {new Date(service.prazo).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(service)}
                      className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded cursor-pointer transition-colors"
                      title="Alterar dados"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteService(service.id)}
                      className="p-1 hover:bg-rose-500/10 text-rose-455 rounded cursor-pointer transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Config Service Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/5 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0 bg-[#0c0c0e]">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                {editingService ? "Editar dados do Serviço" : "Cadastrar Demanda / Serviço"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Empresa / Cliente Vinculado</label>
                <select
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500 mb-1"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                >
                  <option value="">Selecione o Cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.cpfCnpj})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Tipo de Operação</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-350 outline-none"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as Service["tipo"])}
                  >
                    <option value="BPO">BPO Financeiro</option>
                    <option value="IRPF">Imposto de Renda Pessoa Física (IRPF)</option>
                    <option value="MEI">Microempreendedor (MEI)</option>
                    <option value="Carne-leao">Carnê-leão Mensal</option>
                    <option value="Regularizacao">Regularização</option>
                    <option value="Parcelamentos">Parcelamentos Fiscais</option>
                    <option value="Outros">Outras obrigações</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Valor dos Honorários (R$)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Responsável Interno</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-350 outline-none"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                  >
                    <option value="Thayane Carvalho">Thayane Carvalho</option>
                    <option value="Carlos Souza">Carlos Souza</option>
                    <option value="Beatriz Lima">Beatriz Lima</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Vencimento / Prazo</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Status do Processo</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-350 outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Service["status"])}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluido">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Subtask checklist creator */}
              <div className="p-3 bg-[#0c0c0e]/30 border border-white/5 rounded-lg space-y-3 shrink-1">
                <span className="text-zinc-400 text-xs uppercase font-mono font-bold block">Definir Sub-etapas Obrigatórias (Checklist)</span>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Conciliar extrato bancário"
                    className="flex-1 bg-[#0c0c0e] border border-white/5 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-550 focus:outline-none focus:border-blue-500"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklist();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklist}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors shadow-sm shadow-blue-500/10 active:scale-95 duration-100"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {checklist.length === 0 ? (
                    <span className="text-[10px] text-zinc-500 block italic">Nenhum checkbox estipulado para este fluxo.</span>
                  ) : (
                    checklist.map(ci => (
                      <div key={ci.id} className="flex items-center justify-between text-xs bg-[#0c0c0e]/45 border border-white/5 px-2.5 py-1.5 rounded">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                            checked={ci.concluido}
                            onChange={() => handleToggleChecklistField(ci.id)}
                          />
                          <span className={ci.concluido ? "line-through text-zinc-500" : "text-zinc-300"}>{ci.tarefa}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklist(ci.id)}
                          className="text-rose-455 hover:text-rose-400 cursor-pointer text-[10.5px] font-semibold"
                        >
                          Remover
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Notas e Direcionamentos</label>
                <textarea
                  rows={2}
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="Informações adicionais para o operador responsável..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 px-1 pt-4 border-t border-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/[0.03] text-zinc-300 text-xs font-semibold rounded-lg hover:bg-white/[0.06] border border-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Demanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
