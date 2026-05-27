import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  User, Client, Service, FinancialEntry, ScheduleEvent, 
  PasswordVault, PasswordAccessLog, FiscalDeadline, Task, 
  DocumentInfo, AuditLog 
} from "./src/types";

const app = express();
const PORT = 3000;

// Enable JSON bodies with limit for base64 file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DB_FILE = path.join(process.cwd(), "database.json");

// Helper interface for full DB
interface AppDatabase {
  users: User[];
  clients: Client[];
  services: Service[];
  financial: FinancialEntry[];
  schedules: ScheduleEvent[];
  passwords: PasswordVault[];
  passwordAccessLogs: PasswordAccessLog[];
  fiscalDeadlines: FiscalDeadline[];
  tasks: Task[];
  documents: DocumentInfo[];
  logs: AuditLog[];
}

// Ensure database file exists with initial beautiful seed data in Portuguese Brazil
function loadDatabase(): AppDatabase {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDb: AppDatabase = {
      users: [
        { id: "1", name: "Thayane Carvalho", email: "ctbthay@gmail.com", role: "admin", status: "ativo" },
        { id: "2", name: "Carlos Souza", email: "carlos@contabil.com", role: "colaborador", status: "ativo" },
        { id: "3", name: "Beatriz Lima", email: "beatriz@contabil.com", role: "colaborador", status: "ativo" }
      ],
      clients: [
        {
          id: "cli_1",
          name: "Padaria Central da Alvorada Ltda",
          cpfCnpj: "12.345.678/0001-90",
          telefone: "(11) 3244-1188",
          whatsapp: "(11) 98822-1133",
          email: "contato@padariacentral.com.br",
          endereco: "Av. Paulista, 1200, Bela Vista, São Paulo - SP",
          observacoes: "Cliente do Simples Nacional, Anexo I. Retira guias por WhatsApp.",
          status: "ativo",
          tags: ["Anexo I", "Simples Nacional", "Mensal"],
          historico: [
            { id: "h1", data: "2026-05-10", descricao: "Abertura do CNPJ concluída com sucesso.", responsavel: "Thayane Carvalho" },
            { id: "h2", data: "2026-05-20", descricao: "Reunião de alinhamento sobre pró-labore.", responsavel: "Carlos Souza" }
          ]
        },
        {
          id: "cli_2",
          name: "Consultoria Silva ME",
          cpfCnpj: "98.765.432/0001-21",
          telefone: "(11) 4042-9922",
          whatsapp: "(11) 97722-5500",
          email: "financeiro@silvaconsultoria.pro",
          endereco: "Rua Augusta, 540, Sala 12, São Paulo - SP",
          observacoes: "Regime de Lucro Presumido. Enviar balancete trimestral.",
          status: "ativo",
          tags: ["Lucro Presumido", "Trimestral", "Serviços"],
          historico: [
            { id: "h3", data: "2026-05-15", descricao: "Entrega da DCTF de Abril realizada.", responsavel: "Carlos Souza" }
          ]
        },
        {
          id: "cli_3",
          name: "Roberto de Oliveira (Iniciais IRPF)",
          cpfCnpj: "123.456.789-00",
          telefone: "(21) 2244-1100",
          whatsapp: "(21) 96541-2299",
          email: "roberto@oliveira.net",
          endereco: "Av. Atlântica, 420, Copacabana, Rio de Janeiro - RJ",
          observacoes: "Envio de declaração anual de imposto de renda.",
          status: "ativo",
          tags: ["IRPF", "Anual", "Pessoa Física"],
          historico: [
            { id: "h4", data: "2026-05-18", descricao: "Recepção de todos os comprovantes de rendimento.", responsavel: "Beatriz Lima" }
          ]
        },
        {
          id: "cli_4",
          name: "Auto Peças Aliança Eireli",
          cpfCnpj: "44.555.666/0001-44",
          telefone: "(31) 3344-5566",
          whatsapp: "(31) 98844-3322",
          email: "compras@pecasalianca.com.br",
          endereco: "Av. do Contorno, 8500, Belo Horizonte - MG",
          observacoes: "Cliente em fase de transição de MEI para ME.",
          status: "inativo",
          tags: ["Transição", "MEI"],
          historico: [
            { id: "h5", data: "2026-05-02", descricao: "Solicitado desenquadramento do MEI por excesso de faturamento.", responsavel: "Thayane Carvalho" }
          ]
        }
      ],
      services: [
        {
          id: "srv_1",
          clienteId: "cli_1",
          clienteNome: "Padaria Central da Alvorada Ltda",
          tipo: "BPO",
          valor: 1250.00,
          status: "Em Andamento",
          responsavel: "Carlos Souza",
          prazo: "2026-06-05",
          checklist: [
            { id: "c1", tarefa: "Conciliação bancária de Maio", concluido: true },
            { id: "c2", tarefa: "Emissão de Notas de Serviço tomados", concluido: true },
            { id: "c3", tarefa: "Apuração preliminar Simples Nacional", concluido: false },
            { id: "c4", tarefa: "Envio de relatórios do fluxo de caixa", concluido: false }
          ],
          observacoes: "Verificar divergência de R$ 340,00 na folha de pagamentos anterior."
        },
        {
          id: "srv_2",
          clienteId: "cli_2",
          clienteNome: "Consultoria Silva ME",
          tipo: "Regularizacao",
          valor: 1800.00,
          status: "Pendente",
          responsavel: "Thayane Carvalho",
          prazo: "2026-05-30",
          checklist: [
            { id: "c5", tarefa: "Levantamento de pendências na PGFN", concluido: false },
            { id: "c6", tarefa: "Protocolo de parcelamento especial", concluido: false }
          ],
          observacoes: "Cliente deseja parcelar impostos federais em atraso desde 2024."
        },
        {
          id: "srv_3",
          clienteId: "cli_3",
          clienteNome: "Roberto de Oliveira (Iniciais IRPF)",
          tipo: "IRPF",
          valor: 450.00,
          status: "Concluido",
          responsavel: "Beatriz Lima",
          prazo: "2026-05-31",
          checklist: [
            { id: "c7", tarefa: "Digitação de bens e direitos", concluido: true },
            { id: "c8", tarefa: "Cruzamento com a pré-preenchida", concluido: true },
            { id: "c9", tarefa: "Transmissão da Declaração à RFB", concluido: true },
            { id: "c10", tarefa: "Envio do recibo e DARF de quota única", concluido: true }
          ],
          observacoes: "Declaração transmitida com imposto a pagar de R$ 1.250,00."
        }
      ],
      financial: [
        { id: "fin_1", tipo: "Receita", categoria: "Honorários Mensais", descricao: "Mensalidade Contábil - Padaria Central", valor: 1250.00, data: "2026-05-05", dataVencimento: "2026-05-10", status: "Pago", clienteId: "cli_1", clienteNome: "Padaria Central da Alvorada Ltda" },
        { id: "fin_2", tipo: "Receita", categoria: "Honorários Mensais", descricao: "Mensalidade Contábil - Consultoria Silva", valor: 1500.00, data: "2026-05-10", dataVencimento: "2026-05-15", status: "Pago", clienteId: "cli_2", clienteNome: "Consultoria Silva ME" },
        { id: "fin_3", tipo: "Receita", categoria: "Serviço Avulso", descricao: "Declaração IRPF 2026 - Roberto Oliveira", valor: 450.00, data: "2026-05-18", dataVencimento: "2026-05-20", status: "Pago", clienteId: "cli_3", clienteNome: "Roberto de Oliveira (Iniciais IRPF)" },
        { id: "fin_4", tipo: "Receita", categoria: "Serviço Avulso", descricao: "Processo de Regularização - Consultoria Silva", valor: 1800.00, data: "2026-05-28", dataVencimento: "2026-05-30", status: "Pendente", clienteId: "cli_2", clienteNome: "Consultoria Silva ME" },
        { id: "fin_5", tipo: "Despesa", categoria: "Sistemas", descricao: "Assinatura Software Domínio Thomson Reuters", valor: 680.00, data: "2026-05-02", dataVencimento: "2026-05-05", status: "Pago" },
        { id: "fin_6", tipo: "Despesa", categoria: "Infraestrutura", descricao: "Aluguel da Sala Comercial SP", valor: 2500.00, data: "2026-05-05", dataVencimento: "2026-05-10", status: "Pago" },
        { id: "fin_7", tipo: "Despesa", categoria: "Marketing", descricao: "Anúncios Meta Ads Contábil", valor: 400.00, data: "2026-05-12", dataVencimento: "2026-05-15", status: "Pago" },
        { id: "fin_8", tipo: "Despesa", categoria: "Sistemas", descricao: "Assinatura Plataforma de Assinatura Digital", valor: 150.00, data: "2026-05-25", dataVencimento: "2026-05-30", status: "Pendente" },
        { id: "fin_9", tipo: "Receita", categoria: "Honorários Mensais", descricao: "Mensalidade Contábil Residual - Auto Peças Aliança", valor: 800.00, data: "2026-04-15", dataVencimento: "2026-04-20", status: "Atrasado", clienteId: "cli_4", clienteNome: "Auto Peças Aliança Eireli" }
      ],
      schedules: [
        { id: "sch_1", titulo: "Reunião de Alinhamento Fiscal", descricao: "Conversar sobre distribuição de lucros isentos com sócio da Consultoria Silva.", dataInicio: "2026-05-26T10:00", dataFim: "2026-05-26T11:00", clienteId: "cli_2", clienteNome: "Consultoria Silva ME", categoria: "Reuniao" },
        { id: "sch_2", titulo: "Entrega SPED Contábil", descricao: "Prazo interno para validação no PVA antes do envio definitivo.", dataInicio: "2026-05-28T09:00", dataFim: "2026-05-28T18:00", clienteId: "cli_1", clienteNome: "Padaria Central da Alvorada Ltda", categoria: "Fiscal" },
        { id: "sch_3", titulo: "Assinatura Contrato Social", descricao: "Assinatura digital gov.br para alteração cadastral.", dataInicio: "2026-05-29T14:30", dataFim: "2026-05-29T15:30", clienteId: "cli_4", clienteNome: "Auto Peças Aliança Eireli", categoria: "Entrega" }
      ],
      passwords: [
        { id: "pwd_1", titulo: "Portal e-CAC Receita Federal", servicoUrl: "https://cav.receita.fazenda.gov.br", usuario: "12.345.678/0001-90 (Procuração / Certificado)", senhaObfuscated: "********", clienteId: "cli_1", clienteNome: "Padaria Central da Alvorada Ltda", ultimaAlteracao: "2026-05-01" },
        { id: "pwd_2", titulo: "Sefaz SP - Posto Fiscal Eletrônico", servicoUrl: "https://www.pfe.fazenda.sp.gov.br", usuario: "padariacentral_pf", senhaObfuscated: "SenhaPFE2026#", clienteId: "cli_1", clienteNome: "Padaria Central da Alvorada Ltda", ultimaAlteracao: "2026-05-15" },
        { id: "pwd_3", titulo: "Portal Simples Nacional", servicoUrl: "https://www8.receita.fazenda.gov.br/simplesnacional", usuario: "Código Acesso: 4124991203", senhaObfuscated: "SimplesAcesso99!", clienteId: "cli_1", clienteNome: "Padaria Central da Alvorada Ltda", ultimaAlteracao: "2026-05-10" }
      ],
      passwordAccessLogs: [
        { id: "p_acc_1", vaultId: "pwd_1", titulo: "Portal e-CAC Receita Federal", usuarioNome: "Thayane Carvalho", timestamp: "2026-05-24T10:15:00Z" },
        { id: "p_acc_2", vaultId: "pwd_2", titulo: "Sefaz SP - Posto Fiscal Eletrônico", usuarioNome: "Carlos Souza", timestamp: "2026-05-24T12:30:11Z" }
      ],
      fiscalDeadlines: [
        { id: "dl_1", titulo: "DAS", descricao: "Simples Nacional - Competência Abril/2026", prazo: "2026-05-20", status: "Pago", clienteId: "cli_1", clienteNome: "Padaria Central da Alvorada Ltda", valor: 450.25 },
        { id: "dl_2", titulo: "DARF", descricao: "IRPF quota única / primeira quota Carlos Silva", prazo: "2026-05-31", status: "Guia Emitida", clienteId: "cli_3", clienteNome: "Roberto de Oliveira (Iniciais IRPF)", valor: 1250.00 },
        { id: "dl_3", titulo: "DAS", descricao: "Simei - Competência Abril/2026", prazo: "2026-05-20", status: "Pago", clienteId: "cli_4", clienteNome: "Auto Peças Aliança Eireli", valor: 75.60 },
        { id: "dl_4", titulo: "EFD Reinf", descricao: "Escriturações de Retenções Federais Competência", prazo: "2026-06-15", status: "Pendência", clienteId: "cli_2", clienteNome: "Consultoria Silva ME", valor: 0.00 },
        { id: "dl_5", titulo: "DAS", descricao: "Simples Nacional - Competência Maio/2026", prazo: "2026-06-20", status: "Pendência", clienteId: "cli_1", clienteNome: "Padaria Central da Alvorada Ltda", valor: 512.40 }
      ],
      tasks: [
        {
          id: "tsk_1",
          titulo: "Validar Guia DAS Padaria Central",
          prioridade: "Alta",
          responsavel: "Carlos Souza",
          status: "Concluida",
          checklist: [
            { id: "tc1", item: "Coletar faturamento de vendas no painel", concluido: true },
            { id: "tc2", item: "Gerar extrato preliminar no Simples", concluido: true },
            { id: "tc3", item: "Emitir DAS com vencimento em 20/05", concluido: true }
          ],
          comentarios: [
            { id: "c_1", autor: "Thayane Carvalho", data: "2026-05-18", texto: "Favor dar celeridade devido ao feriado bancário regional." }
          ],
          prazo: "2026-05-20"
        },
        {
          id: "tsk_2",
          titulo: "Elaborar Balancete Financeiro Consultoria Silva",
          prioridade: "Media",
          responsavel: "Carlos Souza",
          status: "Em Progresso",
          checklist: [
            { id: "tc4", item: "Lançar extratos de todas as contas PJ", concluido: true },
            { id: "tc5", item: "Planilhar provisões trabalhistas", concluido: false },
            { id: "tc6", item: "Emitir arquivo final assinado em PDF", concluido: false }
          ],
          comentarios: [],
          prazo: "2026-05-30"
        },
        {
          id: "tsk_3",
          titulo: "Verificar irregularidade cadastral Sefaz",
          prioridade: "Alta",
          responsavel: "Thayane Carvalho",
          status: "Pendente",
          checklist: [
            { id: "tc7", item: "Acessar DEC estadual com certificado digital", concluido: false },
            { id: "tc8", item: "Sinalizar pendência societária ao cliente", concluido: false }
          ],
          comentarios: [],
          prazo: "2026-05-27"
        }
      ],
      documents: [
        {
          id: "doc_1",
          nome: "Contrato_Social_Padaria_Central_Assinado.pdf",
          tipo: "PDF",
          clienteId: "cli_1",
          clienteNome: "Padaria Central da Alvorada Ltda",
          tamanho: "1.2 MB",
          dataCriacao: "2026-05-10",
          contentBase64: "JVBERi0xLjQKJVRleHQgbW9jayBkbyBjb250cmF0byBzb2NpYWwgZGEgcGFkYXJpYSBjZW50cmFsLg=="
        },
        {
          id: "doc_2",
          nome: "Recibo_IRPF_Roberto_Oliveira_2026.pdf",
          tipo: "PDF",
          clienteId: "cli_3",
          clienteNome: "Roberto de Oliveira (Iniciais IRPF)",
          tamanho: "320 KB",
          dataCriacao: "2026-05-18",
          contentBase64: "JVBERi0xLjQKJVJlY2libyBkYSBkZWNsYXJhY2FvIGRvIGltcG9zdG8gZGUgcmVuZGEgMjAyNi4="
        }
      ],
      logs: [
        { id: "log_1", usuarioNome: "Thayane Carvalho", acao: "Sessão iniciada", detalhes: "Login no painel administrativo realizado com sucesso por ctbthay@gmail.com", timestamp: "2026-05-24T10:00:00Z" },
        { id: "log_2", usuarioNome: "Carlos Souza", acao: "Criação de Serviço", detalhes: "Novo serviço BPO iniciado para Padaria Central da Alvorada Ltda", timestamp: "2026-05-24T10:30:00Z" },
        { id: "log_3", usuarioNome: "Beatriz Lima", acao: "Exibição de Senha", detalhes: "Senha de Portal Simples Nacional Padaria Central visualizada", timestamp: "2026-05-24T12:45:00Z" }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDatabase(db: AppDatabase) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

let db = loadDatabase();

// Audit log helper
function addLog(usuarioNome: string, acao: string, detalhes: string) {
  const newLog: AuditLog = {
    id: "log_" + Date.now().toString(),
    usuarioNome,
    acao,
    detalhes,
    timestamp: new Date().toISOString()
  };
  db.logs.unshift(newLog);
  // Keep logs list sane
  if (db.logs.length > 300) {
    db.logs = db.logs.slice(0, 300);
  }
  saveDatabase(db);
}

// REST Middlewares
// Simulated simple cookie/session check or auth token simulation for API safety
let activeSessionUser: User | null = db.users[0]; // defaults to Thayane for ease of preview

app.use((req, res, next) => {
  // Simple simulator header
  const userHeader = req.headers["x-user-id"] || "1";
  const user = db.users.find(u => u.id === userHeader) || db.users[0];
  activeSessionUser = user;
  next();
});

// ==========================================
// 1. AUTHENTICATION MODULE API
// ==========================================
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (user && user.status === "ativo") {
    activeSessionUser = user;
    addLog(user.name, "Sessão iniciada", `Login do usuário realizado por IP local.`);
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: "E-mail incorreto ou usuário inativo. Dica: Use ctbthay@gmail.com" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  if (activeSessionUser) {
    addLog(activeSessionUser.name, "Sessão encerrada", "Logout solicitado pelo painel.");
  }
  activeSessionUser = db.users[0]; // Reset to main user
  res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: activeSessionUser });
});

