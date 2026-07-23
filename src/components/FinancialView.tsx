import React, { useState } from "react";
import { 
  Plus, Search, ArrowUpCircle, ArrowDownCircle, DollarSign, 
  Trash2, X, FileText, Calendar, Filter, Save, AlertCircle
} from "lucide-react";
import { FinancialEntry, Client } from "../types";

// Algoritmo Meeus/Jones/Butcher para cálculo do domingo de Páscoa
function obterFeriadosMoveis(ano: number): { [key: string]: boolean } {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mesPascoa = Math.floor((h + l - 7 * m + 114) / 31);
  const diaPascoa = ((h + l - 7 * m + 114) % 31) + 1;

  const pascoa = new Date(ano, mesPascoa - 1, diaPascoa);
  
  // Sexta-feira Santa (2 dias antes)
  const sextaSanta = new Date(pascoa);
  sextaSanta.setDate(pascoa.getDate() - 2);

  // Terça de Carnaval (47 dias antes)
  const tercaCarnaval = new Date(pascoa);
  tercaCarnaval.setDate(pascoa.getDate() - 47);

  // Segunda de Carnaval (48 dias antes)
  const segundaCarnaval = new Date(pascoa);
  segundaCarnaval.setDate(pascoa.getDate() - 48);

  // Corpus Christi (60 dias depois)
  const corpusChristi = new Date(pascoa);
  corpusChristi.setDate(pascoa.getDate() + 60);

  const format = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  };

  return {
    [format(segundaCarnaval)]: true,
    [format(tercaCarnaval)]: true,
    [format(sextaSanta)]: true,
    [format(corpusChristi)]: true,
  };
}

// Verifica se a data é Domingo ou Feriado Nacional do Brasil (Lei nº 10.607/2002 e Consciência Negra)
function isDomingoOuFeriado(dataObj: Date): boolean {
  if (dataObj.getDay() === 0) return true; // Domingo

  const ano = dataObj.getFullYear();
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
  const dia = String(dataObj.getDate()).padStart(2, '0');
  const md = `${mes}-${dia}`;

  // Feriados federais brasileiros
  const feriadosFixos: { [key: string]: boolean } = {
    "01-01": true, // Ano Novo
    "04-21": true, // Tiradentes
    "05-01": true, // Dia do Trabalho
    "09-07": true, // Independência
    "10-12": true, // Nossa Senhora Aparecida
    "11-02": true, // Finados
    "11-15": true, // Proclamação da República
    "11-20": true, // Consciência Negra
    "12-25": true  // Natal
  };

  if (feriadosFixos[md]) return true;

  const moveis = obterFeriadosMoveis(ano);
  if (moveis[md]) return true;

  return false;
}

// Prorrogador do vencimento para o primeiro dia útil subsequente
function ajustarVencimento(dataStr: string): string {
  const d = new Date(dataStr + "T00:00:00");
  while (isDomingoOuFeriado(d)) {
    d.setDate(d.getDate() + 1);
  }
  const anoResult = d.getFullYear();
  const mesResult = String(d.getMonth() + 1).padStart(2, '0');
  const diaResult = String(d.getDate()).padStart(2, '0');
  return `${anoResult}-${mesResult}-${diaResult}`;
}

// Soma meses à competência base preservando o dia limite do mês
function somarMeses(dataStr: string, meses: number): string {
  if (meses === 0) return dataStr;
  const parts = dataStr.split("-");
  const ano = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10) - 1;
  const dia = parseInt(parts[2], 10);

  const d = new Date(ano, mes + meses, 1);
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const diaFinal = Math.min(dia, ultimoDia);
  d.setDate(diaFinal);

  const anoResult = d.getFullYear();
  const mesResult = String(d.getMonth() + 1).padStart(2, '0');
  const diaResult = String(d.getDate()).padStart(2, '0');
  return `${anoResult}-${mesResult}-${diaResult}`;
}

interface FinancialViewProps {
  entries: FinancialEntry[];
  clients: Client[];
  onCreateEntry: (entry: Omit<FinancialEntry, "id">) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

export function FinancialView({
  entries,
  clients,
  onCreateEntry,
  onDeleteEntry
}: FinancialViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [entryToDeleteId, setEntryToDeleteId] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipo, setTipo] = useState<'Receita' | 'Despesa'>("Receita");
  const [categoria, setCategoria] = useState("Honorários Mensais");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(1200);
  const [data, setData] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [status, setStatus] = useState<'Pago' | 'Pendente' | 'Atrasado'>("Pago");
  const [clienteId, setClienteId] = useState("");

