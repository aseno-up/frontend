"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api/client"

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>}>
      <VerificarEmailContent />
    </Suspense>
  )
}

function VerificarEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError("Token não fornecido")
        setLoading(false)
        return
      }
      try {
        await api.portalVerifyEmail(token)
        setSuccess(true)
      } catch {
        setError("Token inválido ou expirado")
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Verificando email...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Email verificado!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Sua conta está ativa. Agora você pode fazer login e gerenciar seus agendamentos.
          </p>
          <Link
            href="/portal/login"
            className="inline-block px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Fazer login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center">
        <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Erro na verificação</h2>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    </div>
  )
}
