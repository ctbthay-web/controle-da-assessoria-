import React, { useState, useEffect } from "react";
import { 
  Plus, Search, KeyRound, ExternalLink, ShieldCheck, ShieldAlert,
  Eye, EyeOff, Copy, Trash2, X, ClipboardCheck, History, Save
} from "lucide-react";
import { PasswordVault, Client } from "../types";
import { api } from "../utils/api";

interface PasswordsViewProps {
  passwords: PasswordVault[];
  clients: Client[];
  onCreatePassword: (password: Omit<PasswordVault, "id" | "ultimaAlteracao">) => Promise<void>;
  onDeletePassword: (id: string) => Promise<void>;
}

export function PasswordsView({
  passwords,
  clients,
  onCreatePassword,
  onDeletePassword
}: PasswordsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form fields
  const [titulo, setTitulo] = useState("");
  const [servicoUrl, setServicoUrl] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senhaReal, setSenhaReal] = useState("");
  const [clienteId, setClienteId] = useState("");

  // Revealed passwords cache
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Access logs state
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);

  useEffect(() => {
    if (showLogsDrawer) {
      loadLogs();
    }
  }, [showLogsDrawer]);

  const loadLogs = async () => {
    try {
      const logs = await api.passwords.listLogs();
      setAccessLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setTitulo("");
    setServicoUrl("");
    setUsuario("");
    setSenhaReal("");
    setClienteId("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !usuario.trim() || !senhaReal.trim()) return;

    try {
      await onCreatePassword({
        titulo: titulo.trim(),
        servicoUrl: servicoUrl.trim(),
        usuario: usuario.trim(),
        senhaObfuscated: senhaReal.trim(), // API encrypts/obfuscates correctly
        clienteId: clienteId || undefined
      });
      setIsModalOpen(false);
    } catch {
      alert("Erro ao salvar senha no cofre.");
    }
  };

  const handleToggleReveal = async (id: string) => {
    if (revealedPasswords[id]) {
      // Toggle off
      const updated = { ...revealedPasswords };
      delete updated[id];
      setRevealedPasswords(updated);
    } else {
      // Fetch decrypted value and log
      try {
        const decrypted = await api.passwords.decrypt(id);
        setRevealedPasswords({
          ...revealedPasswords,
          [id]: decrypted
        });
      } catch (err) {
        alert("Acesso negado ou erro ao obter credencial.");
      }
    }
  };

  const handleCopy = async (id: string, textToCopy: string) => {
    try {
      // If NOT yet revealed, fetch real password to copy safely
      let realText = textToCopy;
      if (textToCopy.includes("********")) {
        realText = await api.passwords.decrypt(id);
      }
      
      await navigator.clipboard.writeText(realText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  const filteredPasswords = passwords.filter(p => {
    const term = searchQuery.toLowerCase();
    return (
      p.titulo.toLowerCase().includes(term) ||
      p.usuario.toLowerCase().includes(term) ||
      (p.clienteNome && p.clienteNome.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Cofre de Senhas Criptografado</h2>
          <p className="text-zinc-400 text-xs text-left">Controle e compartilhamento seguro de acessos gov.br, Sefaz e prefeituras.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowLogsDrawer(true)}
            className="border border-white/5 hover:bg-white/[0.03] text-zinc-300 text-xs font-semibold px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-zinc-455" />
            Logs de Acesso
          </button>
          <button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            Nova Credencial
          </button>
        </div>
      </div>

      {/* Info Warning Bar */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3 text-xs leading-normal text-amber-300 text-left">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-200">Política de Segurança Interna:</strong> Todas as visualizações e cópias de dados no cofre de senhas criam
          automaticamente um registro imutável no log de auditoria operacional do escritório contábil.
        </div>
      </div>

      {/* Search filters */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-4 shadow-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por portal, usuário ou cliente..."
            className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-9.5 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-550 focus:outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid List matching CRM design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPasswords.length === 0 ? (
          <div className="col-span-3 bg-[#111113] border border-white/5 rounded-xl py-12 text-center text-zinc-500 text-xs font-mono">
            Nenhuma credencial cadastrada com o filtro atual.
          </div>
        ) : (
          filteredPasswords.map(p => {
            const isRevealed = !!revealedPasswords[p.id];
            const displayPass = isRevealed ? revealedPasswords[p.id] : "••••••••";

            return (
              <div 
                key={p.id} 
                className="bg-[#111113] border border-white/5 hover:border-white/10 rounded-xl p-4.5 shadow-md space-y-3.5 text-left flex flex-col justify-between transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm leading-tight text-left">{p.titulo}</h4>
                      {p.servicoUrl && (
                        <a 
                          href={p.servicoUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10.5px] text-blue-400 font-mono hover:underline flex items-center gap-0.5 mt-0.5"
                        >
                          Acessar link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/10">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Account / User */}
                  <div className="space-y-2 pt-1">
                    <div className="text-xs bg-[#0c0c0e]/40 rounded-lg p-3 border border-white/5 space-y-1.5">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block font-mono">Usuário / Código</span>
                        <span className="font-semibold text-zinc-300 break-all">{p.usuario}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block font-mono">Senha de Acesso</span>
                        <div className="flex items-center justify-between font-mono font-bold text-xs pt-0.5">
                          <span className={isRevealed ? "text-blue-400 font-semibold" : "text-zinc-500 tracking-widest"}>
                            {displayPass}
                          </span>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleToggleReveal(p.id)}
                              className="p-1 text-zinc-500 hover:text-white rounded cursor-pointer transition-colors"
                              title={isRevealed ? "Ocultar" : "Mostrar"}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopy(p.id, isRevealed ? revealedPasswords[p.id] : p.senhaObfuscated)}
                              className="p-1 text-zinc-500 hover:text-white rounded cursor-pointer transition-colors"
                              title="Copiar senha"
                            >
                              {copiedId === p.id ? (
                                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[10.5px] text-zinc-500">
                  <span className="truncate max-w-[130px] font-semibold" title={p.clienteNome}>
                    📋 {p.clienteNome || "Geral do Escritório"}
                  </span>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onDeletePassword(p.id)}
                      className="text-rose-450 hover:bg-[#ffebeb]/5 p-1 rounded transition-colors cursor-pointer"
                      title="Excluir credencial"
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

      {/* Access logs Audit Slider drawer */}
      {showLogsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-[#111113] border-l border-white/5 w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0 bg-[#0c0c0e] text-white">
              <div className="text-left">
                <span className="text-[9px] text-zinc-550 font-mono tracking-wider uppercase block font-semibold">Auditoria Cofre</span>
                <h3 className="font-bold text-sm leading-tight">Rastreabilidade de Senhas</h3>
              </div>
              <button
                onClick={() => setShowLogsDrawer(false)}
                className="text-zinc-550 hover:text-white p-1 rounded hover:bg-white/[0.04] cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-4 text-left">
              <h4 className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">Acessos Efetuados</h4>
              
              {accessLogs.length === 0 ? (
                <div className="text-center text-zinc-500 text-xs py-8 font-mono">Nenhum evento registrado no cofre.</div>
              ) : (
                <div className="space-y-2.5">
                  {accessLogs.map((log: any) => (
                    <div key={log.id} className="bg-white/[0.01] border border-white/5 rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between font-mono text-[9px] text-zinc-500 mb-1">
                        <span>{new Date(log.timestamp).toLocaleDateString("pt-BR")} | {new Date(log.timestamp).toLocaleTimeString("pt-BR")}</span>
                        <span className="font-bold text-zinc-400 bg-white/[0.03] border border-white/5 px-1.5 py-0.5 rounded">{log.usuarioNome}</span>
                      </div>
                      <p className="text-zinc-300 leading-normal">
                        Visualizou ou copiou a credencial do portal: <strong className="text-blue-400">{log.titulo}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Vault Register dialog slider */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/5 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0c0c0e]">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                Cadastrar Senha no Cofre
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Nome / Identificação (Ex: e-CAC Receita)</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="e-CAC Receita Federal"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">URL do Serviço (Opcional)</label>
                <input
                  type="url"
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="https://cav.receita.fazenda.gov.br"
                  value={servicoUrl}
                  onChange={(e) => setServicoUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Cliente Vinculado (Opcional)</label>
                <select
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                >
                  <option value="">Geral do Escritório</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Código de Usuário / Acesso</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: CPF ou CNPJ ou Usuario_01"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Senha Real de Acesso</label>
                <input
                  type="password"
                  required
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="Insira a senha de login direta"
                  value={senhaReal}
                  onChange={(e) => setSenhaReal(e.target.value)}
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
                  Salvar com Segurança
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