app.post("/api/auth/recover", (req, res) => {
  const { email } = req.body;
  const user = db.users.find(u => u.email === email);
  if (user) {
    addLog(user.name, "Recuperação de Senha", `Solicitado link de redefinição para ${email}`);
    res.json({ success: true, message: `Um link de redefinição foi enviado para ${email}.` });
  } else {
    res.status(404).json({ success: false, message: "Este e-mail não está cadastrado no sistema." });
  }
});

// ==========================================
// 2. DASHBOARD / AUDIT LOG API
// ==========================================
app.get("/api/dashboard/stats", (req, res) => {
  // Calculate key indices
  const activeClientsCount = db.clients.filter(c => c.status === "ativo").length;
  const inProgressServicesCount = db.services.filter(s => s.status === "Em Andamento").length;
  
  // Financial numbers for May 2026 (or custom month)
  const totalReceitas = db.financial
    .filter(f => f.tipo === "Receita" && f.status === "Pago")
    .reduce((sum, f) => sum + f.valor, 0);
  const totalDespesas = db.financial
    .filter(f => f.tipo === "Despesa" && f.status === "Pago")
    .reduce((sum, f) => sum + f.valor, 0);
  const totalAReceber = db.financial
    .filter(f => f.tipo === "Receita" && f.status === "Pendente")
    .reduce((sum, f) => sum + f.valor, 0);
  const totalInadimplente = db.financial
    .filter(f => f.tipo === "Receita" && f.status === "Atrasado")
    .reduce((sum, f) => sum + f.valor, 0);

  // Near fiscal deadlines
  const nearDeadlines = db.fiscalDeadlines
    .filter(d => d.status !== "Pago" && d.status !== "Guia Emitida")
    .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
    .slice(0, 5);

  res.json({
    activeClientsCount,
    inProgressServicesCount,
    receitaMensal: totalReceitas,
    despesaMensal: totalDespesas,
    aReceber: totalAReceber,
    inadimplente: totalInadimplente,
    nearDeadlines,
    recentLogs: db.logs.slice(0, 10)
  });
});

