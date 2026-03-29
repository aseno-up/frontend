"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogIn } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api/client"

export default function PortalLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      await api.portalLogin(email, password)
      router.push("/portal/meus-agendamentos")
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } }
      setError(apiErr?.response?.data?.error || "Email ou senha inválidos")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-3">
            <LogIn className="h-6 w-6 text-cyan-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Portal do Paciente</h2>
          <p className="text-sm text-slate-500 mt-1">Acesse seus agendamentos</p>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white border-none rounded-lg text-sm font-semibold cursor-pointer disabled:cursor-default transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</> : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
