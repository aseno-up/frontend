"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction"
import { EventClickArg, EventInput } from "@fullcalendar/core"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import Link from "next/link"
import { Calendar, AlertCircle, TrendingUp, Clock, Loader2, LogOut, X, Plus, QrCode, Copy, Check, CheckCircle } from "lucide-react"
import { api } from "@/lib/api/client"

interface PortalStats {
  total_appointments: number
  no_show_count: number
  appointments_last_month: number
  next_appointment: string | null
  next_professional_name: string
}

interface PortalMe {
  patient_id: string
  clinic_id: string
  clinic_name: string
  clinic_slug: string
  name: string
  email: string
  phone: string
}

interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: string
  title: string
  professional: { id: string; name: string; specialty: string; color: string }
  patient_notes: string
  price: number
  payment_status: string
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  awaiting_payment: { bg: "#FFF7ED", border: "#F97316", text: "#9A3412" },
  pending: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  confirmed: { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },
  canceled: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },
  no_show: { bg: "#E5E7EB", border: "#6B7280", text: "#374151" },
  completed: { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },
  rescheduled: { bg: "#EDE9FE", border: "#8B5CF6", text: "#5B21B6" },
}

const statusLabels: Record<string, string> = {
  awaiting_payment: "Aguardando Pagamento",
  pending: "Pendente",
  confirmed: "Confirmado",
  canceled: "Cancelado",
  no_show: "Falta",
  completed: "Concluído",
  rescheduled: "Reagendado",
}

