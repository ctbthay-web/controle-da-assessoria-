import React, { useState } from "react";
import { 
  Plus, Calendar, Clock, Trash2, X, Users, Save,
  ChevronLeft, ChevronRight, Video, FileText, AlertCircle
} from "lucide-react";
import { ScheduleEvent, Client } from "../types";

interface SchedulesViewProps {
  events: ScheduleEvent[];
  clients: Client[];
  onCreateEvent: (event: Omit<ScheduleEvent, "id">) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

const monthsList = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const yearsList = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function SchedulesView({
  events,
  clients,
  onCreateEvent,
  onDeleteEvent
}: SchedulesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [categoria, setCategoria] = useState<ScheduleEvent["categoria"]>("Reuniao");

  // Main Calendar Navigation States - Defaulting to May 2026 where the seed events are located
  const [currentMonth, setCurrentMonth] = useState(4); // 4 = May
  const [currentYear, setCurrentYear] = useState(2026);

  // Scheduling states for the creation modal
  const [schedDay, setSchedDay] = useState(24);
  const [schedMonth, setSchedMonth] = useState(4); // May
  const [schedYear, setSchedYear] = useState(2026);
  const [schedStartTime, setSchedStartTime] = useState("10:00");
  const [schedEndTime, setSchedEndTime] = useState("11:00");

  const sortedEvents = [...events].sort((a,b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleOpenCreate = () => {
    setTitulo("");
    setDescricao("");
    setClienteId("");
    setCategoria("Reuniao");

    // Set defaults to match current calendar view month/year
    const today = new Date();
    const defaultDay = today.getFullYear() === currentYear && today.getMonth() === currentMonth 
      ? today.getDate() 
      : 1;

    setSchedDay(defaultDay);
    setSchedMonth(currentMonth);
    setSchedYear(currentYear);
    setSchedStartTime("10:00");
    setSchedEndTime("11:00");
    
    setIsModalOpen(true);
  };

  // Click on a calendar day cell to instantly schedule
  const handleDayClick = (dayNum: number, month: number, year: number) => {
    setTitulo("");
    setDescricao("");
    setClienteId("");
    setCategoria("Reuniao");

    setSchedDay(dayNum);
    setSchedMonth(month);
    setSchedYear(year);
    setSchedStartTime("10:00");
    setSchedEndTime("11:00");

    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
    const isoStart = `${schedYear}-${pad(schedMonth + 1)}-${pad(schedDay)}T${schedStartTime}`;
    const isoEnd = `${schedYear}-${pad(schedMonth + 1)}-${pad(schedDay)}T${schedEndTime}`;

    try {
      await onCreateEvent({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        dataInicio: isoStart,
        dataFim: isoEnd,
        clienteId: clienteId || undefined,
        categoria
      });
      setIsModalOpen(false);
    } catch {
      alert("Erro ao marcar reunião.");
    }
  };

  // Helper to construct standard 42-cell calendar grid (6 rows x 7 days)
  const getCalendarCells = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      cells.push({
        dayNum,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        dayNum: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
      });
    }

    // Next month padding days to complete standard 42 cell grid
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      cells.push({
        dayNum: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
      });
    }

    return cells;
  };

  const calendarCells = getCalendarCells();

