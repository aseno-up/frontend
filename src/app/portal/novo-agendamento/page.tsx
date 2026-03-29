"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api/client"
import { DateTimeStep } from "@/app/agendar/[slug]/components/steps/datetime-step"

// Reuse types from the public booking API
interface Specialty { id: string; name: string }
interface Procedure { id: string; name: string; specialty_id: string | null; price: number; duration_minutes: number }
interface Professional { id: string; name: string; specialty_ids: string[]; specialty_names: string[]; avatar_url: string; has_available_schedule: boolean }
interface AvailableSlot { start_time: string; end_time: string }
interface PortalMe { patient_id: string; clinic_id: string; clinic_name: string; clinic_slug: string; name: string }

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4901/api/v1"

type Step = "specialty" | "procedure" | "professional" | "datetime" | "confirm" | "success"

function formatCurrency(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) }
function formatDateTime(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export default function NovoAgendamentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<PortalMe | null>(null)
  const [step, setStep] = useState<Step>("specialty")

  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])

  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const meData = await api.portalGetMe()
        setMe(meData)
        const [specRes, profRes] = await Promise.all([
          fetch(`${API_URL}/book/${meData.clinic_slug}/specialties`).then(r => r.json()),
          fetch(`${API_URL}/book/${meData.clinic_slug}/professionals`).then(r => r.json()),
        ])
        setSpecialties(specRes || [])
        setProfessionals(profRes || [])
      } catch {
        router.push("/portal/login")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  async function handleSpecialtySelect(spec: Specialty) {
    setSelectedSpecialty(spec)
    try {
      const procs = await fetch(`${API_URL}/book/${me!.clinic_slug}/procedures?specialty_id=${spec.id}`).then(r => r.json())
      setProcedures(procs || [])
      setStep(procs?.length > 0 ? "procedure" : "professional")
    } catch {
      setStep("professional")
    }
  }

  function handleProcedureSelect(proc: Procedure | null) {
    setSelectedProcedure(proc)
    setStep("professional")
  }

  function handleProfessionalSelect(prof: Professional) {
    setSelectedProfessional(prof)
    setStep("datetime")
  }

  function handleSlotSelect(slot: AvailableSlot) {
    setSelectedSlot(slot)
    setStep("confirm")
  }

  async function handleConfirm() {
    if (!selectedProfessional || !selectedSlot) return
    try {
      setSubmitting(true)
      setError(null)
      await api.portalCreateAppointment({
        professional_id: selectedProfessional.id,
        start_time: selectedSlot.start_time,
        procedure_id: selectedProcedure?.id,
        notes: notes || undefined,
      })
      setSuccess(true)
      setStep("success")
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } }
      setError(apiErr?.response?.data?.error || "Erro ao agendar")
    } finally {
      setSubmitting(false)
    }
  }

  function goBack() {
    switch (step) {
      case "procedure": setStep("specialty"); break
      case "professional": setStep(procedures.length > 0 ? "procedure" : "specialty"); break
      case "datetime": setStep("professional"); break
      case "confirm": setStep("datetime"); break
    }
  }

  const filteredProfessionals = selectedSpecialty
    ? professionals.filter(p => p.specialty_ids?.includes(selectedSpecialty.id) || !p.specialty_ids?.length)
    : professionals

  const allSteps: Step[] = useMemo(() => {
    const s: Step[] = ["specialty"]
    if (procedures.length > 0) s.push("procedure")
    s.push("professional", "datetime", "confirm")
    return s
  }, [procedures.length])

  const currentIdx = allSteps.indexOf(step)
  const stepLabels: Record<Step, string> = { specialty: "Especialidade", procedure: "Serviço", professional: "Profissional", datetime: "Data/Horário", confirm: "Confirmar", success: "Sucesso" }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Agendamento realizado!</h2>
          <p className="text-sm text-slate-500 mb-6">Aguarde a confirmação da clínica.</p>
          <Link href="/portal/meus-agendamentos" className="inline-block px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold transition-colors">
            Ver meus agendamentos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[860px] mx-auto px-4 py-8">
      {/* Back */}
      <div className="mb-4">
        {step === "specialty" ? (
          <Link href="/portal/meus-agendamentos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        ) : (
          <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Etapa {currentIdx + 1} de {allSteps.length}</span>
          <span className="text-xs font-medium text-slate-500">{stepLabels[step]}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-cyan-600 transition-all duration-300" style={{ width: `${((currentIdx + 1) / allSteps.length) * 100}%` }} />
        </div>
      </div>

      {/* Summary */}
      {(selectedSpecialty || selectedProfessional || selectedSlot) && step !== "specialty" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
            {selectedSpecialty && <div><span className="text-slate-400">Especialidade: </span><span className="font-medium text-slate-700">{selectedSpecialty.name}</span></div>}
            {selectedProcedure && <div><span className="text-slate-400">Serviço: </span><span className="font-medium text-slate-700">{selectedProcedure.name} · {formatCurrency(selectedProcedure.price)}</span></div>}
            {selectedProfessional && <div><span className="text-slate-400">Profissional: </span><span className="font-medium text-slate-700">{selectedProfessional.name}</span></div>}
            {selectedSlot && <div><span className="text-slate-400">Horário: </span><span className="font-medium text-slate-700">{formatDateTime(selectedSlot.start_time)}</span></div>}
          </div>
        </div>
      )}

      {/* Steps */}
      {step === "specialty" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Especialização</h2>
          <p className="text-sm text-slate-500 mb-5">Selecione a especialização desejada</p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {specialties.map(s => (
              <button key={s.id} onClick={() => handleSpecialtySelect(s)} className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="text-sm font-medium">{s.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "procedure" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Serviço</h2>
          <p className="text-sm text-slate-500 mb-5">Selecione o serviço desejado</p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {procedures.map(p => (
              <button key={p.id} onClick={() => handleProcedureSelect(p)} className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex justify-between">
                  <div><div className="text-sm font-medium text-slate-700">{p.name}</div>{p.duration_minutes > 0 && <div className="text-xs text-slate-400 mt-0.5">{p.duration_minutes} min</div>}</div>
                  {p.price > 0 && <div className="text-sm font-semibold text-cyan-700">{formatCurrency(p.price)}</div>}
                </div>
              </button>
            ))}
            <button onClick={() => handleProcedureSelect(null)} className="w-full text-center px-4 py-2.5 text-sm text-slate-500 hover:text-cyan-600 cursor-pointer bg-transparent border-none">Pular seleção de serviço</button>
          </div>
        </div>
      )}

      {step === "professional" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Profissional</h2>
          <p className="text-sm text-slate-500 mb-5">Selecione o profissional</p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredProfessionals.filter(p => p.has_available_schedule).map(p => (
              <button key={p.id} onClick={() => handleProfessionalSelect(p)} className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-50 border border-slate-200 flex items-center justify-center text-sm font-semibold text-sky-800 shrink-0">
                  {p.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.specialty_names?.join(" · ")}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "datetime" && me && selectedProfessional && (
        <DateTimeStep
          slug={me.clinic_slug}
          professionalId={selectedProfessional.id}
          procedureId={selectedProcedure?.id}
          durationMinutes={selectedProcedure?.duration_minutes || 50}
          onSelect={handleSlotSelect}
        />
      )}

      {step === "confirm" && selectedSlot && selectedProfessional && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Confirmar agendamento</h2>
          <p className="text-sm text-slate-500 mb-5">Revise os dados e confirme</p>

          <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2 mb-5">
            <div><span className="text-slate-500">Profissional:</span> <span className="font-medium">{selectedProfessional.name}</span></div>
            <div><span className="text-slate-500">Data/Horário:</span> <span className="font-medium">{formatDateTime(selectedSlot.start_time)}</span></div>
            {selectedProcedure && <div><span className="text-slate-500">Serviço:</span> <span className="font-medium">{selectedProcedure.name} · {formatCurrency(selectedProcedure.price)}</span></div>}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações (opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informações adicionais..." rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors resize-y" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

          <button onClick={handleConfirm} disabled={submitting} className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer disabled:cursor-default transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Agendando...</> : "Confirmar agendamento"}
          </button>
        </div>
      )}
    </div>
  )
}