  // Bulk Entry Options State
  const [emMassa, setEmMassa] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState(12);
  const [addParcelaSufixo, setAddParcelaSufixo] = useState(true);
  const [loadingBulk, setLoadingBulk] = useState(false);

  const handleOpenCreate = () => {
    setTipo("Receita");
    setCategoria("Honorários Mensais");
    setDescricao("");
    setValor(1200);
    const today = new Date().toISOString().split("T")[0];
    setData(today);
    setDataVencimento(today);
    setStatus("Pago");
    setClienteId("");
    setEmMassa(false);
    setQtdParcelas(12);
    setAddParcelaSufixo(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !valor) return;

    const findClient = clients.find(c => c.id === clienteId);
    setLoadingBulk(true);

    try {
      if (emMassa && qtdParcelas > 1) {
        for (let i = 0; i < qtdParcelas; i++) {
          const dataCompetenciaCalculada = somarMeses(data, i);
          const dataVencimentoBase = somarMeses(dataVencimento || data, i);
          const dataVencimentoCalculada = ajustarVencimento(dataVencimentoBase);

          const sufixo = addParcelaSufixo ? ` [${String(i + 1).padStart(2, '0')}/${String(qtdParcelas).padStart(2, '0')}]` : "";
          
          const payload = {
            tipo,
            categoria,
            descricao: `${descricao.trim()}${sufixo}`,
            valor: Number(valor),
            data: dataCompetenciaCalculada,
            dataVencimento: dataVencimentoCalculada,
            status: i === 0 ? status : "Pendente" as const, // A primeira segue o status atual, as seguintes entram como Pendente
            clienteId: clienteId || undefined,
            clienteNome: findClient ? findClient.name : undefined
          };
          await onCreateEntry(payload);
        }
      } else {
        const payload = {
          tipo,
          categoria,
          descricao: descricao.trim(),
          valor: Number(valor),
          data,
          dataVencimento: dataVencimento || data,
          status,
          clienteId: clienteId || undefined,
          clienteNome: findClient ? findClient.name : undefined
        };
        await onCreateEntry(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("Erro ao salvar movimento de caixa.");
    } finally {
      setLoadingBulk(false);
    }
  };

  // Filter calculations
  const filteredEntries = entries.filter(e => {
    const term = searchQuery.toLowerCase();
    const matchSearch = 
      e.descricao.toLowerCase().includes(term) || 
      e.categoria.toLowerCase().includes(term) || 
      (e.clienteNome && e.clienteNome.toLowerCase().includes(term));
    
    const matchType = !typeFilter || e.tipo === typeFilter;
    const matchStatus = !statusFilter || e.status === statusFilter;

    return matchSearch && matchType && matchStatus;
  });

  // Calculate stats based on ALL matches (or dynamic filters)
  const totalReceitasPago = entries
    .filter(e => e.tipo === "Receita" && e.status === "Pago")
    .reduce((sum, e) => sum + e.valor, 0);

  const totalDespesasPago = entries
    .filter(e => e.tipo === "Despesa" && e.status === "Pago")
    .reduce((sum, e) => sum + e.valor, 0);

  const totalAReceber = entries
    .filter(e => e.tipo === "Receita" && e.status === "Pendente")
    .reduce((sum, e) => sum + e.valor, 0);

  const totalAtrasados = entries
    .filter(e => e.tipo === "Receita" && e.status === "Atrasado")
    .reduce((sum, e) => sum + e.valor, 0);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Fluxo de Caixa & Honorários</h2>
          <p className="text-zinc-400 text-xs text-left">Controle operacional de receitas, mensalidades, despesas e inadimplência.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-center shadow-lg shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Lançar Movimentação
        </button>
      </div>

      {/* Dynamic Summary Stats Panel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-white/5 rounded-xl p-4.5 shadow-md text-left">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Receita Recebida</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{formatBRL(totalReceitasPago)}</div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">Lançamentos compensados</span>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-xl p-4.5 shadow-md text-left">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Despesa Paga</span>
          <div className="text-xl font-bold text-rose-455 mt-1">{formatBRL(totalDespesasPago)}</div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">Custos e assinaturas operacionais</span>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-xl p-4.5 shadow-md text-left">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Previsão (A Receber)</span>
          <div className="text-xl font-bold text-blue-400 mt-1">{formatBRL(totalAReceber)}</div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">Mensalidades deste lote</span>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-xl p-4.5 shadow-md text-left">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Inadimplência Real</span>
          <div className="text-xl font-bold text-rose-400 mt-1">{formatBRL(totalAtrasados)}</div>
          <span className="text-[10px] text-rose-500 font-medium block mt-0.5 font-mono">Atrasados ativos</span>
        </div>
      </div>

      {/* Controls panel */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-4 shadow-md flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-9.5 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
          value={typeFilter || ""}
          onChange={(e) => setTypeFilter(e.target.value || null)}
        >
          <option value="">Fluxo: Todos</option>
          <option value="Receita">Receitas (Entradas)</option>
          <option value="Despesa">Despesas (Saídas)</option>
        </select>

        <select
          className="bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
        >
          <option value="">Status: Todos</option>
          <option value="Pago">Compensado / Pago</option>
          <option value="Pendente">Em aberto / Pendente</option>
          <option value="Atrasado">Inadimplente / Atrasado</option>
        </select>
      </div>

      {/* Structured Transactions Table View */}
      <div className="bg-[#111113] border border-white/5 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0c0c0e] border-b border-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-6 py-3.5 font-bold">Tipo</th>
                <th className="px-6 py-3.5 font-bold">Descrição / Detalhes</th>
                <th className="px-6 py-3.5 font-bold">Categoria</th>
                <th className="px-6 py-3.5 font-bold">Datas (Comp. / Venc.)</th>
                <th className="px-6 py-3.5 font-bold">Status</th>
                <th className="px-6 py-3.5 font-bold text-right">Valor</th>
                <th className="px-6 py-3.5 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-305">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500 font-mono">Nenhum lançamento registrado neste lote.</td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-3.5">
                      {entry.tipo === "Receita" ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <ArrowUpCircle className="w-4.5 h-4.5 shrink-0" />
                          Entrada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-455 font-medium">
                          <ArrowDownCircle className="w-4.5 h-4.5 shrink-0" />
                          Saída
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-white leading-normal">
                      <div>{entry.descricao}</div>
                      {entry.clienteNome && (
                        <span className="text-[9.5px] bg-white/[0.03] text-zinc-400 border border-white/5 rounded font-bold font-mono px-1.5 py-0.2 mt-0.5 inline-block">
                          {entry.clienteNome}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-zinc-400">{entry.categoria}</td>
                    <td className="px-6 py-3.5 font-mono text-[11.5px] text-zinc-400">
                      <div className="flex flex-col gap-0.5 text-left">
                        <span className="text-zinc-300 font-medium">Venc: {new Date((entry.dataVencimento || entry.data) + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                        <span className="text-[10px] text-zinc-500">Comp: {new Date(entry.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        entry.status === "Pago" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                        entry.status === "Atrasado" ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                      }`}>
                        {entry.status === "Pago" ? "Compensado" : entry.status === "Atrasado" ? "Atrasado" : "Pendente"}
                      </span>
                    </td>
                    <td className={`px-6 py-3.5 text-right font-bold font-mono text-sm ${
                      entry.tipo === "Receita" ? "text-emerald-400" : "text-zinc-300"
                    }`}>
                      {entry.tipo === "Despesa" ? "-" : ""}{formatBRL(entry.valor)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => {
                          if (entryToDeleteId === entry.id) {
                            onDeleteEntry(entry.id);
                            setEntryToDeleteId(null);
                          } else {
                            setEntryToDeleteId(entry.id);
                            setTimeout(() => {
                              setEntryToDeleteId(prev => prev === entry.id ? null : prev);
                            }, 4000);
                          }
                        }}
                        className={`p-1 rounded cursor-pointer transition-all flex items-center justify-center gap-1 mx-auto ${
                          entryToDeleteId === entry.id
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold px-2 py-0.5"
                            : "hover:bg-rose-500/10 text-rose-400"
                        }`}
                        title={entryToDeleteId === entry.id ? "Clique novamente para confirmar a exclusão" : "Remover movimentação"}
                      >
                        {entryToDeleteId === entry.id ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-rose-400 animate-bounce" />
                            <span className="text-[10px]">Confirmar?</span>
                          </>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lançamento Modal Setup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/5 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0c0c0e]">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                Lançar Registro de Caixa
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Tipo de fluxo */}
                <div className="col-span-2">
                  <span className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Regime de Fluxo</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTipo("Receita");
                        setCategoria("Honorários Mensais");
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold text-center border cursor-pointer transition-colors ${
                        tipo === "Receita" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-[#0c0c0e] hover:bg-white/[0.02] text-zinc-500 border-white/5"
                      }`}
                    >
                      Receita (Crédito)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipo("Despesa");
                        setCategoria("Sistemas");
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold text-center border cursor-pointer transition-colors ${
                        tipo === "Despesa" 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30" 
                          : "bg-[#0c0c0e] hover:bg-white/[0.02] text-zinc-500 border-white/5"
                      }`}
                    >
                      Despesa (Débito)
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Descrição</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Nota Fiscal 1045 ou Mensalidade Maio..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>

                {tipo === "Receita" && (
                  <div className="col-span-2">
                    <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Vincular Cliente (Opcional)</label>
                    <select
                      className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none"
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value)}
                    >
                      <option value="">Nenhum / Lançamento Avulso</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Categoria</label>
                  {tipo === "Receita" ? (
                    <select
                      className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-355 outline-none"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                    >
                      <option value="Honorários Mensais">Honorários Mensais</option>
                      <option value="Serviço Avulso">Serviço Avulso</option>
                      <option value="Consultoria">Consultoria</option>
                      <option value="Outros">Outras Ingressões</option>
                    </select>
                  ) : (
                    <select
                      className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-355 outline-none"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                    >
                      <option value="Sistemas">Software & Sistemas</option>
                      <option value="Infraestrutura">Escritório & Aluguel</option>
                      <option value="Marketing">Tráfego / Ads</option>
                      <option value="Impostos">Tributos / Taxas</option>
                      <option value="Outros">Pró-labore / Custos Secundários</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Status de Acerto</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-355 outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Pago">Pago / Compensado</option>
                    <option value="Pendente">Aberto / Pendente</option>
                    <option value="Atrasado">Inadimplente / Atrasado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Valor Lançamento (R$)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Data de Competência</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                  />
                </div>

                {/* Lançamento em Massa / Recorrência */}
                <div className="col-span-2 bg-[#0c0c0e]/30 border border-white/5 rounded-xl p-3.5 space-y-3.5 mt-1.5">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-white/10 bg-[#0c0c0e] text-blue-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      checked={emMassa}
                      onChange={(e) => setEmMassa(e.target.checked)}
                    />
                    <div className="text-left">
                      <span className="text-zinc-200 text-xs font-semibold select-none group-hover:text-blue-400 transition-colors uppercase tracking-wider font-mono">
                        Lançamento em Massa (Recorrência)
                      </span>
                      <p className="text-[10px] text-zinc-500 font-sans leading-tight mt-0.5">
                        Gerar sequência consecutiva mensal de contas ou de receitas.
                      </p>
                    </div>
                  </label>

                  {emMassa && (
                    <div className="grid grid-cols-2 gap-3.5 pt-1 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-zinc-400 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono text-left">
                          Nº de Parcelas / Meses
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="36"
                          required
                          className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          value={qtdParcelas}
                          onChange={(e) => setQtdParcelas(Math.max(2, parseInt(e.target.value) || 2))}
                        />
                      </div>

                      <div className="flex items-center pt-5 text-left">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-white/10 bg-[#0c0c0e] text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            checked={addParcelaSufixo}
                            onChange={(e) => setAddParcelaSufixo(e.target.checked)}
                          />
                          <span className="text-[10px] text-zinc-400 select-none uppercase font-mono tracking-wider">
                            Identificar parcelas (ex: [01/12])
                          </span>
                        </label>
                      </div>

                      <div className="col-span-2 text-[10px] text-amber-500 font-sans leading-normal flex items-start gap-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 text-left">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          <strong>Dias não-úteis:</strong> Vencimentos que caírem em <strong>Domingos</strong> ou <strong>Feriados Nacionais</strong> serão estendidos automaticamente para o primeiro dia útil subsequente.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loadingBulk}
                  className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-50 text-zinc-300 border border-white/5 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingBulk}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/10"
                >
                  {loadingBulk ? (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {loadingBulk ? "Salvando Lote..." : emMassa ? `Gerar ${qtdParcelas} Lançamentos` : "Salvar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
