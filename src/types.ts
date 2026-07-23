export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'colaborador';
  status: 'ativo' | 'inativo';
}

export interface Client {
  id: string;
  name: string;
  cpfCnpj: string;
  cpf?: string;
  cnpj?: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  observacoes: string;
  status: 'ativo' | 'inativo';
  tags: string[];
  historico: Array<{ id: string; data: string; descricao: string; responsavel: string }>;
}

export interface Service {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: 'IRPF' | 'MEI' | 'Carne-leao' | 'Regularizacao' | 'Parcelamentos' | 'BPO' | 'Outros';
  valor: number;
  status: 'Pendente' | 'Em Andamento' | 'Concluido' | 'Cancelado';
  responsavel: string;
  prazo: string;
  checklist: Array<{ id: string; tarefa: string; concluido: boolean }>;
  observacoes: string;
}

export interface FinancialEntry {
  id: string;
  tipo: 'Receita' | 'Despesa';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  dataVencimento?: string;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  clienteId?: string;
  clienteNome?: string;
}

export interface ScheduleEvent {
  id: string;
  titulo: string;
  descricao: string;
  dataInicio: string; // ISO string without timezone or YYYY-MM-DD
  dataFim: string;
  clienteId?: string;
  clienteNome?: string;
  categoria: 'Reuniao' | 'Entrega' | 'Fiscal' | 'Outro';
}

export interface PasswordVault {
  id: string;
  titulo: string;
  servicoUrl: string;
  usuario: string;
  senhaObfuscated: string;
  clienteId?: string;
  clienteNome?: string;
  ultimaAlteracao: string;
}

export interface PasswordAccessLog {
  id: string;
  vaultId: string;
  titulo: string;
  usuarioNome: string;
  timestamp: string;
}

export interface FiscalDeadline {
  id: string;
  titulo: 'DAS' | 'DARF' | 'IRPF' | 'DASNS-Simei' | 'EFD Reinf' | 'GIA' | 'Outros';
  descricao: string;
  prazo: string; // YYYY-MM-DD
  status: 'Pendência' | 'Guia Emitida' | 'Pago' | 'Vencido';
  clienteId: string;
  clienteNome: string;
  valor?: number;
}

export interface Task {
  id: string;
  titulo: string;
  prioridade: 'Alta' | 'Media' | 'Baixa';
  responsavel: string;
  status: 'Pendente' | 'Em Progresso' | 'Concluida';
  checklist: Array<{ id: string; item: string; concluido: boolean }>;
  comentarios: Array<{ id: string; autor: string; data: string; texto: string }>;
  prazo: string;
}

export interface DocumentInfo {
  id: string;
  nome: string;
  tipo: 'PDF' | 'XML' | 'Imagem' | 'Outro';
  clienteId: string;
  clienteNome: string;
  tamanho: string;
  dataCriacao: string;
  contentBase64?: string; // stored for download
}

export interface AuditLog {
  id: string;
  usuarioNome: string;
  acao: string;
  detalhes: string;
  timestamp: string;
}
