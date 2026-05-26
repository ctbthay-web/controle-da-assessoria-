import React, { useState } from "react";
import { 
  Plus, Calendar, Clock, MapPin, Trash2, X, PlusCircle, 
  MapPinCheck, Info, Users, Video, ClipboardList, Save
} from "lucide-react";
import { ScheduleEvent, Client } from "../types";

interface SchedulesViewProps {
  events: ScheduleEvent[];
  clients: Client[];
  onCreateEvent: (event: Omit<ScheduleEvent, "id">) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export function SchedulesView({
  events,
  clients,
  onCreateEvent,
  onDeleteEvent
}: SchedulesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [categoria, setCategoria] = useState<ScheduleEvent["categoria"]>("Reuniao");

  // Filter schedules preview to future or past events
  const sortedEvents = [...events].sort((a,b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());

  const handleOpenCreate = () => {
    setTitulo("");
    setDescricao("");
    setClienteId("");
    setCategoria("Reuniao");
    
    // Set default dates
    const now = new Date();
    const isoNow = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    setDataInicio(isoNow);
    
    // 1 hour later
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setDataFim(later.toISOString().slice(0, 16));
    
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !dataInicio) return;

    try {
      await onCreateEvent({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        dataInicio,
        dataFim,
        clienteId: clienteId || undefined,
        categoria
      });
      setIsModalOpen(false);
    } catch {
      alert("Erro ao marcar reunião.");
    }
  };

  const getCategoryTheme = (cat: ScheduleEvent["categoria"]) => {
    switch (cat) {
      case "Reuniao": return "bg-indigo-50 border-indigo-200 text-indigo-700";
      case "Fiscal": return "bg-rose-50 border-rose-200 text-rose-700";
      case "Entrega": return "bg-amber-50 border-amber-200 text-amber-700";
      default: return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };
  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Agenda & Compromissos</h2>
          <p className="text-zinc-400 text-xs text-left">Controle de reuniões, prazos com clientes e vistorias administrativas.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-center shadow-lg shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Marcar Evento / Reunião
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual Sim-Calendar overview */}
        <div className="lg:col-span-2 bg-[#111113] border border-white/5 rounded-xl p-5 shadow-md text-center">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2.5">
            <span className="font-bold text-white text-xs uppercase font-mono tracking-wider">Maio 2026</span>
            <div className="flex gap-1.5 text-xs text-zinc-500 font-mono">
              <span>Mês de Competência fiscal</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2.5 mb-2.5">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, index) => (
              <span key={d} className={`text-[10px] uppercase font-bold text-zinc-500 font-mono text-center ${index === 0 ? "text-rose-400" : ""}`}>
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {[...Array(31)].map((_, i) => {
              const dayNum = i + 1;
              const formattedDay = `2026-05-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              
              // Count how many events are on this day
              const dayEvents = events.filter(e => e.dataInicio.startsWith(formattedDay));

              return (
                <div 
                  key={i} 
                  className={`border border-white/5 p-2 rounded-lg text-left h-24 flex flex-col justify-between transition-all hover:bg-white/[0.02] ${
                    dayNum === 24 ? "bg-blue-500/5 border-blue-500/30 ring-2 ring-blue-500/5" : "bg-[#0c0c0e]/30"
                  }`}
                >
                  <span className={`text-xs font-bold leading-none ${
                    dayNum === 24 ? "text-blue-400 bg-blue-500/15 px-1 rounded inline-block font-mono" : "text-zinc-400 font-mono"
                  }`}>
                    {dayNum}
                  </span>
                  
                  {dayEvents.length > 0 && (
                    <div className="space-y-1 overflow-hidden pointer-events-none">
                      {dayEvents.slice(0, 2).map(de => (
                        <div key={de.id} className="text-[8px] truncate leading-tight font-sans bg-blue-600 text-white rounded px-1.5 py-0.5 font-bold">
                          {de.titulo}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[7.5px] text-blue-400 block font-bold font-mono">+{dayEvents.length - 2} mais</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Upcoming checklist queue with action/remove keys */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-bold text-zinc-500 font-mono tracking-wider text-left">Próximos Compromissos</h3>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {sortedEvents.length === 0 ? (
              <div className="bg-[#111113] border border-white/5 rounded-xl py-8 text-center text-zinc-500 text-xs font-mono">
                Nenhum compromisso agendado.
              </div>
            ) : (
              sortedEvents.map(ev => {
                const dateParsed = new Date(ev.dataInicio);
                const formatTime = dateParsed.toLocaleTimeString("pt-BR", { hour: "numeric", minute: "2-digit" });
                const formatDate = dateParsed.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });

                return (
                  <div 
                    key={ev.id} 
                    className={`border border-white/5 rounded-xl p-4 space-y-2.5 shadow-md text-left transition-all relative group ${
                      ev.categoria === "Reuniao" 
                        ? "bg-blue-500/5 border-blue-500/10 text-zinc-300"
                        : ev.categoria === "Fiscal"
                        ? "bg-rose-500/5 border-rose-500/10 text-zinc-300"
                        : "bg-amber-500/5 border-amber-500/10 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        {ev.categoria === "Reuniao" ? (
                          <span className="text-[8px] uppercase font-bold tracking-wider font-mono bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded mr-1">Vídeo</span>
                        ) : ev.categoria === "Fiscal" ? (
                          <span className="text-[8px] uppercase font-bold tracking-wider font-mono bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded mr-1">Fiscal</span>
                        ) : (
                          <span className="text-[8px] uppercase font-bold tracking-wider font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded mr-1">Tarefa</span>
                        )}
                        <h4 className="font-bold text-sm text-white leading-snug mt-1 text-left">{ev.titulo}</h4>
                      </div>
                      <button
                        onClick={() => onDeleteEvent(ev.id)}
                        className="p-1 hover:bg-white/10 text-rose-400 rounded cursor-pointer opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Desmarcar compromisso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-snug">{ev.descricao}</p>

                    {/* Meta info of event context */}
                    <div className="pt-2 border-t border-dashed border-white/5 flex flex-wrap items-center justify-between text-[10px] text-zinc-500 font-mono gap-y-1.5">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate} às {formatTime}</span>
                      </div>
                      {ev.clienteNome && (
                        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded font-bold">
                          <Users className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{ev.clienteNome}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Agenda creator Popup dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/5 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0c0c0e]">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                Agendar Reunião ou Alerta
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Título do Compromisso</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Alinhamento trimestrar Sócio Padaria"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Início (Data e Hora)</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Término Previsto</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Categoria de Evento</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as any)}
                  >
                    <option value="Reuniao">Reunião (Call de Alinhamento)</option>
                    <option value="Fiscal">Prazo Fiscal Crítico</option>
                    <option value="Entrega">Entrega física / Assinatura</option>
                    <option value="Outro">Outro Compromisso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Cliente Vinculado</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                  >
                    <option value="">Nenhum / Evento Geral</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Pauta ou Descrição</label>
                <textarea
                  rows={2.5}
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="Incorpore link do Teams/Meet ou endereço físico..."
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
                  Salvar Compromisso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
