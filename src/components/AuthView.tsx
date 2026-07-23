import React, { useState } from "react";
import { Shield, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff, UserPlus, LogIn, UserCheck } from "lucide-react";
import { User } from "../types";
import { api } from "../utils/api";

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  
  // Login fields
  const [email, setEmail] = useState("ctbthay@gmail.com");
  const [password, setPassword] = useState("");
  
  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("ctbthay@gmail.com");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"admin" | "colaborador">("admin");

  const [showPassword, setShowPassword] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor, informe seu e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email.trim(), password.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError("Erro ao autenticar. Verifique seus dados.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao tentar fazer login.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setError("Por favor, digite seu Nome Completo.");
      return;
    }
    if (!regEmail.trim()) {
      setError("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.register(regName.trim(), regEmail.trim(), regPassword.trim(), regRole);
      if (res.success && res.user) {
        setSuccess(res.message || "Usuário cadastrado com sucesso!");
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 600);
      } else {
        setError("Erro ao salvar cadastro do usuário.");
      }
    } catch (err: any) {
      setError(err.message || "Falha ao registrar novo usuário.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.auth.recover(recoverEmail);
      if (res.success) {
        setSuccess(res.message);
        setRecoverEmail("");
      }
    } catch (err: any) {
      setError(err.message || "Usuário não localizado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4 relative overflow-hidden font-sans">
      {/* Decorative backdrop blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#111113] border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10 transition-all text-left">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10 mb-4 ring-4 ring-blue-500/10">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-center">
            Assessoria & Gestão
          </h1>
          <p className="text-zinc-400 text-xs mt-1 text-center">
            Escritório Inteligente & Gestão Administrativa
          </p>
        </div>

        {/* Tab switchers: Acessar vs Cadastrar */}
        {!showRecover && (
          <div className="flex bg-[#0c0c0e] p-1 rounded-xl border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Acessar Conta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cadastrar Usuário</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
            <div className="leading-relaxed">{success}</div>
          </div>
        )}

        {showRecover ? (
          /* Password recovery form */
          <form onSubmit={handleRecover} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                E-mail de Recuperação
              </label>
              <input
                type="email"
                required
                className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="ctbthay@gmail.com"
                value={recoverEmail}
                onChange={(e) => setRecoverEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 px-4 rounded-lg transition shadow-lg shadow-blue-500/15 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Enviar link de redefinição"
              )}
            </button>

            <button
              type="button"
              className="w-full bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-white text-xs font-medium py-2 rounded-lg transition mt-2 cursor-pointer"
              onClick={() => {
                setShowRecover(false);
                setError(null);
                setSuccess(null);
              }}
            >
              Voltar ao Login
            </button>
          </form>
        ) : mode === "login" ? (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                Endereço de E-mail
              </label>
              <input
                type="email"
                required
                className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="seuemail@contabil.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-zinc-400 text-[10px] font-semibold uppercase tracking-wider font-mono">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                  onClick={() => {
                    setShowRecover(true);
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tracking-wider font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Insira sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition focus:outline-none cursor-pointer p-1 flex items-center justify-center"
                  title={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 px-4 rounded-lg cursor-pointer transition shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Entrar no Painel Seguro</span>
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-xs text-zinc-400 hover:text-blue-400 transition cursor-pointer underline"
              >
                Precisa cadastrar seu nome ou trocar de usuário? Clique aqui
              </button>
            </div>
          </form>
        ) : (
          /* Register / Update User Form */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                Seu Nome Completo
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Seu Nome / Nome do Escritório"
                className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                E-mail de Acesso
              </label>
              <input
                type="email"
                required
                placeholder="ctbthay@gmail.com"
                className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                Definir Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Crie ou atualize sua senha"
                  className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tracking-wider font-mono"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition focus:outline-none cursor-pointer p-1 flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                Perfil de Acesso
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as any)}
                className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="admin">Administrador Geral</option>
                <option value="colaborador">Colaborador Operacional</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 px-4 rounded-lg cursor-pointer transition shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Cadastrar e Entrar</span>
                  <UserCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