app.get("/api/audit-logs", (req, res) => {
  res.json(db.logs);
});

app.post("/api/audit-logs", (req, res) => {
  const { acao, detalhes, usuarioNome } = req.body;
  const user = usuarioNome || activeSessionUser?.name || "Thayane Carvalho";
  addLog(user, acao || "Ação Manual", detalhes || "Anotação de log manual.");
  res.status(201).json({ status: "ok", logs: db.logs });
});

// ==========================================
// 3. CLIENTS CRUD
// ==========================================
app.get("/api/clients", (req, res) => {
  res.json(db.clients);
});

app.post("/api/clients", (req, res) => {
  const newClient: Client = {
    ...req.body,
    id: "cli_" + Date.now().toString(),
    historico: [{
      id: "h_" + Date.now().toString(),
      data: new Date().toISOString().split("T")[0],
      descricao: "Cadastro do cliente efetuado no sistema.",
      responsavel: activeSessionUser?.name || "Thayane Carvalho"
    }]
  };
  db.clients.unshift(newClient);
  saveDatabase(db);
  addLog(activeSessionUser?.name || "Sistema", "Criação de Cliente", `Cliente ${newClient.name} cadastrado com sucesso.`);
  res.status(201).json(newClient);
});

app.put("/api/clients/:id", (req, res) => {
  const { id } = req.params;
  const index = db.clients.findIndex(c => c.id === id);
  if (index !== -1) {
    const original = db.clients[index];
    db.clients[index] = { 
      ...original,
      ...req.body, 
      id // retain ID
    };
    saveDatabase(db);
    addLog(activeSessionUser?.name || "Sistema", "Atualização de Cliente", `Cliente ${db.clients[index].name} alterado.`);
    res.json(db.clients[index]);
  } else {
    res.status(404).json({ error: "Cliente não localizado" });
  }
});

