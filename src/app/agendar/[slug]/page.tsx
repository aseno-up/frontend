"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Phone, Loader2, CheckCircle, AlertCircle, CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { BookingCalendar } from "./booking-calendar"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4901/api/v1"

interface ClinicInfo {
  name: string
  slug: string
  logo_url: string
  primary_color: string
  phone: string
  address: string
  city: string
  state: string
  default_appointment_minutes: number
}

interface Professional {
  id: string
  name: string
  specialty: string
  avatar_url: string
  bio: string
  color: string
}

interface AvailableSlot {
  start_time: string
  end_time: string
}

type Step = "calendar" | "form" | "success" | "error"

export default function AgendarPage() {
  const params = useParams()
  const slug = params.slug as string

  const [step, setStep] = useState<Step>("calendar")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [clinic, setClinic] = useState<ClinicInfo | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])

  // Selections
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)

  // Form
  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientNotes, setPatientNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Fetch clinic info and professionals
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch clinic info
        const clinicRes = await fetch(`${API_URL}/book/${slug}`)
        if (!clinicRes.ok) {
          if (clinicRes.status === 404) {
            throw new Error("Clinica nao encontrada")
          }
          throw new Error("Erro ao carregar dados da clinica")
        }
        const clinicData = await clinicRes.json()
        setClinic(clinicData)

        // Fetch professionals
        const profRes = await fetch(`${API_URL}/book/${slug}/professionals`)
        if (!profRes.ok) {
          throw new Error("Erro ao carregar profissionais")
        }
        const profData = await profRes.json()
        setProfessionals(profData || [])

      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchData()
    }
  }, [slug])

  // Handle form submission
  async function handleSubmit() {
    if (!selectedProfessional || !selectedSlot || !patientName || !patientPhone) {
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${API_URL}/book/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional_id: selectedProfessional.id,
          start_time: selectedSlot.start_time,
          patient_name: patientName,
          patient_phone: patientPhone,
          patient_notes: patientNotes,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Erro ao agendar")
      }

      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao agendar")
      setStep("error")
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && step !== "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Agendamento Realizado!</h2>
            <p className="text-muted-foreground mb-4">
              Sua consulta foi agendada com sucesso. Aguarde a confirmacao da clinica.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 text-left text-sm space-y-1">
              <p><strong>Profissional:</strong> {selectedProfessional?.name}</p>
              <p><strong>Data:</strong> {selectedSlot && formatDate(selectedSlot.start_time)}</p>
              <p><strong>Horario:</strong> {selectedSlot && formatTime(selectedSlot.start_time)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro ao Agendar</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => { setError(null); setStep("calendar") }}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 flex flex-col">
      <div className={`mx-auto w-full flex-1 flex flex-col ${step === "calendar" ? "max-w-6xl" : "max-w-2xl"}`}>
        {/* Header */}
        <div className="text-center mb-6 shrink-0">
          {clinic?.logo_url && (
            <img src={clinic.logo_url} alt={clinic.name} className="h-12 mx-auto mb-2" />
          )}
          <h1 className="text-xl font-bold">{clinic?.name}</h1>
          <p className="text-sm text-muted-foreground">Agendamento Online</p>
        </div>

        {/* Step 1: Calendar with Professional Select */}
        {step === "calendar" && (
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5" />
                Agende sua Consulta
              </CardTitle>
              <CardDescription>Selecione o profissional e clique em um horario disponivel</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pb-4">
              <BookingCalendar
                slug={slug}
                professionals={professionals}
                primaryColor={clinic?.primary_color || "#38b6ff"}
                durationMinutes={clinic?.default_appointment_minutes || 50}
                onSlotSelect={(slot, professional) => {
                  setSelectedSlot(slot)
                  setSelectedProfessional(professional)
                  setStep("form")
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Patient Form */}
        {step === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Seus Dados
              </CardTitle>
              <CardDescription>
                {selectedSlot && formatDate(selectedSlot.start_time)} as {selectedSlot && formatTime(selectedSlot.start_time)} com {selectedProfessional?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                <Input
                  id="phone"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observacoes (opcional)</Label>
                <Textarea
                  id="notes"
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="Informacoes adicionais..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("calendar")}>
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!patientName || !patientPhone || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
