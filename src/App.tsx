import React, { useState, useEffect } from "react";
import { 
  Users, Briefcase, Calendar, DollarSign, KeyRound, Clock, 
  MessageSquare, History, FileText, TrendingUp, ShieldCheck, 
  Settings, LogOut, Moon, Sun, ShieldAlert, Sparkles, Building2
} from "lucide-react";
import { 
  Client, Service, FinancialEntry, ScheduleEvent, 
  PasswordVault, FiscalDeadline, Task, DocumentInfo, User 
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentModule, setCurrentModule] = useState<string>("dashboard");
  const [darkTheme, setDarkTheme] = useState(true);

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
        tasksList, docsList, statsData, usersList
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
        api.users.list()
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
          <div className="text-left bg-white/[0.02]/40 p-3 rounded-lg border border-white/5">
            <span className="text-[9px] text-zinc-500 font-mono block uppercase font-semibold">Usuário logado</span>
            <span className="font-bold text-zinc-200 text-xs block leading-tight mt-0.5">{currentUser.name}</span>
            <span className="text-[9px] font-semibold text-blue-400 capitalize bg-blue-500/10 px-1.5 py-0.5 rounded font-mono mt-1 inline-block border border-blue-500/15">
              {currentUser.role}
            </span>
          </div>

          <div className="flex gap-2">
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
        
        {/* Upper Top Navbar */}
        <header className="bg-[#09090b] border-b border-white/5 shrink-0 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-500">Módulo Ativo</span>
            <span className="text-sm text-zinc-700">/</span>
            <span className="text-xs bg-blue-500/10 text-blue-400 font-bold uppercase tracking-tight py-1 px-3 rounded-md font-mono border border-blue-500/20">
              {currentModule}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {loadingData && (
              <span className="flex items-center gap-1.5 text-blue-400 font-mono text-[10px] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Sincronizando...
              </span>
            )}
            <span className="text-zinc-500 font-mono text-xs">{new Date().toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        {/* View Content Frame */}
        <div className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderCurrentModuleView()}
        </div>
      </main>
    </div>
  );
}
