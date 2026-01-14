"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Calendar, Clock, User, Phone, Loader2, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

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

interface SlotsResponse {
  date: string
  professional_id: string
  duration_minutes: number
  slots: AvailableSlot[]
}

type Step = "professional" | "date" | "time" | "form" | "success" | "error"

export default function AgendarPage() {
  const params = useParams()
  const slug = params.slug as string

  const [step, setStep] = useState<Step>("professional")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [clinic, setClinic] = useState<ClinicInfo | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Selections
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
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

  // Fetch available slots when date changes
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedProfessional || !selectedDate) return

      try {
        setLoadingSlots(true)
        const res = await fetch(
          `${API_URL}/book/${slug}/slots?professional_id=${selectedProfessional.id}&date=${selectedDate}`
        )
        if (!res.ok) {
          throw new Error("Erro ao carregar horarios")
        }
        const data: SlotsResponse = await res.json()
        setSlots(data.slots || [])
      } catch (err) {
        console.error(err)
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [slug, selectedProfessional, selectedDate])

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

  // Get next 14 days for date selection
  function getNextDays(count: number): string[] {
    const days: string[] = []
    const today = new Date()
    for (let i = 0; i < count; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date.toISOString().split("T")[0])
    }
    return days
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00")
    return date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
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
            <div className="bg-gray-100 rounded-lg p-4 text-left text-sm">
              <p><strong>Profissional:</strong> {selectedProfessional?.name}</p>
              <p><strong>Data:</strong> {selectedSlot && formatDate(selectedSlot.start_time.split("T")[0])}</p>
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
            <Button onClick={() => { setError(null); setStep("professional") }}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {clinic?.logo_url && (
            <img src={clinic.logo_url} alt={clinic.name} className="h-16 mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold">{clinic?.name}</h1>
          <p className="text-muted-foreground">Agendamento Online</p>
        </div>

        {/* Step 1: Select Professional */}
        {step === "professional" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Escolha o Profissional
              </CardTitle>
              <CardDescription>Selecione com quem deseja agendar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {professionals.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum profissional disponivel no momento.
                </p>
              ) : (
                professionals.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => {
                      setSelectedProfessional(prof)
                      setStep("date")
                    }}
                    className="w-full p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left flex items-center gap-4"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: prof.color || "#6366f1" }}
                    >
                      {prof.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{prof.name}</p>
                      <p className="text-sm text-muted-foreground">{prof.specialty}</p>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Date */}
        {step === "date" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Escolha a Data
              </CardTitle>
              <CardDescription>
                Agendando com {selectedProfessional?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {getNextDays(14).map((date) => (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date)
                      setStep("time")
                    }}
                    className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-center"
                  >
                    <p className="text-sm font-medium">{formatDate(date)}</p>
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={() => setStep("professional")}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Time */}
        {step === "time" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Escolha o Horario
              </CardTitle>
              <CardDescription>
                {formatDate(selectedDate)} com {selectedProfessional?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum horario disponivel nesta data.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {slots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSlot(slot)
                        setStep("form")
                      }}
                      className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-center"
                    >
                      <p className="font-medium">{formatTime(slot.start_time)}</p>
                    </button>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={() => setStep("date")}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Patient Form */}
        {step === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Seus Dados
              </CardTitle>
              <CardDescription>
                {formatDate(selectedDate)} as {selectedSlot && formatTime(selectedSlot.start_time)} com {selectedProfessional?.name}
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
                <Button variant="outline" onClick={() => setStep("time")}>
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
