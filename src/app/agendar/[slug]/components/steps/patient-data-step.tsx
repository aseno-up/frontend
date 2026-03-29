"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { createBooking } from "../../api"
import type { Professional, AvailableSlot, Procedure } from "../../api"

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function stripPhone(value: string): string {
  return value.replace(/\D/g, "")
}

export function PatientDataStep({
  slug,
  professional,
  selectedSlot,
  selectedProcedure,
  requirePayment,
  onSuccess,
}: {
  slug: string
  professional: Professional
  selectedSlot: AvailableSlot
  selectedProcedure: Procedure | null
  requirePayment?: boolean
  onSuccess: (result: { id: string; clinic_id: string; professional: string; start_time: string; end_time: string; price: number; payment_token?: string; payment_url?: string; patient_name?: string; patient_cpf?: string; patient_email?: string; patient_phone?: string }) => void
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [cpf, setCpf] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const rawPhone = stripPhone(phone)
    const rawCpf = cpf.replace(/\D/g, "")
    if (!name || rawPhone.length < 10) return
    if (requirePayment && rawCpf.length < 11) return

    try {
      setSubmitting(true)
      setError(null)
      const result = await createBooking(slug, {
        professional_id: professional.id,
        start_time: selectedSlot.start_time,
        procedure_id: selectedProcedure?.id,
        patient_name: name,
        patient_phone: rawPhone,
        patient_email: email || undefined,
        patient_notes: notes || undefined,
      })
      onSuccess({
        id: result.id,
        clinic_id: result.clinic_id,
        professional: result.professional,
        start_time: result.start_time,
        end_time: result.end_time,
        price: result.price,
        payment_token: result.payment_token,
        payment_url: result.payment_url,
        patient_name: name,
        patient_cpf: rawCpf || undefined,
        patient_email: email || undefined,
        patient_phone: rawPhone || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao agendar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Seus dados</h2>
      <p className="text-sm text-slate-500 mb-5">
        Preencha seus dados para finalizar o agendamento
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nome completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Telefone/WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="(00) 00000-0000"
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1">Para receber a confirmacao do agendamento</p>
        </div>

        {requirePayment && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
                let formatted = digits
                if (digits.length > 9) formatted = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`
                else if (digits.length > 6) formatted = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`
                else if (digits.length > 3) formatted = `${digits.slice(0,3)}.${digits.slice(3)}`
                setCpf(formatted)
              }}
              placeholder="000.000.000-00"
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
            />
            <p className="text-xs text-slate-400 mt-1">Necessario para o processamento do pagamento</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Observações (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informações adicionais..."
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors resize-y"
          />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input type="checkbox" id="lgpd" required className="mt-1" />
          <label htmlFor="lgpd" className="text-xs text-slate-500">
            Autorizo o processamento dos meus dados de saúde com a finalidade de agendamento de consulta.
          </label>
        </div>

        <button
          type="submit"
          disabled={!name || stripPhone(phone).length < 10 || (requirePayment && cpf.replace(/\D/g, "").length < 11) || submitting}
          className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer disabled:cursor-default transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Agendando...
            </>
          ) : (
            "Confirmar agendamento"
          )}
        </button>
      </form>
    </div>
  )
}