  // Dynamic list of days based on scheduling month and year
  const daysInSchedMonth = new Date(schedYear, schedMonth + 1, 0).getDate();
  const schedDaysList = Array.from({ length: daysInSchedMonth }, (_, i) => i + 1);

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
        {/* Left Column: Visual Calendar overview */}
        <div className="lg:col-span-2 bg-[#111113] border border-white/5 rounded-xl p-5 shadow-md">
          {/* Calendar Controller & Nav */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white text-sm uppercase font-mono tracking-wider">
                {monthsList[currentMonth]} {currentYear}
              </span>
            </div>

            {/* Selector Dropdowns to easily change month and year */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month Selector */}
              <select
                className="bg-[#0c0c0e] border border-white/5 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
              >
                {monthsList.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                className="bg-[#0c0c0e] border border-white/5 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                onClick={handleNextMonth}
                className="p-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2.5">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, index) => (
              <span key={d} className={`text-[10px] uppercase font-bold text-zinc-500 font-mono text-center ${index === 0 ? "text-rose-400" : ""}`}>
                {d}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
              const formattedDateString = `${cell.year}-${pad(cell.month + 1)}-${pad(cell.dayNum)}`;
              
              // Filter events that happen on this cell's date
              const dayEvents = events.filter(e => e.dataInicio.startsWith(formattedDateString));

              // Determine if this is today
              const today = new Date();
              const isToday = today.getDate() === cell.dayNum && today.getMonth() === cell.month && today.getFullYear() === cell.year;

              return (
                <div 
                  key={idx} 
                  onClick={() => handleDayClick(cell.dayNum, cell.month, cell.year)}
                  className={`border p-2 rounded-lg text-left h-24 flex flex-col justify-between transition-all hover:bg-white/[0.05] cursor-pointer group ${
                    !cell.isCurrentMonth 
                      ? "bg-black/[0.15] border-white/[0.02] opacity-40 hover:opacity-75" 
                      : "bg-[#0c0c0e]/35 border-white/5"
                  } ${
                    isToday ? "bg-blue-500/5 border-blue-500/30 ring-1 ring-blue-500/20" : ""
                  }`}
                >
                  <span className={`text-[11px] font-bold leading-none px-1.5 py-0.5 rounded font-mono w-fit ${
                    isToday 
                      ? "text-blue-400 bg-blue-500/15" 
                      : cell.isCurrentMonth ? "text-zinc-400" : "text-zinc-600"
                  }`}>
                    {cell.dayNum}
                  </span>
                  
                  {dayEvents.length > 0 && (
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map(de => (
                        <div 
                          key={de.id} 
                          className={`text-[8px] truncate leading-tight rounded px-1.5 py-0.5 font-bold ${
                            de.categoria === "Reuniao" 
                              ? "bg-blue-600 text-white" 
                              : de.categoria === "Fiscal" 
                              ? "bg-rose-600 text-white" 
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          {de.titulo}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[7.5px] text-blue-400 block font-bold font-mono pl-1">
                          +{dayEvents.length - 2} mais
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Upcoming checklist queue */}
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
                        <Clock className="w-3.5 h-3.5" />
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
                <label className="block text-zinc-400 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Título do Compromisso</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="Ex: Alinhamento trimestral Sócio Padaria"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              {/* Day, Month, and Year selects for convenient appointment scheduling */}
              <div className="bg-[#0c0c0e]/30 border border-white/5 rounded-lg p-3.5 space-y-3.5">
                <span className="block text-zinc-500 text-[9px] font-bold uppercase tracking-wider font-mono">
                  Data de Agendamento
                </span>
                
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Sched Year Dropdown */}
                  <div>
                    <label className="block text-zinc-400 text-[9px] mb-1 font-semibold font-mono">Ano</label>
                    <select
                      className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500 font-mono"
                      value={schedYear}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSchedYear(val);
                        // Adjust schedDay if it exceeds number of days in the new month/year
                        const maxDays = new Date(val, schedMonth + 1, 0).getDate();
                        if (schedDay > maxDays) setSchedDay(maxDays);
                      }}
                    >
                      {yearsList.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sched Month Dropdown */}
                  <div>
                    <label className="block text-zinc-400 text-[9px] mb-1 font-semibold font-mono">Mês</label>
                    <select
                      className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500 font-mono"
                      value={schedMonth}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSchedMonth(val);
                        // Adjust schedDay if it exceeds number of days in the new month/year
                        const maxDays = new Date(schedYear, val + 1, 0).getDate();
                        if (schedDay > maxDays) setSchedDay(maxDays);
                      }}
                    >
                      {monthsList.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sched Day Dropdown */}
                  <div>
                    <label className="block text-zinc-400 text-[9px] mb-1 font-semibold font-mono">Dia</label>
                    <select
                      className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500 font-mono"
                      value={schedDay}
                      onChange={(e) => setSchedDay(Number(e.target.value))}
                    >
                      {schedDaysList.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Time and category settings */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-zinc-400 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Início (Hora)</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Término (Hora)</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Categoria de Evento</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500 font-mono"
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
                  <label className="block text-zinc-400 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Cliente Vinculado</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500 font-mono"
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
                <label className="block text-zinc-400 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Pauta ou Descrição</label>
                <textarea
                  rows={2.5}
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="Incorpore link do Teams/Meet ou endereço físico..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-white/5 font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10 font-mono"
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
