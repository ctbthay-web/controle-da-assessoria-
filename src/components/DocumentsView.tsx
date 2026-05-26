import React, { useState } from "react";
import { 
  Upload, Search, FileText, Download, Trash2, X, PlusCircle,
  Eye, Sparkles, FolderOpen, Scale, Calendar, CheckSquare
} from "lucide-react";
import { DocumentInfo, Client } from "../types";

interface DocumentsViewProps {
  documents: DocumentInfo[];
  clients: Client[];
  onUploadDocument: (doc: { nome: string; tipo: string; clienteId: string; tamanho: string; contentBase64: string }) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
}

export function DocumentsView({
  documents,
  clients,
  onUploadDocument,
  onDeleteDocument
}: DocumentsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState<string | null>(null);

  // Upload fields
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [fileName, setFileName] = useState("");
  const [base64Content, setBase64Content] = useState("");
  const [fileSize, setFileSize] = useState("0 KB");
  const [fileType, setFileType] = useState<DocumentInfo["tipo"]>("PDF");

  // Preview fields
  const [previewDoc, setPreviewDoc] = useState<DocumentInfo | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    // Guess type from suffix
    const suffix = file.name.split(".").pop()?.toLowerCase();
    if (suffix === "pdf") setFileType("PDF");
    else if (suffix === "xml") setFileType("XML");
    else if (["png", "jpg", "jpeg", "gif"].includes(suffix || "")) setFileType("Imagem");
    else setFileType("Outro");

    // Express sizing output
    const sizeInKb = Math.round(file.size / 1024);
    setFileSize(sizeInKb >= 1024 ? (sizeInKb / 1024).toFixed(1) + " MB" : sizeInKb + " KB");

    // Convert to reader Base64
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      const cleanB64 = b64.split(",")[1] || b64; // Stripping URL parameters
      setBase64Content(cleanB64);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !fileName || !base64Content) return;

    try {
      await onUploadDocument({
        nome: fileName,
        tipo: fileType,
        clienteId,
        tamanho: fileSize,
        contentBase64: base64Content
      });
      setIsUploadOpen(false);
      setFileName("");
      setBase64Content("");
    } catch {
      alert("Erro ao catalogar documento.");
    }
  };

  const handleDownload = (doc: DocumentInfo) => {
    if (!doc.contentBase64) return;
    const linkSource = `data:application/octet-stream;base64,${doc.contentBase64}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = doc.nome;
    downloadLink.click();
  };

  const filteredDocs = documents.filter(d => {
    const term = searchQuery.toLowerCase();
    const matchSearch = d.nome.toLowerCase().includes(term);
    const matchClient = !selectedClientFilter || d.clienteId === selectedClientFilter;
    return matchSearch && matchClient;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">GED de Documentos Digitais</h2>
          <p className="text-zinc-400 text-xs text-left">Organização de Contratos Sociais, Balancetes em PDF, XMLs fiscais e comprovantes.</p>
        </div>
        <button
          onClick={() => {
            setClienteId(clients.length > 0 ? clients[0].id : "");
            setFileName("");
            setBase64Content("");
            setFileSize("0 KB");
            setIsUploadOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-center shadow-lg shadow-blue-500/10"
        >
          <Upload className="w-4 h-4" />
          Fazer Upload de Arquivo
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-[#111113] border border-white/5 rounded-xl p-4 shadow-md flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome do arquivo..."
            className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-9.5 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-550 focus:outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="bg-[#0c0c0e] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-350 outline-none focus:border-blue-500"
          value={selectedClientFilter || ""}
          onChange={(e) => setSelectedClientFilter(e.target.value || null)}
        >
          <option value="">Organização: Todos os Clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* GED list visual grid style Notion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-3 bg-[#111113] border border-white/5 rounded-xl py-12 text-center text-zinc-500 text-xs font-mono text-left px-4">
            Nenhum documento arquivado neste diretório digital.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div 
              key={doc.id} 
              className="bg-[#111113] border border-white/5 hover:border-white/10 rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-3.5 text-left"
            >
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 border border-blue-500/20 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <FileText className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs leading-normal break-all text-left" title={doc.nome}>
                      {doc.nome}
                    </h4>
                    <span className="text-[9px] bg-white/[0.04] text-zinc-400 border border-white/5 rounded font-mono font-bold px-1.5 py-0.2 mt-1 inline-block">
                      {doc.tipo}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] leading-relaxed text-zinc-400 block pl-1 bg-[#0c0c0e]/30 p-2.5 rounded-lg border border-white/5">
                  📂 Empresa: <strong className="text-zinc-200">{doc.clienteNome}</strong>
                </div>
              </div>

              {/* Lower info */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10.5px] text-zinc-500 font-mono">
                <div className="flex gap-2">
                  <span className="flex items-center gap-0.5">
                    <Scale className="w-3 h-3 text-zinc-500" />
                    {doc.tamanho}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    {new Date(doc.dataCriacao).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1 hover:bg-white/5 text-blue-400 hover:text-white rounded cursor-pointer transition-colors"
                    title="Pre-visualizar documento"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-1 hover:bg-white/5 text-blue-400 hover:text-white rounded cursor-pointer transition-colors"
                    title="Baixar arquivo seguro"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1 hover:bg-rose-500/10 text-rose-455 hover:text-rose-400 rounded cursor-pointer transition-colors"
                    title="Excluir do GED"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inline Base64 previewer modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#111113] text-zinc-200 rounded-xl border border-white/5 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0c0c0e]">
              <h3 className="font-bold text-white text-xs font-mono uppercase tracking-widest leading-none">
                Pré-visualização interna ({previewDoc.tipo})
              </h3>
              <button onClick={() => setPreviewDoc(null)} className="text-zinc-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center space-y-2 pb-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Nome do Arquivo</span>
                <h4 className="font-bold text-sm text-blue-400 leading-normal break-all">{previewDoc.nome}</h4>
                <p className="text-xs text-zinc-400">Vínculo: {previewDoc.clienteNome}</p>
              </div>

              {/* Text simulation base64 summary */}
              <div className="bg-[#0c0c0e] rounded-lg p-4 font-mono text-[11px] text-zinc-400 min-h-[140px] border border-white/5 leading-relaxed text-left max-h-60 overflow-y-auto">
                <span className="text-zinc-650 uppercase font-bold text-[9px] block mb-2">// Conteúdo Binário Descriptografado:</span>
                Contrato Social ou guia fiscal registrada em formato seguro base64. O arquivo contém hashes de auditoria e está pronto para exportação/download integral.
                <br /><br />
                Tamanho Físico: {previewDoc.tamanho}
                <br />
                Submetido em: {new Date(previewDoc.dataCriacao).toLocaleDateString("pt-BR")}
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 border border-white/5 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Fechar Visualização
                </button>
                <button
                  onClick={() => {
                    handleDownload(previewDoc);
                    setPreviewDoc(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-md shadow-blue-500/10"
                >
                  Baixar Arquivo Completo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload File dialog modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/5 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0c0c0e]">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                Submeter Arquivo p/ GED
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-455 text-[10px] font-semibold mb-1 uppercase tracking-wider font-mono">Vincular Cliente Responsável</label>
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

              {/* Native drag simulation container */}
              <div className="p-5 border-2 border-dashed border-white/10 rounded-lg text-center bg-[#0c0c0e] hover:bg-white/[0.02] transition-colors relative cursor-pointer">
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.xml"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                
                <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                
                <span className="text-xs text-zinc-300 block font-semibold">
                  {fileName ? fileName : "Clique para navegar pelos arquivos"}
                </span>
                
                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-mono">PDF, XML, Imagens (Até 50MB)</p>
              </div>

              {fileName && (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400 space-y-0.5">
                  <p><strong>Identificado:</strong> {fileName}</p>
                  <p className="font-mono text-[10.5px]">Tamanho Estimado: {fileSize} | Formato: {fileType}</p>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 border border-white/5 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-md shadow-blue-500/10"
                >
                  Catalogar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
