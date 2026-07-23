import React, { useState } from "react";
import { 
  Plus, Search, CheckCircle, Clock, AlertCircle, MessageSquare, 
  User, CheckSquare, Square, X, Trash2, Calendar, Send, Save
} from "lucide-react";
import { Task, User as UserType } from "../types";

interface TasksViewProps {
  tasks: Task[];
  onCreateTask: (task: Partial<Task>) => Promise<void>;
  onUpdateTask: (id: string, task: Partial<Task>) => Promise<void>;
  onAddComment: (id: string, texto: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  users?: UserType[];
}

export function TasksView({
  tasks,
  onCreateTask,
  onUpdateTask,
  onAddComment,
  onDeleteTask,
  users = []
}: TasksViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // Form modal fields
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [prioridade, setPrioridade] = useState<Task["prioridade"]>("Media");
  const [responsavel, setResponsavel] = useState(() => users[0]?.name || "Thayane Carvalho");
  const [prazo, setPrazo] = useState("");
  const [checklist, setChecklist] = useState<Array<{ id: string; item: string; concluido: boolean }>>([]);
  const [newCheckItem, setNewCheckItem] = useState("");

  // Comment Thread popup drawer
  const [activeTaskComment, setActiveTaskComment] = useState<Task | null>(null);
  const [newCommentText, setNewCommentText] = useState("");

  const handleOpenCreate = () => {
    setTitulo("");
    setPrioridade("Media");
    setResponsavel(users[0]?.name || "Thayane Carvalho");
    setPrazo(new Date().toISOString().split("T")[0]);
    setChecklist([]);
    setNewCheckItem("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    try {
      await onCreateTask({
        titulo: titulo.trim(),
        prioridade,
        responsavel,
        status: "Pendente",
        checklist,
        prazo
      });
      setIsModalOpen(false);
    } catch {
      alert("Erro ao programar tarefa interna.");
    }
  };

  const handleCreateCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist([
      ...checklist,
      { id: "tc_" + Date.now().toString() + Math.random().toString(36).substring(3), item: newCheckItem.trim(), concluido: false }
    ]);
    setNewCheckItem("");
  };

  const handleRemoveCheckItem = (id: string) => {
    setChecklist(checklist.filter(ci => ci.id !== id));
  };

