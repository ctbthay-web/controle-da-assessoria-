import React, { useState } from "react";
import { 
  FileText, Download, Briefcase, Users, TrendingUp, AlertCircle, Sparkles, CheckSquare,
  ShieldCheck, RefreshCw, Database, KeyRound, AlertTriangle, Eye, EyeOff
} from "lucide-react";
import { Client, Service, FinancialEntry, Task, FiscalDeadline } from "../types";
import { getSupabase } from "../lib/supabase";

interface ReportsViewProps {
  clients: Client[];
  services: Service[];
  financial: FinancialEntry[];
  tasks: Task[];
  deadlines: FiscalDeadline[];
}

export function ReportsView({
  clients,
  services,
  financial,
  tasks,
  deadlines
}: ReportsViewProps) {
  
  // Supabase Diagnostics State
  const [supabaseStatus, setSupabaseStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [supabaseMessage, setSupabaseMessage] = useState<string>("");
  const [showKeysTutorial, setShowKeysTutorial] = useState(false);
  const [revealAnonKey, setRevealAnonKey] = useState(false);
  const [showSqlScript, setShowSqlScript] = useState(false);

  // Read raw values from environment safe fallback check
  const hasUrl = !!(import.meta as any).env.VITE_SUPABASE_URL && (import.meta as any).env.VITE_SUPABASE_URL !== "https://your-supabase-project.supabase.co";
  const hasKey = !!(import.meta as any).env.VITE_SUPABASE_ANON_KEY && (import.meta as any).env.VITE_SUPABASE_ANON_KEY !== "your-anon-public-key";
  const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL || "Não configurado";
  const rawKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "Não configurado";
  
  const testSupabaseConnection = async () => {
    setSupabaseStatus("testing");
    setSupabaseMessage("");
    
    try {
      // 1. Initialize client (will throw if missing keys)
      const supabase = getSupabase();
      
      // 2. Perform a lightweight API call to test connection.
      // We list any arbitrary public profiles or simply check standard rest response
      const startTime = performance.now();
      const { data, error } = await supabase
        .from("users") // We can test any table or try standard request
        .select("*")
        .limit(1);
      
      const durationMs = Math.round(performance.now() - startTime);

      if (error) {
        // If the table doesn't exist yet but we got an actual PG response from Supabase,
        // it means the general API key, URL and auth routing are 100% correct!
        if (error.code === "PGRST116" || error.code === "42P01" || error.code === "PGRST205") {
          setSupabaseStatus("success");
          setSupabaseMessage(`Conectado à API do Supabase com Sucesso! (Ping: ${durationMs}ms). As suas chaves de API estão totalmente corretas e funcionando. O erro '${error.code}' indica apenas que as tabelas de banco de dados ainda não foram criadas no seu painel do Supabase. Copie o script SQL apresentado abaixo para criá-las!`);
        } else {
          setSupabaseStatus("error");
          setSupabaseMessage(`Erro de API retornado pelo Supabase (Código ${error.code}): ${error.message}`);
        }
      } else {
        setSupabaseStatus("success");
        setSupabaseMessage(`Conexão bem sucedida em tempo real! Latência de rede: ${durationMs}ms. O banco está se comunicando de forma integrada.`);
      }
    } catch (err: any) {
      setSupabaseStatus("error");
      setSupabaseMessage(err.message || "A requisição falhou devido a falta de credenciais ou um erro de rede. Certifique-se de configurar as variáveis no menu de configurações.");
    }
  };

  // Calculate specific totals
  const activeClients = clients.filter(c => c.status === "ativo").length;
  const inactiveClients = clients.filter(c => c.status === "inativo").length;

  const bpoCount = services.filter(s => s.tipo === "BPO").length;
  const irpfCount = services.filter(s => s.tipo === "IRPF").length;
  const regularCount = services.filter(s => s.tipo === "Regularizacao").length;
  const otherCount = services.length - bpoCount - irpfCount - regularCount;

  const totalRecebimentos = financial
    .filter(f => f.tipo === "Receita" && f.status === "Pago")
    .reduce((sum, f) => sum + f.valor, 0);

  const totalCustos = financial
    .filter(f => f.tipo === "Despesa" && f.status === "Pago")
    .reduce((sum, f) => sum + f.valor, 0);

  const totalTaskCompeted = tasks.filter(t => t.status === "Concluida").length;
  const totalTaskPending = tasks.length - totalTaskCompeted;

  // Simulate report exports directly to TXT/JS list in Brazil format
  const exportReport = (reportName: string, lines: string[]) => {
    const textStr = lines.join("\n");
    const blob = new Blob([textStr], { type: "text/plain;charset=utf-8" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `Relatorio_${reportName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
    downloadLink.click();
  };

  const handeExportFinancial = () => {
    const reportLines = [
      "=== ERP CONTÁBIL - RELATÓRIO DO FLUXO DE CAIXA ===",
      `Data de Extração: ${new Date().toLocaleDateString("pt-BR")}`,
      "---------------------------------------------",
      "",
      `Total Recebido de Clientes: R$ ${totalRecebimentos.toFixed(2)}`,
      `Total de Despesas Operacionais: R$ ${totalCustos.toFixed(2)}`,
      `Saldo Operacional Líquido: R$ ${(totalRecebimentos - totalCustos).toFixed(2)}`,
      "",
      "--- LANÇAMENTOS DETALHADOS ---",
      ...financial.map(f => `[${f.tipo}] ${f.data} | R$ ${f.valor.toFixed(2)} - ${f.descricao} (${f.categoria}) [Status: ${f.status}]`)
    ];
    exportReport("Financeiro_Anual", reportLines);
  };

  const handleExportClients = () => {
    const reportLines = [
      "=== ERP CONTÁBIL - CARTEIRA DE CLIENTES ===",
      `Data de Extração: ${new Date().toLocaleDateString("pt-BR")}`,
      "---------------------------------------------",
      "",
      `Clientes Ativos: ${activeClients}`,
      `Clientes Arquivados/Inativos: ${inactiveClients}`,
      "",
      "--- LISTA INDIVIDUAL ---",
      ...clients.map(c => `- ${c.name} | CNPJ/CPF: ${c.cpfCnpj} | Fone: ${c.whatsapp || c.telefone} | Email: ${c.email} [Status: ${c.status}]`)
    ];
    exportReport("Fichas_Clientes", reportLines);
  };

  const handleExportServices = () => {
    const reportLines = [
      "=== ERP CONTÁBIL - RELATÓRIO DE PROCESSOS E SERVIÇOS ===",
      `Data de Extração: ${new Date().toLocaleDateString("pt-BR")}`,
      "---------------------------------------------",
      "",
      `BPO Fianceiro: ${bpoCount} contratos`,
      `IRPF PF: ${irpfCount} demandas`,
      `Processos de Regularização: ${regularCount} andamentos`,
      `Outros demandas mapeadas: ${otherCount} andamentos`,
      "",
      "--- LISTA DE PROCESSOS DETALHADOS ---",
      ...services.map(s => `* [${s.tipo}] ${s.clienteNome} | Operador: ${s.responsavel} | Prazo: ${s.prazo} | Honorário: R$ ${s.valor.toFixed(2)} [Status: ${s.status}]`)
    ];
    exportReport("Painel_Servicos", reportLines);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Relatórios Fiscais e Produtividade</h2>
        <p className="text-zinc-400 text-xs">Análise consolidada do escritório contábil e exportação oficial p/ arquivos texto fiscais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Card 1: Financeiro */}
        <div className="bg-[#111113] border border-white/5 rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 border border-teal-500/20 rounded-lg bg-teal-500/10 text-teal-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-white font-mono uppercase tracking-wider">Honorários e Caixa</h3>
            </div>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Controle absoluto de DRE, fluxo de provisões operacionais de honorários mensais e despesas.
            </p>
            <div className="pt-2 text-[11px] space-y-2 font-mono text-zinc-400">
              <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                <span>Receita Faturada:</span>
                <span className="font-bold text-emerald-400">R$ {totalRecebimentos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Custo de Sistemas/Infra:</span>
                <span className="font-bold text-rose-455">R$ {totalCustos.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handeExportFinancial}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-blue-500/10"
          >
            <Download className="w-4 h-4" />
            Exportar Fluxo de Caixa (TXT)
          </button>
        </div>

        {/* Card 2: Clientes */}
        <div className="bg-[#111113] border border-white/5 rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 border border-blue-500/20 rounded-lg bg-blue-500/10 text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-white font-mono uppercase tracking-wider">Fichas de Clientes</h3>
            </div>
            <p className="text-xs text-zinc-455 leading-relaxed">
              Fichamento consolidado de e-mails, CNPJ/CPF ativos e logs do histórico de regularização fiscal.
            </p>
            <div className="pt-2 text-[11px] space-y-2 font-mono text-zinc-400">
              <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                <span>Clientes Ativos:</span>
                <span className="font-bold text-zinc-200">{activeClients} empresas</span>
              </div>
              <div className="flex justify-between">
                <span>Clientes Arquivados:</span>
                <span className="font-bold text-zinc-500">{inactiveClients} baixados</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportClients}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-blue-500/10"
          >
            <Download className="w-4 h-4" />
            Exportar Cadastro Geral (TXT)
          </button>
        </div>

        {/* Card 3: Serviços e Processos */}
        <div className="bg-[#111113] border border-white/5 rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 border border-indigo-500/20 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-white font-mono uppercase tracking-wider">Demandas e Processos</h3>
            </div>
            <p className="text-xs text-zinc-455 leading-relaxed">
              Estatísticas de performance do time de operadores, checklist de etapas concluídas e vencimentos.
            </p>
            <div className="pt-2 text-[11px] space-y-2 font-mono text-zinc-400">
              <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                <span>BPO Financeiro:</span>
                <span className="font-bold text-zinc-200">{bpoCount} contratos</span>
              </div>
              <div className="flex justify-between">
                <span>IRPF e Regularizações:</span>
                <span className="font-bold text-zinc-200">{irpfCount + regularCount} fluxos</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportServices}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-blue-500/10"
          >
            <Download className="w-4 h-4" />
            Exportar Painel Operativo (TXT)
          </button>
        </div>

      </div>

      {/* Structured Colaboradores outputs logs for internal check */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-6 shadow-md">
        <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-widest font-mono text-left mb-4">Relatório de Produtividade do Time</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
          <div className="p-4 bg-[#0c0c0e] border border-white/5 rounded-xl flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">{clients[0]?.name ? "Thayane Carvalho" : "Thayane Carvalho"}</h4>
              <span className="text-[10px] text-blue-400 font-bold uppercase block font-mono mt-1">Sócio-Administrador</span>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-zinc-400 font-mono">
                <div className="bg-[#111113] border border-white/5 p-2 rounded-lg text-left">
                  <span className="block text-[9px] uppercase text-zinc-500">Serviços</span>
                  <strong className="text-white text-xs">
                    {services.filter(s => s.responsavel === "Thayane Carvalho").length} ativos
                  </strong>
                </div>
                <div className="bg-[#111113] border border-white/5 p-2 rounded-lg text-left">
                  <span className="block text-[9px] uppercase text-zinc-500">Ações</span>
                  <strong className="text-white text-xs">Geral</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#0c0c0e] border border-white/5 rounded-xl flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Carlos Souza</h4>
              <span className="text-[10px] text-blue-400 font-bold uppercase block font-mono mt-1">Colaborador Fiscal</span>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-zinc-400 font-mono">
                <div className="bg-[#111113] border border-white/5 p-2 rounded-lg text-left">
                  <span className="block text-[9px] uppercase text-zinc-500">Serviços</span>
                  <strong className="text-white text-xs">
                    {services.filter(s => s.responsavel === "Carlos Souza").length} ativos
                  </strong>
                </div>
                <div className="bg-[#111113] border border-white/5 p-2 rounded-lg text-left">
                  <span className="block text-[9px] uppercase text-zinc-500">Tarefas</span>
                  <strong className="text-white text-xs">
                    {tasks.filter(t => t.responsavel === "Carlos Souza" && t.status !== "Concluida").length} pnd
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#0c0c0e] border border-white/5 rounded-xl flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Beatriz Lima</h4>
              <span className="text-[10px] text-blue-400 font-bold uppercase block font-mono mt-1">Auxiliar de Atendimento</span>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-zinc-400 font-mono">
                <div className="bg-[#111113] border border-white/5 p-2 rounded-lg text-left">
                  <span className="block text-[9px] uppercase text-zinc-500">Serviços</span>
                  <strong className="text-white text-xs">
                    {services.filter(s => s.responsavel === "Beatriz Lima").length} ativos
                  </strong>
                </div>
                <div className="bg-[#111113] border border-white/5 p-2 rounded-lg text-left">
                  <span className="block text-[9px] uppercase text-zinc-500">Tarefas</span>
                  <strong className="text-white text-xs">
                    {tasks.filter(t => t.responsavel === "Beatriz Lima" && t.status !== "Concluida").length} pnd
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Integration Live Test Panel */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-6 shadow-md text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.04]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Integração Externa: Supabase Cloud</h3>
              <p className="text-zinc-400 text-xs">Monitore a saúde e integridade da sua conexão com o banco de dados principal.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowKeysTutorial(!showKeysTutorial)}
              className="px-3 py-1.5 border border-white/5 hover:bg-white/[0.02] text-zinc-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              {showKeysTutorial ? "Ocultar Guia" : "Como configurar?"}
            </button>
            <button
              onClick={testSupabaseConnection}
              disabled={supabaseStatus === "testing"}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs py-1.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-blue-500/15"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${supabaseStatus === "testing" ? "animate-spin" : ""}`} />
              {supabaseStatus === "testing" ? "Testando..." : "Testar Conexão Supabase"}
            </button>
          </div>
        </div>

        {/* Tutorial Panel */}
        {showKeysTutorial && (
          <div className="mb-6 p-4 bg-blue-950/20 border border-blue-500/10 rounded-lg text-zinc-350 text-xs space-y-2.5 leading-relaxed">
            <h4 className="font-bold text-blue-400 flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5" /> Onde encontrar suas chaves no painel do Supabase?
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 pl-1.5 text-zinc-400">
              <li>Acesse seu painel em <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">supabase.com</a> e abra seu projeto.</li>
              <li>No menu lateral esquerdo, clique no ícone de engrenagem (<strong className="text-zinc-300">Project Settings</strong>) e vá em <strong className="text-zinc-300">API</strong>.</li>
              <li>Copie a <strong className="text-zinc-300">Project URL</strong> e insira no seu arquivo de configurações como <code className="text-blue-300 font-mono">VITE_SUPABASE_URL</code>.</li>
              <li>Copie a chave pública chamada <strong className="text-zinc-300">anon / public</strong> e insira como <code className="text-blue-300 font-mono">VITE_SUPABASE_ANON_KEY</code>.</li>
              <li>Use o menu de configurações do projeto (lado esquerdo inferior do builder da AI Studio) para definir suas variáveis com segurança!</li>
            </ol>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment check list */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-zinc-300 uppercase font-mono tracking-wider">Monitoramento de Variáveis (.env)</h4>
            
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#0c0c0e] border border-white/5 rounded-lg flex items-center justify-between">
                <div className="space-y-1 pr-4 truncate">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">VITE_SUPABASE_URL</span>
                  <code className="text-zinc-300 font-mono truncate block text-xs">
                    {hasUrl ? rawUrl : "https://your-project-id.supabase.co"}
                  </code>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold font-mono border ${
                    hasUrl 
                      ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" 
                      : "bg-amber-550/10 text-amber-500 border-amber-550/20"
                  }`}>
                    {hasUrl ? "Configurado ✓" : "Pendente !"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#0c0c0e] border border-white/5 rounded-lg flex items-center justify-between">
                <div className="space-y-1 pr-4 truncate flex-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold flex items-center gap-1">
                    VITE_SUPABASE_ANON_KEY
                    <button
                      onClick={() => setRevealAnonKey(!revealAnonKey)}
                      className="text-zinc-500 hover:text-zinc-300 ml-1.5 focus:outline-none"
                      title={revealAnonKey ? "Ocultar chave" : "Mostrar chave"}
                    >
                      {revealAnonKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </span>
                  <code className="text-zinc-300 font-mono truncate block text-xs">
                    {hasKey 
                      ? (revealAnonKey ? rawKey : "••••••••••••••••••••••••••••••••••••••••")
                      : "your-anon-public-key"
                    }
                  </code>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold font-mono border ${
                    hasKey 
                      ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" 
                      : "bg-amber-550/10 text-amber-500 border-amber-550/20"
                  }`}>
                    {hasKey ? "Configurado ✓" : "Pendente !"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Test connection report feedback output */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-zinc-300 uppercase font-mono tracking-wider">Console de Diagnóstico Live</h4>
            
            <div className="min-h-[105px] p-4 rounded-lg bg-[#0c0c0e] border border-white/5 flex flex-col justify-between text-xs font-mono relative">
              {supabaseStatus === "idle" && (
                <div className="text-zinc-500 text-center my-auto flex flex-col items-center justify-center gap-2">
                  <KeyRound className="w-6 h-6 text-zinc-650" />
                  <span>Aguardando comando de teste para verificar a integridade externa do cluster...</span>
                </div>
              )}

              {supabaseStatus === "testing" && (
                <div className="text-blue-400 animate-pulse text-center my-auto flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span>Enviando solicitação HTTP ping para o servidor do Supabase...</span>
                </div>
              )}

              {supabaseStatus === "success" && (
                <div className="p-3 bg-emerald-950/25 border border-emerald-500/15 text-emerald-300 rounded-lg flex gap-3 h-full items-start">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div className="space-y-1 select-text">
                    <span className="font-sans font-bold text-white block text-xs">Sucesso Geral!</span>
                    <p className="text-[11px] leading-relaxed font-mono">{supabaseMessage}</p>
                  </div>
                </div>
              )}

              {supabaseStatus === "error" && (
                <div className="p-3 bg-rose-950/25 border border-rose-500/15 text-rose-300 rounded-lg flex gap-3 h-full items-start">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-450 mt-0.5" />
                  <div className="space-y-1 select-text">
                    <span className="font-sans font-bold text-white block text-xs">Conexão Falhou</span>
                    <p className="text-[11px] leading-relaxed font-mono">{supabaseMessage}</p>
                    <button
                      onClick={() => setShowKeysTutorial(true)}
                      className="text-[10px] font-sans font-bold text-blue-400 hover:underline mt-1.5 block focus:outline-none"
                    >
                      Seus dados não conferem? Siga nosso guia de correção.
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SQL Script toggle helper */}
        <div className="mt-6 pt-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-zinc-300">Script de Criação de Tabelas (SQL)</span>
            </div>
            <button
              onClick={() => setShowSqlScript(!showSqlScript)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-xs cursor-pointer select-none transition-colors font-semibold"
            >
              {showSqlScript ? "Ocultar Código SQL" : "Visualizar Código SQL de Setup"}
            </button>
          </div>
          
          {showSqlScript && (
            <div className="mt-3 space-y-3">
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Para que o seu projeto Supabase encontre as tabelas correspondentes, copie o script de banco de dados abaixo, acesse o painel de controle do seu projeto em <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">supabase.com</a>, selecione o menu lateral <strong className="text-zinc-200">SQL Editor</strong>, crie uma nova consulta (<strong className="text-zinc-200">New Query</strong>), cole este código e clique no botão verde <strong className="text-emerald-400">Run</strong> no canto inferior direito:
              </p>
              <div className="relative">
                <pre className="bg-[#070708] border border-white/5 rounded-lg p-3 text-[10px] text-emerald-400 font-mono overflow-x-auto max-h-[250px] leading-normal select-text">
{`-- 1. Criar tabela de Usuários (Users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'colaborador',
  status TEXT NOT NULL DEFAULT 'ativo'
);

-- 2. Criar tabela de Clientes (Clients)
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "cpfCnpj" TEXT NOT NULL,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  historico JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 3. Criar tabela de Serviços (Services)
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  "clienteId" TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  "clienteNome" TEXT,
  tipo TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pendente',
  responsavel TEXT,
  prazo TEXT,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT
);

-- 4. Criar tabela Financeira (Financial Entries)
CREATE TABLE IF NOT EXISTS public.financial (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  categoria TEXT,
  descricao TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  data TEXT,
  status TEXT NOT NULL,
  "clienteId" TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  "clienteNome" TEXT
);

-- 5. Criar tabela de Cronogramas/Eventos (Schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  "dataInicio" TEXT NOT NULL,
  "dataFim" TEXT NOT NULL,
  "clienteId" TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  "clienteNome" TEXT,
  categoria TEXT NOT NULL
);

-- 6. Criar tabela de Cofre de Senhas (Passwords)
CREATE TABLE IF NOT EXISTS public.passwords (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  "servicoUrl" TEXT,
  usuario TEXT NOT NULL,
  "senhaObfuscated" TEXT NOT NULL,
  "clienteId" TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  "clienteNome" TEXT,
  "ultimaAlteracao" TEXT
);

-- 7. Criar tabela de Logs de Acesso às Senhas (Password Access Logs)
CREATE TABLE IF NOT EXISTS public.password_access_logs (
  id TEXT PRIMARY KEY,
  "vaultId" TEXT REFERENCES public.passwords(id) ON DELETE CASCADE,
  titulo TEXT,
  "usuarioNome" TEXT,
  timestamp TEXT
);

-- 8. Criar tabela de Prazos Fiscais (Fiscal Deadlines)
CREATE TABLE IF NOT EXISTS public.fiscal_deadlines (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prazo TEXT NOT NULL,
  status TEXT NOT NULL,
  "clienteId" TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  "clienteNome" TEXT,
  valor NUMERIC
);

-- 9. Criar tabela de Tarefas (Tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'Media',
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  comentarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  prazo TEXT
);

-- 10. Criar tabela de Documentos (Documents)
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  "clienteId" TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  "clienteNome" TEXT,
  tamanho TEXT,
  "dataCriacao" TEXT,
  "contentBase64" TEXT
);

-- 11. Criar tabela de Auditoria (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  "usuarioNome" TEXT NOT NULL,
  acao TEXT NOT NULL,
  detalhes TEXT,
  timestamp TEXT NOT NULL
);

-- Habilitar Row Level Security (RLS) para integridade
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas de permissões públicas irrestritas (Select, Insert, Update, Delete)
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow public read clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete clients" ON public.clients FOR DELETE USING (true);

CREATE POLICY "Allow public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow public insert services" ON public.services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update services" ON public.services FOR UPDATE USING (true);
CREATE POLICY "Allow public delete services" ON public.services FOR DELETE USING (true);

CREATE POLICY "Allow public read financial" ON public.financial FOR SELECT USING (true);
CREATE POLICY "Allow public insert financial" ON public.financial FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update financial" ON public.financial FOR UPDATE USING (true);
CREATE POLICY "Allow public delete financial" ON public.financial FOR DELETE USING (true);

CREATE POLICY "Allow public read schedules" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Allow public insert schedules" ON public.schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update schedules" ON public.schedules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete schedules" ON public.schedules FOR DELETE USING (true);

CREATE POLICY "Allow public read passwords" ON public.passwords FOR SELECT USING (true);
CREATE POLICY "Allow public insert passwords" ON public.passwords FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update passwords" ON public.passwords FOR UPDATE USING (true);
CREATE POLICY "Allow public delete passwords" ON public.passwords FOR DELETE USING (true);

CREATE POLICY "Allow public read password_access_logs" ON public.password_access_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert password_access_logs" ON public.password_access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update password_access_logs" ON public.password_access_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete password_access_logs" ON public.password_access_logs FOR DELETE USING (true);

CREATE POLICY "Allow public read fiscal_deadlines" ON public.fiscal_deadlines FOR SELECT USING (true);
CREATE POLICY "Allow public insert fiscal_deadlines" ON public.fiscal_deadlines FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update fiscal_deadlines" ON public.fiscal_deadlines FOR UPDATE USING (true);
CREATE POLICY "Allow public delete fiscal_deadlines" ON public.fiscal_deadlines FOR DELETE USING (true);

CREATE POLICY "Allow public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tasks" ON public.tasks FOR DELETE USING (true);

CREATE POLICY "Allow public read documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete documents" ON public.documents FOR DELETE USING (true);

CREATE POLICY "Allow public read audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update audit_logs" ON public.audit_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete audit_logs" ON public.audit_logs FOR DELETE USING (true);

-- Cadastrar usuários administrativos padrão para liberação de acesso imediato
INSERT INTO public.users (id, name, email, role, status) VALUES
('1', 'Thayane Carvalho', 'ctbthay@gmail.com', 'admin', 'ativo'),
('2', 'Carlos Souza', 'carlos@contabil.com', 'colaborador', 'ativo'),
('3', 'Beatriz Lima', 'beatriz@contabil.com', 'colaborador', 'ativo')
ON CONFLICT (id) DO NOTHING;`}
                </pre>
                <div className="absolute right-3 top-3 text-[9px] text-zinc-500 bg-[#070708]/90 px-2 py-0.5 rounded border border-white/5 select-none pointer-events-none font-mono">
                  Pressione Ctrl+A ou arraste para copiar
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
