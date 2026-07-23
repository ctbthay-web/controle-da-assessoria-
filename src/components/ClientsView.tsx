import React, { useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, Tag, Phone, Mail, 
  MapPin, Clock, History, FilePlus2, X, AlertCircle, CheckCircle, Save
} from "lucide-react";
import { Client } from "../types";

interface ClientsViewProps {
  clients: Client[];
  onCreateClient: (client: Omit<Client, "id" | "historico">) => Promise<void>;
  onUpdateClient: (id: string, client: Partial<Client>) => Promise<void>;
  onAddHistory: (id: string, Descricao: string) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

export function ClientsView({
  clients,
  onCreateClient,
  onUpdateClient,
  onAddHistory,
  onDeleteClient
}: ClientsViewProps) {
  // Navigation & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);
  
  // New Client Form inputs
  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState<'ativo' | 'inativo'>("ativo");
  const [tagsInput, setTagsInput] = useState("");

  // History Drawer State
  const [activeHistoryClient, setActiveHistoryClient] = useState<Client | null>(null);
  const [newHistoryDesc, setNewHistoryDesc] = useState("");

  // Gather unique tags
  const allTags = Array.from(new Set(clients.flatMap(c => c.tags || [])));

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.cpfCnpj.includes(searchQuery) || 
      (c.cpf && c.cpf.includes(searchQuery)) ||
      (c.cnpj && c.cnpj.includes(searchQuery)) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = !selectedTag || (c.tags && c.tags.includes(selectedTag));
    const matchesStatus = !selectedStatus || c.status === selectedStatus;

    return matchesSearch && matchesTag && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setName("");
    setCpfCnpj("");
    setCpf("");
    setCnpj("");
    setTelefone("");
    setWhatsapp("");
    setEmail("");
    setEndereco("");
    setObservacoes("");
    setStatus("ativo");
    setTagsInput("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCpfCnpj(client.cpfCnpj);
    
    if (client.cpf !== undefined || client.cnpj !== undefined) {
      setCpf(client.cpf || "");
      setCnpj(client.cnpj || "");
    } else {
      const val = client.cpfCnpj || "";
      const clean = val.replace(/\D/g, "");
      if (clean.length > 11) {
        setCnpj(val);
        setCpf("");
      } else {
        setCpf(val);
        setCnpj("");
      }
    }

    setTelefone(client.telefone);
    setWhatsapp(client.whatsapp);
    setEmail(client.email);
    setEndereco(client.endereco);
    setObservacoes(client.observacoes || "");
    setStatus(client.status);
    setTagsInput((client.tags || []).join(", "));
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCpfCnpj = cnpj.trim() || cpf.trim();
    if (!finalCpfCnpj.trim()) {
      alert("Por favor, informe o CPF ou o CNPJ do cliente.");
      return;
    }

    const parsedTags = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const clientPayload = {
      name,
      cpfCnpj: finalCpfCnpj,
      cpf: cpf.trim(),
      cnpj: cnpj.trim(),
      telefone,
      whatsapp,
      email,
      endereco,
      observacoes,
      status,
      tags: parsedTags
    };

    try {
      if (editingClient) {
        await onUpdateClient(editingClient.id, clientPayload);
      } else {
        await onCreateClient(clientPayload);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("Erro ao salvar cliente.");
    }
  };

  const handleAddHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHistoryDesc.trim() || !activeHistoryClient) return;

    try {
      await onAddHistory(activeHistoryClient.id, newHistoryDesc);
      
      // Update local client with new logs directly in UI
      const updated = clients.find(c => c.id === activeHistoryClient.id);
      if (updated) {
        setActiveHistoryClient(updated);
      }
      setNewHistoryDesc("");
    } catch (err) {
      alert("Erro ao registrar no log de histórico.");
    }
  };
  return (
    <div className="space-y-6 font-sans">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Carteira de Clientes</h2>
          <p className="text-zinc-400 text-xs text-left">Ficha completa de cadastro, tags, status e histórico cronológico.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-center shadow-lg shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-4 shadow-md space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Query search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por Nome, CNPJ, CPF ou E-mail..."
              className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-9.5 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick status filter select */}
          <select
            className="bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
            value={selectedStatus || ""}
            onChange={(e) => setSelectedStatus(e.target.value || null)}
          >
            <option value="">Status: Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        {/* Dynamic Tags Selector */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/5">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono mr-1">Filtrar por Tag:</span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-[10.5px] px-2.5 py-1 rounded-full border transition-all cursor-pointer font-semibold ${
              !selectedTag
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-white/[0.01]/40 text-zinc-400 hover:text-white border-white/5 hover:border-white/10"
            }`}
          >
            Todas
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`text-[10.5px] px-2.5 py-1 rounded-full border transition-all cursor-pointer font-semibold ${
                tag === selectedTag
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-white/[0.01]/40 text-zinc-400 hover:text-white border-white/5 hover:border-white/10"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main clients grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {filteredClients.length === 0 ? (
          <div className="bg-[#111113] border border-white/5 rounded-xl py-12 text-center text-zinc-500 text-xs font-mono">
            Nenhum cliente atende aos critérios de pesquisa.
          </div>
        ) : (
          filteredClients.map(client => (
            <div
              key={client.id}
              className="bg-[#111113] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col lg:flex-row justify-between gap-6 shadow-md"
            >
              {/* Profile card section */}
              <div className="space-y-3 flex-1 text-left">
                <div className="flex items-start gap-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      {client.name}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        client.status === "ativo" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-white/[0.02]/30 text-zinc-500 border border-white/5"
                      }`}>
                        {client.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </h3>
                    {client.cnpj && client.cpf ? (
                      <p className="text-zinc-500 text-xs font-mono">
                        CNPJ: <span className="text-zinc-300">{client.cnpj}</span> <span className="text-zinc-600">|</span> CPF: <span className="text-zinc-300">{client.cpf}</span>
                      </p>
                    ) : client.cnpj ? (
                      <p className="text-zinc-500 text-xs font-mono">CNPJ: <span className="text-zinc-300">{client.cnpj}</span></p>
                    ) : client.cpf ? (
                      <p className="text-zinc-500 text-xs font-mono">CPF: <span className="text-zinc-300">{client.cpf}</span></p>
                    ) : (
                      <p className="text-zinc-500 text-xs font-mono">CPF / CNPJ: <span className="text-zinc-300">{client.cpfCnpj}</span></p>
                    )}
                  </div>
                </div>

                {/* Tags section */}
                {client.tags && client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {client.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-white/[0.03]/50 text-zinc-400 px-2 py-0.5 rounded border border-white/5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Info contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{client.whatsapp || client.telefone || "Sem fone"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2 md:col-span-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{client.endereco || "Não cadastrado"}</span>
                  </div>
                </div>

                {client.observacoes && (
                  <div className="text-xs bg-white/[0.01] rounded-lg p-2.5 border border-white/5 text-zinc-400 leading-normal">
                    <strong className="text-blue-400">Nota:</strong> {client.observacoes}
                  </div>
                )}
              </div>

              {/* Action and historical triggers */}
              <div className="flex lg:flex-col justify-end lg:justify-between items-end gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(client)}
                    className="p-1.5 border border-white/5 hover:bg-white/[0.03] text-zinc-400 rounded-lg transition-colors cursor-pointer hover:border-white/10"
                    title="Editar ficha"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (clientToDeleteId === client.id) {
                        onDeleteClient(client.id);
                        setClientToDeleteId(null);
                      } else {
                        setClientToDeleteId(client.id);
                        setTimeout(() => {
                          setClientToDeleteId(prev => prev === client.id ? null : prev);
                        }, 4000);
                      }
                    }}
                    className={`p-1.5 border rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs ${
                      clientToDeleteId === client.id
                        ? "bg-rose-500/20 border-rose-500/30 text-rose-400 font-bold"
                        : "border-rose-500/10 text-rose-400 hover:bg-rose-500/10"
                    }`}
                    title={clientToDeleteId === client.id ? "Clique novamente para confirmar a exclusão" : "Excluir"}
                  >
                    {clientToDeleteId === client.id ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Confirmar?</span>
                      </>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setActiveHistoryClient(client);
                    setNewHistoryDesc("");
                  }}
                  className="bg-blue-500/10 border border-blue-500/15 hover:bg-blue-500/15 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" />
                  Histórico ({client.historico ? client.historico.length : 0})
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 1. Standard Create / Edit Client Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/5 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0c0c0e]">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                {editingClient ? "Editar Ficha de Client" : "Cadastrar Novo Cliente"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Nome / Razão Social</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    placeholder="Padaria Paulista Ltda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">CPF</label>
                  <input
                    type="text"
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">CNPJ</label>
                  <input
                    type="text"
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Status Interno</label>
                  <select
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Telefone Fixo</label>
                  <input
                    type="text"
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    placeholder="(11) 3244-1188"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">WhatsApp</label>
                  <input
                    type="text"
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    placeholder="(11) 98822-1133"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">E-mail para envio de guias</label>
                  <input
                    type="email"
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    placeholder="contato@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Endereço Completo</label>
                  <input
                    type="text"
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Tags (Separar por vírgula)</label>
                  <input
                    type="text"
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    placeholder="Simples Nacional, Anexo I, Mensal"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono">Observações Internas</label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    placeholder="Informações específicas ou alertas..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/15"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Interactive Historical Drawer Panel Overlay */}
      {activeHistoryClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-[#111113] border-l border-white/5 w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b shrink-0 border-white/5 bg-[#0c0c0e] text-white">
              <div className="text-left">
                <span className="text-[9px] text-zinc-400 font-mono tracking-wider uppercase block font-semibold">Logs Cronológicos</span>
                <h3 className="font-bold text-sm leading-tight max-w-[285px]">{activeHistoryClient.name}</h3>
              </div>
              <button
                onClick={() => setActiveHistoryClient(null)}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/[0.04] cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Addition Form */}
            <form onSubmit={handleAddHistorySubmit} className="p-6 border-b border-white/5 bg-[#0c0c0e]/30 shrink-0 text-left">
              <label className="block text-zinc-405 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">Adicionar Anotação / Evento</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: Entregou os comprovantes p/ imposto ou mudou regime..."
                  className="flex-1 bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  value={newHistoryDesc}
                  onChange={(e) => setNewHistoryDesc(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0 shadow-md shadow-blue-500/10"
                >
                  Inserir
                </button>
              </div>
            </form>

            {/* List history events */}
            <div className="flex-1 p-6 space-y-4 text-left">
              <h4 className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-widest">Linha do Tempo</h4>
              
              {!activeHistoryClient.historico || activeHistoryClient.historico.length === 0 ? (
                <div className="text-center text-zinc-500 text-xs py-8 font-mono">Sem registros anteriores.</div>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                  {activeHistoryClient.historico.map((h) => (
                    <div key={h.id} className="relative pl-7 text-xs">
                      {/* Bullet */}
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-600/35 border-2 border-[#111113] ring-4 ring-blue-500/5"></div>
                      
                      <div className="bg-white/[0.01] border border-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between font-mono text-[9px] text-zinc-500 mb-1">
                          <span>{new Date(h.data).toLocaleDateString("pt-BR")}</span>
                          <span className="font-bold text-zinc-400">{h.responsavel || "Thayane C."}</span>
                        </div>
                        <p className="text-zinc-300 leading-normal">{h.descricao}</p>
                      </div>
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
