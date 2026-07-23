import React, { useState, useEffect } from "react";
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Key, Link as LinkIcon, X, Copy, ShieldAlert } from "lucide-react";
import { api } from "../utils/api";

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export function SupabaseSyncModal({ isOpen, onClose, onSyncComplete }: SupabaseSyncModalProps) {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [status, setStatus] = useState<{ configured: boolean; url: string; hasKey: boolean } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string; details?: any } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await api.supabase.getStatus();
      setStatus(data);
      if (data.url) {
        setSupabaseUrl(data.url.startsWith("http") ? data.url : `https://${data.url}`);
      }
    } catch (err) {
      console.error("Erro ao verificar Supabase:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      setSyncMessage({ type: "error", text: "Preencha a URL e a Chave do Supabase." });
      return;
    }

    setSavingConfig(true);
    setSyncMessage(null);
    try {
      const res = await api.supabase.saveConfig(supabaseUrl, supabaseKey);
      setSyncMessage({ type: "success", text: res.message });
      await checkStatus();
    } catch (err: any) {
      setSyncMessage({ type: "error", text: err.message || "Erro ao salvar credenciais." });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.supabase.syncAll(
        supabaseUrl || undefined,
        supabaseKey || undefined
      );
      if (res.success) {
        setSyncMessage({
          type: "success",
          text: "Todas as tabelas do sistema foram sincronizadas com o Supabase com sucesso!",
          details: res.results
        });
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncMessage({ type: "error", text: res.message || "Falha na sincronização." });
      }
    } catch (err: any) {
      setSyncMessage({
        type: "error",
        text: err.message || "Erro durante a sincronização com o banco do Supabase."
      });
    } finally {
      setSyncing(false);
    }
  };

  const rlsSqlCode = `-- COPIE E EXECUTE ESTE SCRIPT NO "SQL EDITOR" DO SEU SUPABASE
-- Ele cria e ajusta todas as 9 tabelas com todas as colunas necessárias e libera as permissões RLS:

CREATE TABLE IF NOT EXISTS public.clients (
  id text PRIMARY KEY,
  name text,
  "cpfCnpj" text,
  "razaoSocial" text,
  "nomeFantasia" text,
  "inscricaoEstadual" text,
  "inscricaoMunicipal" text,
  "regimeTributario" text,
  email text,
  telefone text,
  whatsapp text,
  endereco text,
  cidade text,
  uf text,
  cep text,
  status text,
  "responsavelContabil" text,
  "honorarioMensal" numeric,
  "dataVencimentoHonorario" integer,
  historico jsonb DEFAULT '[]'::jsonb,
  observacoes text
);

CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY,
  "clienteId" text,
  "clienteNome" text,
  tipo text,
  competencia text,
  status text,
  responsavel text,
  "dataInicio" text,
  "dataConclusao" text,
  observacoes text
);

CREATE TABLE IF NOT EXISTS public.financial (
  id text PRIMARY KEY,
  "clienteId" text,
  "clienteNome" text,
  tipo text,
  categoria text,
  descricao text,
  valor numeric,
  "dataVencimento" text,
  "dataPagamento" text,
  status text,
  "comprovanteUrl" text
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id text PRIMARY KEY,
  "clienteId" text,
  "clienteNome" text,
  titulo text,
  tipo text,
  data text,
  horario text,
  status text,
  pauta text
);

CREATE TABLE IF NOT EXISTS public.passwords (
  id text PRIMARY KEY,
  "clienteId" text,
  "clienteNome" text,
  categoria text,
  titulo text,
  url text,
  usuario text,
  "senhaObfuscated" text,
  observacoes text
);

CREATE TABLE IF NOT EXISTS public.fiscal_deadlines (
  id text PRIMARY KEY,
  "clienteId" text,
  "clienteNome" text,
  titulo text,
  imposto text,
  competencia text,
  "dataVencimento" text,
  "valorEstimado" numeric,
  status text,
  "guiaUrl" text,
  "comprovanteUrl" text
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id text PRIMARY KEY,
  "clienteId" text,
  "clienteNome" text,
  titulo text,
  responsavel text,
  prioridade text,
  status text,
  "dataLimite" text,
  descricao text,
  comentarios jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.documents (
  id text PRIMARY KEY,
  "clienteId" text,
  "clienteNome" text,
  nome text,
  tipo text,
  tamanho numeric,
  "dataUpload" text,
  url text,
  categoria text
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id text PRIMARY KEY,
  "usuarioNome" text,
  acao text,
  detalhes text,
  timestamp text
);

-- Desabilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passwords DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fiscal_deadlines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;`;

  const copySql = () => {
    navigator.clipboard.writeText(rlsSqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121215] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-zinc-300 p-6 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-snug">Integração & Sincronização com Supabase</h3>
              <p className="text-xs text-zinc-400">Conecte seu projeto Supabase para salvar dados em tempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.configured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <span className="text-xs font-semibold text-white block">
                {status?.configured ? "Supabase Conectado" : "Supabase Pendente de Configuração"}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {status?.url ? `Projeto: ${status.url}` : "Nenhum projeto associado no momento"}
              </span>
            </div>
          </div>
          <button
            onClick={checkStatus}
            disabled={loadingStatus}
            className="p-2 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-white/5 cursor-pointer text-xs flex items-center gap-1.5 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* Feedback Messages */}
        {syncMessage && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            syncMessage.type === "success" 
              ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-300" 
              : "bg-rose-950/30 border-rose-500/20 text-rose-300"
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {syncMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{syncMessage.text}</span>
            </div>
            {syncMessage.details && (
              <div className="pt-2 border-t border-white/10 text-[11px] font-mono grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(syncMessage.details).map(([tbl, val]: any) => (
                  <div key={tbl} className="bg-black/30 p-2 rounded border border-white/5">
                    <span className="block text-zinc-400 capitalize">{tbl}</span>
                    <span className={val.error ? "text-rose-400" : "text-emerald-400"}>
                      {val.count} registro(s) {val.error ? "(com aviso)" : "OK"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
              URL do Projeto Supabase
            </label>
            <input
              type="text"
              placeholder="https://sua-id-projeto.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Chave de API do Supabase (anon key ou service_role)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={savingConfig}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingConfig ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Salvando Credenciais...
                </>
              ) : (
                "Salvar Configuração no Servidor"
              )}
            </button>

            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={syncing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sincronizando Tabelas...
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  Enviar Todos os Dados para Supabase
                </>
              )}
            </button>
          </div>
        </form>

        {/* SQL RLS Help Section */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              Dica Importante: Permissões de RLS no Supabase
            </div>
            <button
              onClick={copySql}
              className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <Copy className="w-3 h-3" />
              {copiedSql ? "Copiado!" : "Copiar SQL"}
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Se suas tabelas continuarem vazias após a sincronização, é porque o Supabase bloqueia gravações públicas por padrão via RLS (Row Level Security). Clique em <strong className="text-amber-300 font-mono">Copiar SQL</strong> e cole no <strong className="text-white">SQL Editor</strong> do seu Supabase para liberar o acesso:
          </p>
          <pre className="bg-black/60 p-3 rounded-lg text-[10px] font-mono text-amber-200 overflow-x-auto border border-white/5 max-h-32">
            {rlsSqlCode}
          </pre>
        </div>

      </div>
    </div>
  );
}
