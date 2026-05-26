import React, { useState } from "react";
import { Shield, Sparkles, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff } from "lucide-react";
import { User } from "../types";
import { api } from "../utils/api";

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [email, setEmail] = useState("ctbthay@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Por favor, digite a senha de acesso.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError("Erro ao autenticar. Verifique sua senha.");
      }
    } catch (err: any) {
      setError(err.message || "Senha incorreta ou usuário inativo.");
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

      <div className="w-full max-w-md bg-[#111113] border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10 transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10 mb-4 ring-4 ring-blue-500/10">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Assessoria & Gestão
          </h1>
          <p className="text-zinc-400 text-xs mt-1 text-center">
            Escritório Inteligente & Gestão Administrativa
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-955/20 border border-rose-500/10 rounded-lg text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-955/20 border border-emerald-500/10 rounded-lg text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {!showRecover ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                Endereço de E-mail
              </label>
              <input
                type="email"
                required
                className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="exemplo@contabil.com"
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
                  required
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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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
                  Entrar no Painel Seguro
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRecover} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wider font-mono">
                Insira o E-mail de Recuperação
              </label>
              <input
                type="email"
                required
                className="w-full bg-[#0c0c0e] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              className="w-full bg-transparent hover:bg-white/[0.04] border border-transparent text-zinc-400 hover:text-white text-xs font-medium py-2 rounded-lg transition mt-2 cursor-pointer"
              onClick={() => {
                setShowRecover(false);
                setError(null);
                setSuccess(null);
              }}
            >
              Voltar ao Login contábil
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
