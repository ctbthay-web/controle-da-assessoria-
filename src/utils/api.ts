import { Client, Service, FinancialEntry, ScheduleEvent, PasswordVault, FiscalDeadline, Task, DocumentInfo, AuditLog, User } from "../types";

const IS_DEV = !!(import.meta as any).env?.DEV;
const API_BASE = ""; // Relative paths to match our Express server proxy

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const currentUserId = localStorage.getItem("erp_user_id") || "1";
  const headers = {
    "Content-Type": "application/json",
    "x-user-id": currentUserId,
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Erro ${res.status}: Operação falhou.`);
    }
    return await res.json();
  } catch (error) {
    console.error("Erro na requisição:", error);
    throw error;
  }
}

// Low-level base services
export const api = {
  auth: {
    async login(email: string, password?: string): Promise<{ success: boolean; user: User }> {
      const data = await fetchWithAuth("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data?.user) {
        localStorage.setItem("erp_user_id", data.user.id);
      }
      return data;
    },
    async logout(): Promise<void> {
      await fetchWithAuth("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("erp_user_id");
    },
    async me(): Promise<{ user: User | null }> {
      return await fetchWithAuth("/api/auth/me");
    },
    async recover(email: string): Promise<{ success: boolean; message: string }> {
      return await fetchWithAuth("/api/auth/recover", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    }
  },

  dashboard: {
    async getStats(): Promise<{
      activeClientsCount: number;
      inProgressServicesCount: number;
      receitaMensal: number;
      despesaMensal: number;
      aReceber: number;
      inadimplente: number;
      nearDeadlines: FiscalDeadline[];
      recentLogs: AuditLog[];
    }> {
      return await fetchWithAuth("/api/dashboard/stats");
    },
    async createLog(acao: string, detalhes: string): Promise<any> {
      return await fetchWithAuth("/api/audit-logs", {
        method: "POST",
        body: JSON.stringify({ acao, detalhes })
      });
    }
  },

  clients: {
    async list(): Promise<Client[]> {
      return await fetchWithAuth("/api/clients");
    },
    async create(client: Omit<Client, "id" | "historico">): Promise<Client> {
      return await fetchWithAuth("/api/clients", {
        method: "POST",
        body: JSON.stringify(client),
      });
    },
    async update(id: string, client: Partial<Client>): Promise<Client> {
      return await fetchWithAuth(`/api/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(client),
      });
    },
    async addHistory(id: string, descricao: string): Promise<Client> {
      return await fetchWithAuth(`/api/clients/${id}/history`, {
        method: "POST",
        body: JSON.stringify({ descricao }),
      });
    },
    async delete(id: string): Promise<void> {
      await fetchWithAuth(`/api/clients/${id}`, { method: "DELETE" });
    }
  },

  services: {
    async list(): Promise<Service[]> {
      return await fetchWithAuth("/api/services");
    },
    async create(service: Omit<Service, "id">): Promise<Service> {
      return await fetchWithAuth("/api/services", {
        method: "POST",
        body: JSON.stringify(service),
      });
    },
    async update(id: string, service: Partial<Service>): Promise<Service> {
      return await fetchWithAuth(`/api/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(service),
      });
    },
    async delete(id: string): Promise<void> {
      await fetchWithAuth(`/api/services/${id}`, { method: "DELETE" });
    }
  },

  schedules: {
    async list(): Promise<ScheduleEvent[]> {
      return await fetchWithAuth("/api/schedules");
    },
    async create(event: Omit<ScheduleEvent, "id">): Promise<ScheduleEvent> {
      return await fetchWithAuth("/api/schedules", {
        method: "POST",
        body: JSON.stringify(event),
      });
    },
    async update(id: string, event: Partial<ScheduleEvent>): Promise<ScheduleEvent> {
      return await fetchWithAuth(`/api/schedules/${id}`, {
        method: "PUT",
        body: JSON.stringify(event),
      });
    },
    async delete(id: string): Promise<void> {
      await fetchWithAuth(`/api/schedules/${id}`, { method: "DELETE" });
    }
  },

  financial: {
    async list(): Promise<FinancialEntry[]> {
      return await fetchWithAuth("/api/financial");
    },
    async create(entry: Omit<FinancialEntry, "id">): Promise<FinancialEntry> {
      return await fetchWithAuth("/api/financial", {
        method: "POST",
        body: JSON.stringify(entry),
      });
    },
    async update(id: string, entry: Partial<FinancialEntry>): Promise<FinancialEntry> {
      return await fetchWithAuth(`/api/financial/${id}`, {
        method: "PUT",
        body: JSON.stringify(entry),
      });
    },
    async delete(id: string): Promise<void> {
      await fetchWithAuth(`/api/financial/${id}`, { method: "DELETE" });
    }
  },

  passwords: {
    async list(): Promise<PasswordVault[]> {
      return await fetchWithAuth("/api/passwords");
    },
    async decrypt(id: string): Promise<string> {
      const data = await fetchWithAuth(`/api/passwords/${id}/decrypt`);
      return data.decrypted;
    },
    async listLogs(): Promise<any[]> {
      return await fetchWithAuth("/api/passwords-access-logs");
    },
    async create(entry: Omit<PasswordVault, "id" | "ultimaAlteracao">): Promise<PasswordVault> {
      return await fetchWithAuth("/api/passwords", {
        method: "POST",
        body: JSON.stringify(entry),
      });
    },
    async update(id: string, entry: Partial<PasswordVault>): Promise<PasswordVault> {
      return await fetchWithAuth(`/api/passwords/${id}`, {
        method: "PUT",
        body: JSON.stringify(entry),
      });
    },
    async delete(id: string): Promise<void> {
      await fetchWithAuth(`/api/passwords/${id}`, { method: "DELETE" });
    }
  },

  fiscalDeadlines: {
    async list(): Promise<FiscalDeadline[]> {
      return await fetchWithAuth("/api/fiscal-deadlines");
    },
    async create(deadline: Omit<FiscalDeadline, "id">): Promise<FiscalDeadline> {
      return await fetchWithAuth("/api/fiscal-deadlines", {
        method: "POST",
        body: JSON.stringify(deadline),
      });
    },
    async update(id: string, deadline: Partial<FiscalDeadline>): Promise<FiscalDeadline> {
      return await fetchWithAuth(`/api/fiscal-deadlines/${id}`, {
        method: "PUT",
        body: JSON.stringify(deadline),
      });
    },
    async delete(id: string): Promise<void> {
      await fetchWithAuth(`/api/fiscal-deadlines/${id}`, { method: "DELETE" });
    }
  },

  tasks: {
    async list(): Promise<Task[]> {
      return await fetchWithAuth("/api/tasks");
    },
    async create(task: Partial<Task>): Promise<Task> {
      return await fetchWithAuth("/api/tasks", {
        method: "POST",
        body: JSON.stringify(task),
      });
    },
    async update(id: string, task: Partial<Task>): Promise<Task> {
      return await fetchWithAuth(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(task),
      });
    },
    async addComment(id: string, texto: string): Promise<Task> {
      return await fetchWithAuth(`/api/tasks/${id}/comment`, {
        method: "POST",
        body: JSON.stringify({ texto }),
      });
    },
    async delete(id: string): Promise<void> {
      await fetchWithAuth(`/api/tasks/${id}`, { method: "DELETE" });
    }
  },

  documents: {
    async list(): Promise<DocumentInfo[]> {
      return await fetchWithAuth("/api/documents");
    },
    async upload(doc: { nome: string; tipo: string; clienteId: string; tamanho: string; contentBase64: string }): Promise<DocumentInfo> {
      return await fetchWithAuth("/api/documents", {
        method: "POST",
        body: JSON.stringify(doc),
      });
    },
    async delete(id: string): Promise<void> {
      await fetchWithAuth(`/api/documents/${id}`, { method: "DELETE" });
    }
  }
};