app.post("/api/clients/:id/history", (req, res) => {
  const { id } = req.params;
  const { descricao } = req.body;
  const client = db.clients.find(c => c.id === id);
  if (client) {
    const historicalEvent = {
      id: "h_" + Date.now().toString(),
      data: new Date().toISOString().split("T")[0],
      descricao,
      responsavel: activeSessionUser?.name || "Thayane Carvalho"
    };
    client.historico.unshift(historicalEvent);
    saveDatabase(db);
    addLog(activeSessionUser?.name || "Sistema", "Atualização Histórico Cliente", `Novo histórico adicionado para ${client.name}`);
    res.json(client);
  } else {
    res.status(404).json({ error: "Cliente não localizado" });
  }
});

app.delete("/api/clients/:id", (req, res) => {
  const { id } = req.params;
  const client = db.clients.find(c => c.id === id);
  if (client) {
    db.clients = db.clients.filter(c => c.id !== id);
    saveDatabase(db);
    addLog(activeSessionUser?.name || "Sistema", "Arquivamento/Remoção de Cliente", `Cliente ${client.name} foi arquivado ou removido.`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Cliente não localizado" });
  }
});

// ==========================================
// 4. SERVICES CRUD
// ==========================================
app.get("/api/services", (req, res) => {
  res.json(db.services);
});

app.post("/api/services", (req, res) => {
  const clientObj = db.clients.find(c => c.id === req.body.clienteId);
  const clientNome = clientObj ? clientObj.name : "Cliente Desconhecido";
  
  const newService: Service = {
    ...req.body,
    clientNome: undefined, // remove double binding if passed
    clienteNome: clientNome,
    id: "srv_" + Date.now().toString(),
    checklist: req.body.checklist || []
  };

  db.services.push(newService);
  saveDatabase(db);
  addLog(activeSessionUser?.name || "Sistema", "Criação de Serviço", `Serviço ${newService.tipo} adicionado para ${clientNome}.`);
  res.status(201).json(newService);
});

app.put("/api/services/:id", (req, res) => {
  const { id } = req.params;
  const index = db.services.findIndex(s => s.id === id);
  if (index !== -1) {
    const original = db.services[index];
    const clientObj = db.clients.find(c => c.id === req.body.clienteId) || { name: original.clienteNome };
    
    db.services[index] = {
      ...original,
      ...req.body,
      clienteNome: clientObj.name,
      id
    };
    saveDatabase(db);
    addLog(activeSessionUser?.name || "Sistema", "Atualização de Serviço", `Serviço ${db.services[index].tipo} atualizado.`);
    res.json(db.services[index]);
  } else {
    res.status(404).json({ error: "Serviço não catalogado" });
  }
});

app.delete("/api/services/:id", (req, res) => {
  db.services = db.services.filter(s => s.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// ==========================================
// 5. AGENDA (SCHEDULES)
// ==========================================
app.get("/api/schedules", (req, res) => {
  res.json(db.schedules);
});

app.post("/api/schedules", (req, res) => {
  const clientObj = db.clients.find(c => c.id === req.body.clienteId);
  const cleanCategory = req.body.categoria || "Outro";
  const newEvent: ScheduleEvent = {
    ...req.body,
    id: "sch_" + Date.now().toString(),
    clienteNome: clientObj ? clientObj.name : undefined,
    categoria: cleanCategory
  };
  db.schedules.push(newEvent);
  saveDatabase(db);
  addLog(activeSessionUser?.name || "Sistema", "Agenda Evento", `Reunião ou compromisso "${newEvent.titulo}" agendado.`);
  res.status(201).json(newEvent);
});

app.put("/api/schedules/:id", (req, res) => {
  const { id } = req.params;
  const index = db.schedules.findIndex(s => s.id === id);
  if (index !== -1) {
    db.schedules[index] = {
      ...db.schedules[index],
      ...req.body,
      id
    };
    saveDatabase(db);
    res.json(db.schedules[index]);
  } else {
    res.status(404).json({ error: "Compromisso não localizado" });
  }
});

app.delete("/api/schedules/:id", (req, res) => {
  db.schedules = db.schedules.filter(s => s.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// ==========================================
// 6. FINANCEIRO (FINANCIAL)
// ==========================================
app.get("/api/financial", (req, res) => {
  res.json(db.financial);
});

app.post("/api/financial", (req, res) => {
  const clientObj = db.clients.find(c => c.id === req.body.clienteId);
  const newEntry: FinancialEntry = {
    ...req.body,
    id: "fin_" + Date.now().toString(),
    clienteNome: clientObj ? clientObj.name : undefined
  };
  db.financial.push(newEntry);
  saveDatabase(db);
  addLog(activeSessionUser?.name || "Sistema", "Movimento Financeiro", `Registro ${newEntry.tipo} lançado no valor de R$ ${newEntry.valor}.`);
  res.status(201).json(newEntry);
});

app.put("/api/financial/:id", (req, res) => {
  const { id } = req.params;
  const index = db.financial.findIndex(f => f.id === id);
  if (index !== -1) {
    db.financial[index] = {
      ...db.financial[index],
      ...req.body,
      id
    };
    saveDatabase(db);
    res.json(db.financial[index]);
  } else {
    res.status(404).json({ error: "Lançamento não localizado" });
  }
});

app.delete("/api/financial/:id", (req, res) => {
  db.financial = db.financial.filter(f => f.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// ==========================================
// 7. COFRE DE SENHAS (PASSWORDS VAULT)
// ==========================================
app.get("/api/passwords", (req, res) => {
  res.json(db.passwords);
});

app.get("/api/passwords/:id/decrypt", (req, res) => {
  // Simulating secure log and access control
  const item = db.passwords.find(p => p.id === req.params.id);
  if (item) {
    // Generate an access log record
    const newLog: PasswordAccessLog = {
      id: "p_acc_" + Date.now().toString(),
      vaultId: item.id,
      titulo: item.titulo,
      usuarioNome: activeSessionUser?.name || "Thayane Carvalho",
      timestamp: new Date().toISOString()
    };
    db.passwordAccessLogs.unshift(newLog);
    saveDatabase(db);
    addLog(activeSessionUser?.name || "Thayane Carvalho", "Exibição de Senha", `Acessada credencial de "${item.titulo}"`);
    res.json({ decrypted: item.senhaObfuscated });
  } else {
    res.status(404).json({ error: "Senha não localizada" });
  }
});

app.get("/api/passwords-access-logs", (req, res) => {
  res.json(db.passwordAccessLogs);
});

app.post("/api/passwords", (req, res) => {
  const clientObj = db.clients.find(c => c.id === req.body.clienteId);
  const entry: PasswordVault = {
    ...req.body,
    id: "pwd_" + Date.now().toString(),
    clienteNome: clientObj ? clientObj.name : undefined,
    ultimaAlteracao: new Date().toISOString().split("T")[0]
  };
  db.passwords.push(entry);
  saveDatabase(db);
  addLog(activeSessionUser?.name || "Sistema", "Criação de Senha", `Cadastrado nova senha de acesso para ${entry.titulo}.`);
  res.status(201).json(entry);
});

app.put("/api/passwords/:id", (req, res) => {
  const { id } = req.params;
  const index = db.passwords.findIndex(p => p.id === id);
  if (index !== -1) {
    db.passwords[index] = {
      ...db.passwords[index],
      ...req.body,
      ultimaAlteracao: new Date().toISOString().split("T")[0],
      id
    };
    saveDatabase(db);
    addLog(activeSessionUser?.name || "Sistema", "Modificação de Senha", `Credencial de ${db.passwords[index].titulo} alterada.`);
    res.json(db.passwords[index]);
  } else {
    res.status(404).json({ error: "Credencial não localizada" });
  }
});

app.delete("/api/passwords/:id", (req, res) => {
  db.passwords = db.passwords.filter(p => p.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// ==========================================
// 8. PRAZOS FISCAIS
// ==========================================
app.get("/api/fiscal-deadlines", (req, res) => {
  res.json(db.fiscalDeadlines);
});

app.post("/api/fiscal-deadlines", (req, res) => {
  const clientObj = db.clients.find(c => c.id === req.body.clienteId);
  const entry: FiscalDeadline = {
    ...req.body,
    id: "dl_" + Date.now().toString(),
    clienteNome: clientObj ? clientObj.name : "Cliente Geral"
  };
  db.fiscalDeadlines.push(entry);
  saveDatabase(db);
  addLog(activeSessionUser?.name || "Sistema", "Guia Fiscal Programada", `Novo prazo fiscal cadastrado: ${entry.titulo} da empresa ${entry.clienteNome}.`);
  res.status(201).json(entry);
});

app.put("/api/fiscal-deadlines/:id", (req, res) => {
  const { id } = req.params;
  const index = db.fiscalDeadlines.findIndex(d => d.id === id);
  if (index !== -1) {
    db.fiscalDeadlines[index] = {
      ...db.fiscalDeadlines[index],
      ...req.body,
      id
    };
    saveDatabase(db);
    addLog(activeSessionUser?.name || "Sistema", "Modificação Prazo Fiscal", `Status da guia ${db.fiscalDeadlines[index].titulo} alterada para ${db.fiscalDeadlines[index].status}.`);
    res.json(db.fiscalDeadlines[index]);
  } else {
    res.status(404).json({ error: "Registro fiscal não localizado" });
  }
});

app.delete("/api/fiscal-deadlines/:id", (req, res) => {
  db.fiscalDeadlines = db.fiscalDeadlines.filter(d => d.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// ==========================================
// 9. TAREFAS (TASKS)
// ==========================================
app.get("/api/tasks", (req, res) => {
  res.json(db.tasks);
});

app.post("/api/tasks", (req, res) => {
  const entry: Task = {
    id: "tsk_" + Date.now().toString(),
    titulo: req.body.titulo || "Nova Tarefa",
    prioridade: req.body.prioridade || "Media",
    responsavel: req.body.responsavel || activeSessionUser?.name || "Thayane Carvalho",
    status: req.body.status || "Pendente",
    checklist: req.body.checklist || [],
    comentarios: [],
    prazo: req.body.prazo || new Date().toISOString().split("T")[0]
  };
  db.tasks.push(entry);
  saveDatabase(db);
  addLog(activeSessionUser?.name || "Sistema", "Nova Tarefa Contábil", `Tarefa Interna "${entry.titulo}" atribuída para ${entry.responsavel}.`);
  res.status(201).json(entry);
});

app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const index = db.tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    db.tasks[index] = {
      ...db.tasks[index],
      ...req.body,
      id
    };
    saveDatabase(db);
    res.json(db.tasks[index]);
  } else {
    res.status(404).json({ error: "Tarefa não localizada" });
  }
});

app.post("/api/tasks/:id/comment", (req, res) => {
  const { id } = req.params;
  const task = db.tasks.find(t => t.id === id);
  if (task) {
    task.comentarios.push({
      id: "tc_" + Date.now().toString(),
      autor: activeSessionUser?.name || "Thayane Carvalho",
      data: new Date().toISOString().split("T")[0],
      texto: req.body.texto
    });
    saveDatabase(db);
    res.json(task);
  } else {
    res.status(404).json({ error: "Tarefa não encontrada" });
  }
});

app.delete("/api/tasks/:id", (req, res) => {
  db.tasks = db.tasks.filter(t => t.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// ==========================================
// 10. DOCUMENTOS (UPLOAD & STORAGE)
// ==========================================
app.get("/api/documents", (req, res) => {
  res.json(db.documents);
});

app.post("/api/documents", (req, res) => {
  const clientObj = db.clients.find(c => c.id === req.body.clienteId);
  const clientNome = clientObj ? clientObj.name : "Cliente Geral";
  const newDoc: DocumentInfo = {
    id: "doc_" + Date.now().toString(),
    nome: req.body.nome || "Documento Uploaded.pdf",
    tipo: req.body.tipo || "PDF",
    clienteId: req.body.clienteId,
    clienteNome: clientNome,
    tamanho: req.body.tamanho || "450 KB",
    dataCriacao: new Date().toISOString().split("T")[0],
    contentBase64: req.body.contentBase64 || "JVBERi0xLjQKJVNpbXVsYXRlZCBQREYgZmlsZS4="
  };
  db.documents.push(newDoc);
  saveDatabase(db);
  addLog(activeSessionUser?.name || "Sistema", "Upload de Documento", `Documento "${newDoc.nome}" anexado à ficha do cliente ${clientNome}.`);
  res.status(201).json(newDoc);
});

app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  db.documents = db.documents.filter(d => d.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// ==========================================
// 11. USUÁRIOS (LISTING & REGISTRATION)
// ==========================================
app.get("/api/users", (req, res) => {
  res.json(db.users);
});

app.post("/api/users", (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Nome e e-mail são obrigatórios para o cadastro." });
  }
  // Check if email already registered
  const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado." });
  }

  const newUser = {
    id: "user_" + Date.now().toString(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role || "colaborador",
    status: "ativo" as const
  };
  db.users.push(newUser);
  saveDatabase(db);
  addLog(activeSessionUser?.name || "Sistema", "Cadastro de Usuário", `Novo usuário ${name} (${email}) adicionado com sucesso.`);
  res.status(201).json(newUser);
});


// Vite middleware integration for live browser preview
async function bootstrap() {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    // Production or static preview serve mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Dynamic SPA routing
    app.get("*", (req, res, next) => {
      // Exclude API routes from falling back to index.html
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Development mode using Vite as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Port 3000 custom express server loaded. UI connected.`);
  });
}

bootstrap().catch(err => {
  console.error("Erro ao inicializar o servidor express:", err);
});
