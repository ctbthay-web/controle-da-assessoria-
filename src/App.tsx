import React, { useState, useEffect } from "react";
import { 
  Users, Briefcase, Calendar, DollarSign, KeyRound, Clock, 
  MessageSquare, History, FileText, TrendingUp, ShieldCheck, 
  Settings, LogOut, Moon, Sun, ShieldAlert, Sparkles, Building2,
  Database, UserCog, X
} from "lucide-react";
import { 
  Client, Service, FinancialEntry, ScheduleEvent, 
  PasswordVault, FiscalDeadline, Task, DocumentInfo, User, AuditLog 
} from "./types";
import { api } from "./utils/api";

// Core views
import { AuthView } from "./components/AuthView";
import { DashboardView } from "./components/DashboardView";
import { ClientsView } from "./components/ClientsView";
import { ServicesView } from "./components/ServicesView";
import { FinancialView } from "./components/FinancialView";
import { SchedulesView } from "./components/SchedulesView";
import { PasswordsView } from "./components/PasswordsView";
import { DeadlinesView } from "./components/DeadlinesView";
import { TasksView } from "./components/TasksView";
import { DocumentsView } from "./components/DocumentsView";
import { ReportsView } from "./components/ReportsView";
import { LogsView } from "./components/LogsView";
import { SupabaseSyncModal } from "./components/SupabaseSyncModal";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentModule, setCurrentModule] = useState<string>("dashboard");
  const [darkTheme, setDarkTheme] = useState(true);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Big synchronized state of the whole App
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [financial, setFinancial] = useState<FinancialEntry[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [passwords, setPasswords] = useState<PasswordVault[]>([]);
  const [deadlines, setDeadlines] = useState<FiscalDeadline[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // User Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Statistics for dashboard
  const [dashboardStats, setDashboardStats] = useState<any>({
    activeClientsCount: 0,
    inProgressServicesCount: 0,
    receitaMensal: 0,
    despesaMensal: 0,
    aReceber: 0,
    inadimplente: 0,
    nearDeadlines: [],
    recentLogs: []
  });

  const [loadingData, setLoadingData] = useState(false);

  // Authenticate on mount or local storage check
  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    setLoadingUser(true);
    try {
      const { user } = await api.auth.me();
      if (user) {
        setCurrentUser(user);
        loadAllApplicationData();
      }
    } catch {
      // safe fallback
    } finally {
      setLoadingUser(false);
    }
  };

  const loadAllApplicationData = async () => {
    setLoadingData(true);
    try {
      // Parallelize fetches to keep loading ultra-fast!
      const [
        clientsList, servicesList, financialList, 
        schedulesList, passwordsList, deadlinesList, 
        tasksList, docsList, statsData, usersList, logsList
      ] = await Promise.all([
        api.clients.list(),
        api.services.list(),
        api.financial.list(),
        api.schedules.list(),
        api.passwords.list(),
        api.fiscalDeadlines.list(),
        api.tasks.list(),
        api.documents.list(),
        api.dashboard.getStats(),
        api.users.list(),
        api.auditLogs.list()
      ]);

      setClients(clientsList);
      setServices(servicesList);
      setFinancial(financialList);
      setSchedules(schedulesList);
      setPasswords(passwordsList);
      setDeadlines(deadlinesList);
      setTasks(tasksList);
      setDocuments(docsList);
      setDashboardStats(statsData);
      setUsers(usersList);
      setAuditLogs(logsList);
    } catch (err) {
      console.error("Erro ao sincronizar tabelas operacionais:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadAllApplicationData();
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // safe reset
    }
    setCurrentUser(null);
  };

  const handleOpenProfile = () => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfilePassword(currentUser.password || "");
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !currentUser) return;
    setSavingProfile(true);
    try {
      const updated = await api.users.update(currentUser.id, {
        name: profileName.trim(),
        email: profileEmail.trim(),
        password: profilePassword.trim()
      });
      setCurrentUser(updated);
      setIsProfileModalOpen(false);
      loadAllApplicationData();
    } catch {
      alert("Erro ao atualizar os dados do perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Helper trigger action which modifies DB and triggers complete silent synch!
  const executeAndSync = async (func: () => Promise<any>) => {
    try {
      await func();
      await loadAllApplicationData(); // Silent update
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Render view selector
  const renderCurrentModuleView = () => {
    switch (currentModule) {
      case "dashboard":
        return (
          <DashboardView 
            stats={dashboardStats} 
            loading={loadingData}
            onNavigateToModule={(mod) => setCurrentModule(mod)}
            onCreateLog={(acao, detalhes, usuarioNome) => executeAndSync(() => api.dashboard.createLog(acao, detalhes, usuarioNome))}
            users={users}
            onCreateUser={(newUser) => executeAndSync(() => api.users.create(newUser))}
            onUpdateUser={(id, updatedUser) => executeAndSync(() => api.users.update(id, updatedUser))}
            onDeleteUser={(id) => executeAndSync(() => api.users.delete(id))}
          />
        );
      case "clientes":
        return (
          <ClientsView
            clients={clients}
            onCreateClient={(c) => executeAndSync(() => api.clients.create(c))}
            onUpdateClient={(id, c) => executeAndSync(() => api.clients.update(id, c))}
            onAddHistory={(id, desc) => executeAndSync(() => api.clients.addHistory(id, desc))}
            onDeleteClient={(id) => executeAndSync(() => api.clients.delete(id))}
          />
        );
      case "serviços":
        return (
          <ServicesView
            services={services}
            clients={clients}
            onCreateService={(s) => executeAndSync(() => api.services.create(s))}
            onUpdateService={(id, s) => executeAndSync(() => api.services.update(id, s))}
            onDeleteService={(id) => executeAndSync(() => api.services.delete(id))}
            users={users}
          />
        );
      case "financeiro":
        return (
          <FinancialView
            entries={financial}
            clients={clients}
            onCreateEntry={(f) => executeAndSync(() => api.financial.create(f))}
            onDeleteEntry={(id) => executeAndSync(() => api.financial.delete(id))}
          />
        );
      case "agenda":
        return (
          <SchedulesView
            events={schedules}
            clients={clients}
            onCreateEvent={(ev) => executeAndSync(() => api.schedules.create(ev))}
            onDeleteEvent={(id) => executeAndSync(() => api.schedules.delete(id))}
          />
        );
      case "senhas cofre":
        return (
          <PasswordsView
            passwords={passwords}
            clients={clients}
            onCreatePassword={(p) => executeAndSync(() => api.passwords.create(p))}
            onDeletePassword={(id) => executeAndSync(() => api.passwords.delete(id))}
          />
        );
      case "prazos fiscais":
        return (
          <DeadlinesView
            deadlines={deadlines}
            clients={clients}
            onCreateDeadline={(dl) => executeAndSync(() => api.fiscalDeadlines.create(dl))}
            onUpdateDeadline={(id, dl) => executeAndSync(() => api.fiscalDeadlines.update(id, dl))}
            onDeleteDeadline={(id) => executeAndSync(() => api.fiscalDeadlines.delete(id))}
          />
        );
      case "tarefas":
        return (
          <TasksView
            tasks={tasks}
            onCreateTask={(t) => executeAndSync(() => api.tasks.create(t))}
            onUpdateTask={(id, t) => executeAndSync(() => api.tasks.update(id, t))}
            onAddComment={(id, text) => executeAndSync(() => api.tasks.addComment(id, text))}
            onDeleteTask={(id) => executeAndSync(() => api.tasks.delete(id))}
            users={users}
          />
        );
      case "documentos ged":
        return (
          <DocumentsView
            documents={documents}
            clients={clients}
            onUploadDocument={(doc) => executeAndSync(() => api.documents.upload(doc))}
            onDeleteDocument={(id) => executeAndSync(() => api.documents.delete(id))}
          />
        );
      case "relatórios":
        return (
          <ReportsView
            clients={clients}
            services={services}
            financial={financial}
            tasks={tasks}
            deadlines={deadlines}
            users={users}
            onCreateLog={(acao, detalhes, usuarioNome) => executeAndSync(() => api.dashboard.createLog(acao, detalhes, usuarioNome))}
          />
        );
      case "logs":
        return (
          <LogsView
            logs={auditLogs}
            users={users}
            onCreateLog={(acao, detalhes, usuarioNome) => executeAndSync(() => api.auditLogs.create(acao, detalhes, usuarioNome))}
            onDeleteLog={(id) => executeAndSync(() => api.auditLogs.delete(id))}
            onClearLogs={() => executeAndSync(() => api.auditLogs.clear())}
            onRefresh={() => loadAllApplicationData()}
          />
        );
      default:
        return <div className="p-6 text-xs text-slate-400">Em desenvolvimento.</div>;
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold font-mono uppercase tracking-widest">Iniciando Banco de Dados Seguro...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Sidebar Layout with fixed panel Notion Style
  return (
    <div className="min-h-screen flex bg-[#09090b] text-[#cbd5e1] font-sans antialiased text-sm">
      
      {/* 1. FIXED SIDEBAR SECTION */}
      <aside className="w-64 bg-[#0c0c0e] shrink-0 text-zinc-400 flex flex-col justify-between border-r border-white/5 h-screen sticky top-0">
        <div>
          {/* Brand header panel */}
          <div className="px-6 py-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/10">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-xs font-semibold text-white tracking-wider leading-none uppercase">Assessoria & Gestão</h2>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block tracking-wider font-semibold">ERP Contábil</span>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="p-4 space-y-1 text-xs">
            
            {[
              { id: "dashboard", label: "Painel Geral", icon: TrendingUp },
              { id: "clientes", label: "Clientes (CRM)", icon: Users },
              { id: "serviços", label: "Serviços e Checklist", icon: Briefcase },
              { id: "financeiro", label: "Honorários e Caixa", icon: DollarSign },
              { id: "agenda", label: "Calendário / Agenda", icon: Calendar },
              { id: "prazos fiscais", label: "Agenda e Apuração Fiscal", icon: Clock },
              { id: "senhas cofre", label: "Cofre de Senhas", icon: KeyRound },
              { id: "tarefas", label: "Tarefas Internas", icon: MessageSquare },
              { id: "documentos ged", label: "GED de Documentos", icon: FileText },
              { id: "relatórios", label: "Relatórios & Perf", icon: Settings },
              { id: "logs", label: "Logs do Sistema", icon: History },
            ].map((menu) => {
              const Icon = menu.icon;
              const isActive = currentModule === menu.id;

              return (
                <button
                  key={menu.id}
                  onClick={() => setCurrentModule(menu.id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-medium transition-all cursor-pointer text-left ${
                    isActive 
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm shadow-blue-500/5 font-semibold" 
                      : "hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{menu.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Operational User Info & Logout drawer foot */}
        <div className="p-4 border-t border-white/5 space-y-3 shrink-0">
          <div className="text-left bg-white/[0.02]/40 p-3 rounded-lg border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-zinc-500 font-mono block uppercase font-semibold">Usuário logado</span>
              <span className="font-bold text-zinc-200 text-xs block leading-tight mt-0.5">{currentUser.name}</span>
              <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono mt-1 inline-block border border-blue-500/15">
                {currentUser.role === "admin" ? "Gestor" : "Colaborador"}
              </span>
            </div>
            <button
              onClick={handleOpenProfile}
              className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Editar meu nome e perfil"
            >
              <UserCog className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleOpenProfile}
              className="w-full bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/20 text-blue-300 hover:text-blue-200 rounded-lg py-2 px-3 flex items-center justify-center cursor-pointer transition-colors gap-2 font-medium text-xs shadow-sm"
              title="Alterar seu nome de usuário"
            >
              <UserCog className="w-3.5 h-3.5 text-blue-400" />
              Editar Nome / Usuário
            </button>

            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="w-full bg-emerald-950/20 hover:bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg py-2 px-3 flex items-center justify-center cursor-pointer transition-colors gap-2 font-medium text-xs shadow-sm"
              title="Configurar e Sincronizar Supabase"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Sincronizar Supabase
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-rose-950/20 hover:bg-rose-950/30 border border-rose-500/10 text-rose-400 hover:text-rose-300 rounded-lg py-2 px-3 flex items-center justify-center cursor-pointer transition-colors gap-2 font-medium text-xs"
              title="Desconectar do painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN SCROLL CONTAINER SECTION */}
      <main className="flex-1 flex flex-col min-h-screen">
        
        {/* View Content Frame */}
        <div className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderCurrentModuleView()}
        </div>

        {/* Footer Navbar at bottom */}
        <footer className="bg-[#09090b] border-t border-white/5 shrink-0 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-500">Módulo Ativo</span>
            <span className="text-sm text-zinc-700">/</span>
            <span className="text-xs bg-blue-500/10 text-blue-400 font-bold uppercase tracking-tight py-1 px-3 rounded-md font-mono border border-blue-500/20">
              {currentModule}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              Supabase status
            </button>
            {loadingData && (
              <span className="flex items-center gap-1.5 text-blue-400 font-mono text-[10px] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Sincronizando...
              </span>
            )}
            <span className="text-zinc-500 font-mono text-xs">{new Date().toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </footer>
      </main>

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#111113] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Alterar Meu Nome / Usuário</h3>
                <p className="text-[11px] text-zinc-400 font-mono">Atualize como seu nome aparece no sistema</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                  Seu Nome Completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Ex: Seu Nome Real / Nome do Escritório"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                  Endereço de E-mail
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                  Senha de Acesso
                </label>
                <input
                  type="text"
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="Nova senha (opcional)"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  disabled={savingProfile}
                  className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 border border-white/5 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/15"
                >
                  {savingProfile && (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                  )}
                  {savingProfile ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Sync Modal */}
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onSyncComplete={loadAllApplicationData}
      />
    </div>
  );
}