  // Toggle checklist inside active list in DB
  const handleToggleCheckDb = async (task: Task, itemId: string) => {
    const updatedCheck = task.checklist.map(ci => 
      ci.id === itemId ? { ...ci, concluido: !ci.concluido } : ci
    );
    try {
      await onUpdateTask(task.id, { checklist: updatedCheck });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatusMap: Record<Task["status"], Task["status"]> = {
      "Pendente": "Em Progresso",
      "Em Progresso": "Concluida",
      "Concluida": "Pendente"
    };
    const nextStatus = nextStatusMap[task.status];
    try {
      await onUpdateTask(task.id, { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDocComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeTaskComment) return;

    try {
      await onAddComment(activeTaskComment.id, newCommentText.trim());
      
      const refreshed = tasks.find(t => t.id === activeTaskComment.id);
      if (refreshed) {
        setActiveTaskComment(refreshed);
      }
      setNewCommentText("");
    } catch (err) {
      alert("Erro ao registrar comentário.");
    }
  };

  const getPriorityColor = (prio: Task["prioridade"]) => {
    switch (prio) {
      case "Alta": return "bg-rose-50 text-rose-700 border-rose-100 font-bold";
      case "Media": return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-slate-100 text-slate-700 border-slate-150";
    }
  };

  const filteredTasks = tasks.filter(t => {
    const term = searchQuery.toLowerCase();
    const matchSearch = 
      t.titulo.toLowerCase().includes(term) ||
      t.responsavel.toLowerCase().includes(term);

    const matchPriority = !priorityFilter || t.prioridade === priorityFilter;

    return matchSearch && matchPriority;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Afazeres & Tarefas Internas</h2>
          <p className="text-zinc-400 text-xs text-left">Organização interna do time contábil, atribuições e metas diárias.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-center shadow-lg shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa Interna
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-4 shadow-md flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por tarefa, responsável..."
            className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-9.5 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
          value={priorityFilter || ""}
          onChange={(e) => setPriorityFilter(e.target.value || null)}
        >
          <option value="">Prioridade: Todas</option>
          <option value="Alta">Alta</option>
          <option value="Media">Média</option>
          <option value="Baixa">Baixa</option>
        </select>
      </div>

      {/* Card lists layout style Notion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-2 bg-[#111113] border border-white/5 rounded-xl py-12 text-center text-zinc-505 text-xs font-mono">
            A lista está limpa. Parabéns pelas entregas!
          </div>
        ) : (
          filteredTasks.map((task) => {
            const tot = task.checklist ? task.checklist.length : 0;
            const comp = task.checklist ? task.checklist.filter(c => c.concluido).length : 0;

            const localizedPriorityColor = task.prioridade === "Alta" 
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/25 font-bold"
              : task.prioridade === "Media"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-zinc-500/10 text-zinc-400 border border-white/5";

            return (
              <div 
                key={task.id} 
                className="bg-[#111113] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8.5px] uppercase font-bold px-2 py-0.5 rounded ${localizedPriorityColor}`}>
                          {task.prioridade}
                        </span>
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                          task.status === "Concluida" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                          task.status === "Em Progresso" ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" : "bg-zinc-500/15 text-zinc-400"
                        }`}>
                          {task.status === "Concluida" ? "Concluída" : task.status === "Em Progresso" ? "Em Progresso" : "Pendente"}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm leading-snug text-left">{task.titulo}</h4>
                    </div>
                  </div>

                  {/* Checklist display */}
                  {tot > 0 && (
                    <div className="space-y-1.5 bg-[#0c0c0e]/30 p-3 rounded-lg border border-white/5 text-left">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase block font-mono">Etapas de Trabalho ({comp}/{tot})</span>
                      <div className="space-y-1">
                        {task.checklist.map((ci) => (
                          <div 
                            key={ci.id}
                            onClick={() => handleToggleCheckDb(task, ci.id)}
                            className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer hover:text-white"
                          >
                            {ci.concluido ? (
                              <CheckSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                            )}
                            <span className={ci.concluido ? "line-through text-zinc-500" : "text-zinc-300"}>{ci.item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Micro menu controls at bottom of task card */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {task.responsavel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Até {new Date(task.prazo).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                      title="Girar status"
                    >
                      Mudar Status
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveTaskComment(task);
                        setNewCommentText("");
                      }}
                      className="hover:bg-white/5 p-1 rounded text-blue-400 hover:text-blue-300 font-semibold cursor-pointer flex items-center gap-0.5 transition-colors"
                      title="Fórum de comentários"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>({task.comentarios ? task.comentarios.length : 0})</span>
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 hover:bg-rose-500/10 text-rose-455 hover:text-rose-400 rounded transition-colors cursor-pointer"
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

      {/* 1. Register Task popup dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/5 rounded-xl w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0 bg-[#0c0c0e]">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                Criar Nova Tarefa Interna
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Título da Atividade</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Assinar certidões da prefeitura"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Prioridade Especial</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as any)}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Media">Média</option>
                    <option value="Alta">Alta (Imediata)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Vencimento da Atividade</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Responsável Associado</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-355 outline-none"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                  >
                    {users.length > 0 ? (
                      users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))
                    ) : (
                      <option value="Thayane Carvalho">Thayane Carvalho</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Sub Checkitems layout inside form */}
              <div className="p-3 bg-[#0c0c0e]/30 border border-white/5 rounded-lg space-y-3 shrink-1">
                <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold block">Definir Sub-ações (Opcional)</span>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Coleta assinatura"
                    className="flex-1 bg-[#0c0c0e] border border-white/5 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCheckItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCheckItem}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors shadow-sm shadow-blue-500/10 active:scale-95 duration-100"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {checklist.map(ci => (
                    <div key={ci.id} className="flex items-center justify-between text-xs bg-[#0c0c0e]/45 border border-white/5 px-2.5 py-1.5 rounded">
                      <span className="text-zinc-300">{ci.item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCheckItem(ci.id)}
                        className="text-rose-455 hover:text-rose-400 cursor-pointer text-[11px] font-semibold"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 px-1 pt-4 border-t border-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 border border-white/5 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Interactive Comments thread panel right slider */}
      {activeTaskComment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-[#111113] border-l border-white/5 w-full max-w-sm h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-205 text-left">
            <div className="flex items-center justify-between px-6 py-5 border-b shrink-0 bg-[#0c0c0e] text-white border-white/5">
              <div>
                <span className="text-[9px] text-zinc-400 font-mono tracking-wider uppercase block">Time Fórum</span>
                <h3 className="font-bold text-sm leading-tight text-left text-white truncate max-w-[285px]">{activeTaskComment.titulo}</h3>
              </div>
              <button
                onClick={() => setActiveTaskComment(null)}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Comment adding Thread */}
            <form onSubmit={handleSaveDocComment} className="p-4 border-b border-white/5 bg-[#0c0c0e] shrink-0">
              <label className="block text-zinc-400 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono text-left">Mandar Comentário Interno</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Seu conselho ou atualização p/ equipe..."
                  className="flex-1 bg-[#111113] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center shrink-0 transition-colors shadow-sm shadow-blue-500/10 hover:bg-blue-500"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Messages box list */}
            <div className="flex-1 p-5 space-y-4">
              <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono block text-left">Histórico de Discussão</span>
              
              {!activeTaskComment.comentarios || activeTaskComment.comentarios.length === 0 ? (
                <div className="text-center text-zinc-400 text-xs py-8 font-mono">Vazio. Compartilhe um alinhamento sobre a tarefa.</div>
              ) : (
                <div className="space-y-3">
                  {activeTaskComment.comentarios.map((cmt) => (
                    <div key={cmt.id} className="bg-[#0c0c0e]/45 border border-white/5 rounded-lg p-3 text-xs text-left">
                      <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400 mb-1">
                        <span className="font-bold text-zinc-300 bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded">{cmt.autor}</span>
                        <span>{new Date(cmt.data).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed font-sans">{cmt.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
