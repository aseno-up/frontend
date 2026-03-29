"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, AlertCircle, CheckCircle, Lock } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api/client"

export default function CriarContaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>}>
      <CriarContaContent />
    </Suspense>
  )
}

function CriarContaContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokenData, setTokenData] = useState<{ email: string; patient_name: string; clinic_name: string } | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function validate() {
      if (!token) {
        setError("Link inválido. Solicite um novo agendamento para receber o link.")
        setLoading(false)
        return
      }
      try {
        const data = await api.portalValidateToken(token)
        setTokenData(data)
      } catch {
        setError("Link expirado ou inválido. Solicite um novo agendamento para receber um novo link.")
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres")
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await api.portalRegister(token!, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Conta criada!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Enviamos um email de verificação para <strong>{tokenData?.email}</strong>.
            Verifique sua caixa de entrada para ativar sua conta.
          </p>
          <p className="text-xs text-slate-400">
            Após verificar o email, você poderá fazer login e gerenciar seus agendamentos.
          </p>
        </div>
      </div>
    )
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Link inválido</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6 text-cyan-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Criar conta</h2>
          <p className="text-sm text-slate-500 mt-1">{tokenData?.clinic_name}</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-5 text-sm">
          <p className="text-slate-500">
            Olá, <strong className="text-slate-700">{tokenData?.patient_name}</strong>
          </p>
          <p className="text-slate-400 text-xs mt-1">Crie uma senha para acessar seus agendamentos</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={tokenData?.email || ""}
              disabled
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              minLength={8}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !password || !confirmPassword}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white border-none rounded-lg text-sm font-semibold cursor-pointer disabled:cursor-default transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</> : "Criar conta"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          Já tem uma conta?{" "}
          <Link href="/portal/login" className="text-cyan-600 hover:underline">Fazer login</Link>
        </p>
      </div>
    </div>
  )
}