export default function MeusAgendamentosPage() {
  const router = useRouter()
  const calendarRef = useRef<FullCalendar>(null)

  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<PortalMe | null>(null)
  const [stats, setStats] = useState<PortalStats | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [canceling, setCanceling] = useState(false)
  const [hasSubaccount, setHasSubaccount] = useState(false)
  const [payingApt, setPayingApt] = useState<Appointment | null>(null)
  const [creatingCharge, setCreatingCharge] = useState(false)
  const [pixData, setPixData] = useState<{ pix_qrcode_image?: string; pix_copy_paste?: string; id?: string } | null>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [meData, statsData, aptsData] = await Promise.all([
        api.portalGetMe(),
        api.portalGetStats(),
        api.portalGetAppointments(),
      ])
      setMe(meData)
      setStats(statsData)
      setAppointments(aptsData.data || [])
    } catch {
      router.push("/portal/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Check if clinic has marketplace subaccount
  useEffect(() => {
    if (!me?.clinic_id) return
    api.checkMarketplaceSubaccount(me.clinic_id)
      .then(data => setHasSubaccount(data.has_subaccount))
      .catch(() => setHasSubaccount(false))
  }, [me?.clinic_id])

  // Poll payment status
  useEffect(() => {
    if (!pixData?.id) return
    const interval = setInterval(async () => {
      try {
        const data = await api.getMarketplaceChargeStatus(pixData.id!)
        if (data.status === "RECEIVED" || data.status === "CONFIRMED") {
          setPaymentConfirmed(true)
          clearInterval(interval)
        }
      } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(interval)
  }, [pixData?.id])

  async function handlePayPix(apt: Appointment) {
    if (!me) return
    try {
      setCreatingCharge(true)
      setPayingApt(apt)
      setSelectedApt(null)
      const charge = await api.createMarketplaceCharge(me.clinic_id, apt.id, {
        billing_type: "PIX",
        customer_name: me.name,
        customer_cpf_cnpj: "00000000000",
        customer_email: me.email,
        customer_phone: me.phone,
      })
      setPixData({ pix_qrcode_image: charge.pix_qrcode_image, pix_copy_paste: charge.pix_copy_paste, id: charge.id })
    } catch {
      setPayingApt(null)
    } finally {
      setCreatingCharge(false)
    }
  }

  function handleClosePayment() {
    setPayingApt(null)
    setPixData(null)
    setPixCopied(false)
    setPaymentConfirmed(false)
    fetchData()
  }

  async function handleLogout() {
    await api.portalLogout()
    router.push("/portal/login")
  }

  async function handleCancel(aptId: string) {
    try {
      setCanceling(true)
      await api.portalCancelAppointment(aptId)
      setSelectedApt(null)
      fetchData()
    } catch {
      alert("Erro ao cancelar agendamento")
    } finally {
      setCanceling(false)
    }
  }

  function handleEventClick(info: EventClickArg) {
    const apt = info.event.extendedProps.appointment as Appointment
    setSelectedApt(apt)
  }

  function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " às " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  function formatNextDate(dateStr: string | null): string {
    if (!dateStr) return "—"
    const d = new Date(dateStr)
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
      " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  const events: EventInput[] = appointments.map((apt) => {
    const colors = statusColors[apt.status] || statusColors.pending
    return {
      id: apt.id,
      title: `${apt.professional?.name || apt.title} · ${statusLabels[apt.status] || apt.status}`,
      start: apt.start_time,
      end: apt.end_time,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: { appointment: apt },
    }
  })

  const canCancel = (apt: Appointment) =>
    (apt.status === "pending" || apt.status === "confirmed") &&
    new Date(apt.start_time) > new Date()

  return (
    <div className="max-w-[1060px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Meus Agendamentos</h1>
          <p className="text-sm text-slate-500">
            {me?.name} · {me?.clinic_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/portal/novo-agendamento"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            Novo agendamento
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{stats.total_appointments}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{stats.no_show_count}</div>
              <div className="text-xs text-slate-500">Faltas</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{stats.appointments_last_month}</div>
              <div className="text-xs text-slate-500">Último mês</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{formatNextDate(stats.next_appointment)}</div>
              <div className="text-xs text-slate-500">
                {stats.next_professional_name || "Próximo"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={ptBrLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay,listWeek",
          }}
          events={events}
          editable={false}
          selectable={false}
          weekends={true}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          height="auto"
          eventClick={handleEventClick}
          nowIndicator={true}
        />
      </div>

      {/* Appointment detail modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Detalhes</h3>
              <button
                onClick={() => setSelectedApt(null)}
                className="p-1 hover:bg-slate-100 rounded-md cursor-pointer bg-transparent border-none"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div>
                <span className="text-slate-400">Profissional: </span>
                <span className="font-medium text-slate-700">{selectedApt.professional?.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Data/Horário: </span>
                <span className="font-medium text-slate-700">{formatDateTime(selectedApt.start_time)}</span>
              </div>
              <div>
                <span className="text-slate-400">Status: </span>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: statusColors[selectedApt.status]?.bg,
                    color: statusColors[selectedApt.status]?.text,
                  }}
                >
                  {statusLabels[selectedApt.status] || selectedApt.status}
                </span>
              </div>
              {selectedApt.patient_notes && (
                <div>
                  <span className="text-slate-400">Observações: </span>
                  <span className="text-slate-600">{selectedApt.patient_notes}</span>
                </div>
              )}
            </div>

            {hasSubaccount && selectedApt.price > 0 && selectedApt.payment_status !== "paid" && (selectedApt.status === "pending" || selectedApt.status === "confirmed") && (
              <button
                onClick={() => handlePayPix(selectedApt)}
                className="w-full mt-3 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Pagar via PIX — {selectedApt.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </button>
            )}

            {canCancel(selectedApt) && (
              <button
                onClick={() => handleCancel(selectedApt.id)}
                disabled={canceling}
                className="w-full mt-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {canceling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Cancelar agendamento
              </button>
            )}
          </div>
        </div>
      )}

      {/* PIX Payment Modal */}
      {payingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl text-center">
            {paymentConfirmed ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Pagamento confirmado!</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {payingApt.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} recebido com sucesso.
                </p>
                <button
                  onClick={handleClosePayment}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-colors"
                >
                  Fechar
                </button>
              </>
            ) : creatingCharge ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Gerando PIX...</p>
              </>
            ) : pixData ? (
              <>
                <QrCode className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Pague via PIX</h3>
                <p className="text-sm text-slate-500 mb-3">
                  {payingApt.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>

                {pixData.pix_qrcode_image && (
                  <img
                    src={`data:image/png;base64,${pixData.pix_qrcode_image}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto rounded-lg border border-slate-200 mb-3"
                  />
                )}

                {pixData.pix_copy_paste && (
                  <div className="mb-3">
                    <div className="bg-slate-50 rounded-lg p-2 text-xs font-mono text-slate-600 break-all max-h-16 overflow-auto">
                      {pixData.pix_copy_paste}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixData.pix_copy_paste!)
                        setPixCopied(true)
                        setTimeout(() => setPixCopied(false), 2000)
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer border-none"
                    >
                      {pixCopied ? <><Check className="h-3 w-3" /> Copiado!</> : <><Copy className="h-3 w-3" /> Copiar codigo</>}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-3">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Aguardando pagamento...
                </div>

                <button
                  onClick={handleClosePayment}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
                >
                  Fechar
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
