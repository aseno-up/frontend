"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { fetchClinicInfo, fetchProfessionals, fetchSpecialties, fetchProcedures } from "../api"
import type { ClinicInfo, Professional, Specialty, Procedure, AvailableSlot } from "../api"
import { SpecialtyStep } from "../components/steps/specialty-step"
import { ProcedureStep } from "../components/steps/procedure-step"
import { ProfessionalStep } from "../components/steps/professional-step"
import { DateTimeStep } from "../components/steps/datetime-step"
import { FirstVisitStep } from "../components/steps/first-visit-step"
import { PatientDataStep } from "../components/steps/patient-data-step"
import { SuccessStep } from "../components/steps/success-step"

// Path A (from professional card): procedure → datetime → first-visit → patient-data → success
// Path B (general "Agendar consulta"): specialty → procedure → professional → datetime → first-visit → patient-data → success
type Step = "specialty" | "procedure" | "professional" | "datetime" | "first-visit" | "patient-data" | "success"

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return `${date} às ${time}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export default function BookingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string
  const professionalIdParam = searchParams.get("professional")

  const isPathA = !!professionalIdParam

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>(isPathA ? "procedure" : "specialty")

  const [clinic, setClinic] = useState<ClinicInfo | null>(null)
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])

  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [bookingResult, setBookingResult] = useState<{
    id: string
    clinic_id: string
    professional: string
    start_time: string
    end_time: string
    price: number
    payment_token?: string
    payment_url?: string
    patient_name?: string
    patient_cpf?: string
    patient_email?: string
    patient_phone?: string
  } | null>(null)

  // --- Steps config for progress bar ---
  const requirePayment = clinic?.require_payment_before_booking ?? false
  const showProcedureStep = procedures.length > 0 || requirePayment

  const allSteps = useMemo((): Step[] => {
    if (isPathA) {
      const steps: Step[] = []
      if (showProcedureStep) steps.push("procedure")
      steps.push("datetime", "first-visit", "patient-data")
      return steps
    }
    const steps: Step[] = ["specialty"]
    if (showProcedureStep) steps.push("procedure")
    steps.push("professional", "datetime", "first-visit", "patient-data")
    return steps
  }, [isPathA, showProcedureStep])

  const stepLabels: Record<Step, string> = {
    specialty: "Especialidade",
    procedure: "Serviço",
    professional: "Profissional",
    datetime: "Data e horário",
    "first-visit": "Primeira consulta",
    "patient-data": "Seus dados",
    success: "Confirmação",
  }

  const currentStepIndex = allSteps.indexOf(step)
  const totalSteps = allSteps.length

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [clinicData, profData, specData] = await Promise.all([
          fetchClinicInfo(slug),
          fetchProfessionals(slug),
          fetchSpecialties(slug),
        ])
        setClinic(clinicData)
        setAllProfessionals(profData)
        setSpecialties(specData)

        if (isPathA) {
          const prof = profData.find((p) => p.id === professionalIdParam)
          if (!prof) {
            setError("Profissional não encontrado")
            return
          }
          setSelectedProfessional(prof)

          const specId = prof.specialty_ids?.[0] || undefined
          try {
            const procs = await fetchProcedures(slug, specId)
            setProcedures(procs)
            if (procs.length === 0) {
              setStep("datetime")
            }
          } catch {
            setStep("datetime")
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchData()
  }, [slug, professionalIdParam, isPathA])

  async function handleSpecialtySelect(spec: Specialty) {
    setSelectedSpecialty(spec)
    try {
      const procs = await fetchProcedures(slug, spec.id)
      setProcedures(procs)
      if (procs.length > 0) {
        setStep("procedure")
      } else {
        setStep("professional")
      }
    } catch {
      setStep("professional")
    }
  }

  function handleProcedureSelect(proc: Procedure | null) {
    setSelectedProcedure(proc)
    if (isPathA) {
      setStep("datetime")
    } else {
      setStep("professional")
    }
  }

  function handleProfessionalSelect(prof: Professional) {
    setSelectedProfessional(prof)
    setStep("datetime")
  }

  function handleSlotSelect(slot: AvailableSlot) {
    setSelectedSlot(slot)
    setStep("first-visit")
  }

  function handleFirstVisitDone() {
    setStep("patient-data")
  }

  function handleBookingSuccess(result: { id: string; clinic_id: string; professional: string; start_time: string; end_time: string; price: number; payment_token?: string; payment_url?: string; patient_name?: string; patient_cpf?: string; patient_email?: string; patient_phone?: string }) {
    if (result.payment_token && requirePayment) {
      router.push(`/pagar/${result.payment_token}`)
      return
    }
    setBookingResult(result)
    setStep("success")
  }

  function getFirstStep(): Step {
    if (isPathA) return procedures.length > 0 ? "procedure" : "datetime"
    return "specialty"
  }

  function goBack() {
    if (isPathA) {
      switch (step) {
        case "datetime":
          if (procedures.length > 0) setStep("procedure")
          break
        case "first-visit":
          setStep("datetime")
          break
        case "patient-data":
          setStep("first-visit")
          break
      }
    } else {
      switch (step) {
        case "procedure":
          setStep("specialty")
          break
        case "professional":
          if (procedures.length > 0) setStep("procedure")
          else setStep("specialty")
          break
        case "datetime":
          setStep("professional")
          break
        case "first-visit":
          setStep("datetime")
          break
        case "patient-data":
          setStep("first-visit")
          break
      }
    }
  }

  const filteredProfessionals = selectedSpecialty
    ? allProfessionals.filter(
        (p) => p.specialty_ids?.includes(selectedSpecialty.id) || !p.specialty_ids?.length
      )
    : allProfessionals

  // --- Summary of selections ---
  const summaryItems: { label: string; value: string }[] = []
  if (selectedProfessional) summaryItems.push({ label: "Profissional", value: selectedProfessional.name })
  if (selectedSpecialty) summaryItems.push({ label: "Especialidade", value: selectedSpecialty.name })
  if (selectedProcedure) summaryItems.push({ label: "Serviço", value: `${selectedProcedure.name}${selectedProcedure.price > 0 ? ` · ${formatCurrency(selectedProcedure.price)}` : ""}` })
  if (selectedSlot) summaryItems.push({ label: "Data/Horário", value: formatDateTime(selectedSlot.start_time) })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <Link href={`/agendar/${slug}`} className="text-cyan-600 hover:underline text-sm">
            Voltar para a clínica
          </Link>
        </div>
      </div>
    )
  }

  const brandColor = "#0891b2"
  const isFirstStep = step === getFirstStep()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className={`mx-auto px-4 py-8 flex-1 w-full ${step === "datetime" ? "max-w-[1060px]" : "max-w-[860px]"}`}>
        {/* Back link */}
        {step !== "success" && (
          <div className="mb-4">
            {isFirstStep ? (
              <Link
                href={`/agendar/${slug}`}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            ) : (
              <button
                onClick={goBack}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
          </div>
        )}

        {/* Step indicator */}
        {step !== "success" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">
                Etapa {currentStepIndex + 1} de {totalSteps}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {stepLabels[step]}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
                  backgroundColor: brandColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Summary of previous selections */}
        {step !== "success" && summaryItems.length > 0 && step !== "specialty" && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              {summaryItems.map((item) => (
                <div key={item.label} className="text-xs">
                  <span className="text-slate-400">{item.label}: </span>
                  <span className="font-medium text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Steps */}
        {step === "specialty" && (
          <SpecialtyStep specialties={specialties} onSelect={handleSpecialtySelect} />
        )}

        {step === "procedure" && (
          <ProcedureStep procedures={procedures} onSelect={handleProcedureSelect} requirePayment={requirePayment} />
        )}

        {step === "professional" && (
          <ProfessionalStep professionals={filteredProfessionals} onSelect={handleProfessionalSelect} />
        )}

        {step === "datetime" && selectedProfessional && (
          <DateTimeStep
            slug={slug}
            professionalId={selectedProfessional.id}
            procedureId={selectedProcedure?.id}
            durationMinutes={selectedProcedure?.duration_minutes || clinic?.default_appointment_minutes || 50}
            brandColor={brandColor}
            onSelect={handleSlotSelect}
          />
        )}

        {step === "first-visit" && (
          <FirstVisitStep onContinue={handleFirstVisitDone} />
        )}

        {step === "patient-data" && selectedProfessional && selectedSlot && (
          <PatientDataStep
            slug={slug}
            professional={selectedProfessional}
            selectedSlot={selectedSlot}
            selectedProcedure={selectedProcedure}
            requirePayment={requirePayment}
            onSuccess={handleBookingSuccess}
          />
        )}

        {step === "success" && bookingResult && (
          <SuccessStep result={bookingResult} slug={slug} />
        )}
      </div>

      {/* Sticky footer */}
      <div className="py-4 text-center text-xs text-slate-400">
        Agendamento online por <strong className="text-cyan-600 font-semibold">aseno</strong>
      </div>
    </div>
  )
}
