"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { EventResizeDoneArg } from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import { EventClickArg, DateSelectArg, EventDropArg, EventContentArg, EventHoveringArg } from "@fullcalendar/core"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import { format } from "date-fns"
import { Check, Clock, X, UserX, CheckCircle, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { api } from "@/lib/api/client"
import { handleApiError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Appointment, Professional, CalendarEvent as ApiCalendarEvent } from "@/types/api"

// Status configuration with colors and icons
const statusConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  awaiting_payment: { bg: "#FFF7ED", border: "#F97316", text: "#9A3412", label: "Aguardando Pagamento" },
  pending: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E", label: "Pendente" },
  scheduled: { bg: "#E0F2FE", border: "#0EA5E9", text: "#075985", label: "Agendado" },
  confirmed: { bg: "#D1FAE5", border: "#10B981", text: "#065F46", label: "Confirmado" },
  canceled: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B", label: "Cancelado" },
  no_show: { bg: "#E5E7EB", border: "#6B7280", text: "#374151", label: "Faltou" },
  completed: { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF", label: "Concluído" },
  rescheduled: { bg: "#EDE9FE", border: "#8B5CF6", text: "#5B21B6", label: "Reagendado" },
}

// Status icons
const StatusIcon = ({ status }: { status: string }) => {
  const iconClass = "w-3 h-3"
  switch (status) {
    case "pending":
      return <Clock className={iconClass} />
    case "confirmed":
      return <Check className={iconClass} />
    case "canceled":
      return <X className={iconClass} />
    case "no_show":
      return <UserX className={iconClass} />
    case "completed":
      return <CheckCircle className={iconClass} />
    case "rescheduled":
      return <RefreshCw className={iconClass} />
    default:
      return <Clock className={iconClass} />
  }
}

interface CalendarEventInternal {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  classNames?: string[]
  extendedProps: {
    appointment?: Appointment
    isVirtual: boolean
    sessionPlanId?: string
    virtualDate?: string
    professionalColor?: string
    professionalName?: string
    patientName?: string
    planType?: string
    enrolledCount?: number
    capacity?: number
    timeText?: string
  }
}

interface CalendarProps {
  onEventClick: (appointment: Appointment) => void
  onGroupEventClick?: (sessionPlanId: string, date: string) => void
  onDateSelect: (start: Date, end: Date, professionalId?: string) => void
  selectedProfessionalId?: string
  professionals: Professional[]
  refreshKey?: number
}

// Tooltip state type
interface TooltipState {
  visible: boolean
  x: number
  y: number
  appointment: Appointment | null
  professionalColor?: string
  professionalName?: string
  timeText: string
  config: { bg: string; border: string; text: string; label: string }
}

export function Calendar({
  onEventClick,
  onGroupEventClick,
  onDateSelect,
  selectedProfessionalId,
  professionals,
  refreshKey,
}: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<CalendarEventInternal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMaterializing, setIsMaterializing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [recurringDialog, setRecurringDialog] = useState<{
    open: boolean
    info: EventDropArg | EventResizeDoneArg | null
    newStart: Date | null
    newEnd: Date | null
  }>({ open: false, info: null, newStart: null, newEnd: null })

  // Custom tooltip state - rendered outside FullCalendar DOM
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    appointment: null,
    timeText: "",
    config: statusConfig.pending,
  })
  const hideTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const fetchAppointments = useCallback(
    async (startDate: Date, endDate: Date) => {
      setIsLoading(true)
      try {
        const start = format(startDate, "yyyy-MM-dd")
        const end = format(endDate, "yyyy-MM-dd")

        const response = await api.getCalendarEvents({
          start_date: start,
          end_date: end,
          professional_id: selectedProfessionalId,
        })

        const calendarEvents: CalendarEventInternal[] = (response.data as ApiCalendarEvent[]).map(
          (evt: ApiCalendarEvent) => {
            if (evt.is_virtual) {
              // Virtual event — RRULE-calculated, not yet in database.
              // These are scheduled recurrences — not awaiting confirmation —
              // so render with a neutral "scheduled" look, not the yellow "pending" one.
              const colors = statusConfig.scheduled
              const professional = professionals.find(
                (p) => p.id === evt.professional_id
              )
              const title = evt.plan_type === "group"
                ? `${evt.title} (${evt.enrolled_count ?? 0}/${evt.capacity ?? "?"})`
                : evt.patient_name || evt.title || "Sessao"

              const profColor = professional?.color || evt.professional_color
              return {
                id: `virtual_${evt.session_plan_id}_${evt.virtual_date}`,
                title,
                start: evt.start_time,
                end: evt.end_time,
                backgroundColor: colors.bg,
                borderColor: profColor || colors.border,
                textColor: colors.text,
                extendedProps: {
                  isVirtual: true,
                  sessionPlanId: evt.session_plan_id,
                  virtualDate: evt.virtual_date,
                  professionalColor: professional?.color || evt.professional_color,
                  professionalName: professional?.name || evt.professional_name,
                  patientName: evt.patient_name,
                  planType: evt.plan_type,
                  enrolledCount: evt.enrolled_count,
                  capacity: evt.capacity,
                },
              }
            }

            // Real appointment — same as before
            const apt: Appointment = {
              id: evt.id!,
              clinic_id: "",
              patient_id: evt.patient_id || "",
              professional_id: evt.professional_id || "",
              session_plan_id: evt.session_plan_id,
              start_time: evt.start_time,
              end_time: evt.end_time,
              status: evt.status as Appointment["status"],
              type: (evt.type || "regular") as Appointment["type"],
              title: evt.title || "",
              notes: evt.notes || "",
              patient_notes: evt.patient_notes || "",
              price: evt.price || 0,
              payment_status: (evt.payment_status || "pending") as Appointment["payment_status"],
              procedures: evt.procedure_name ? [{ appointment_id: "", procedure_id: "", price: evt.price || 0, procedure: { id: "", clinic_id: "", name: evt.procedure_name, description: "", price: evt.price || 0, duration_minutes: 0, created_at: "", updated_at: "" } }] : [],
              created_at: "",
              patient: evt.patient_name ? { id: evt.patient_id || "", name: evt.patient_name, phone: "", whatsapp: "" } : undefined,
              professional: evt.professional_name ? { id: evt.professional_id || "", name: evt.professional_name, specialty: "", color: evt.professional_color || "" } : undefined,
            }

            const colors = statusConfig[apt.status] || statusConfig.pending
            const professional = professionals.find(
              (p) => p.id === apt.professional_id
            )

            return {
              id: apt.id,
              title: apt.patient?.name || apt.title || "Agendamento",
              start: apt.start_time,
              end: apt.end_time,
              backgroundColor: colors.bg,
              borderColor: professional?.color || colors.border,
              textColor: colors.text,
              extendedProps: {
                appointment: apt,
                isVirtual: false,
                sessionPlanId: evt.session_plan_id,
                planType: evt.plan_type,
                professionalColor: professional?.color,
                professionalName: professional?.name,
              },
            }
          }
        )

        setEvents(calendarEvents)
      } catch (error) {
        console.error("Error fetching appointments:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [selectedProfessionalId, professionals]
  )

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      const view = calendarApi.view
      fetchAppointments(view.activeStart, view.activeEnd)
    }
  }, [selectedProfessionalId, refreshKey, fetchAppointments])

  const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
    fetchAppointments(dateInfo.start, dateInfo.end)
  }

  const handleEventClick = async (info: EventClickArg) => {
    setTooltip((t) => ({ ...t, visible: false }))

    const { isVirtual, sessionPlanId, virtualDate, appointment, planType } = info.event.extendedProps

    // Group events: open group panel directly, no materialization needed
    if (planType === "group" && sessionPlanId && onGroupEventClick) {
      const date = virtualDate || info.event.startStr.slice(0, 10)
      onGroupEventClick(sessionPlanId, date)
      return
    }

    if (isVirtual && sessionPlanId && virtualDate) {
      // Virtual individual event: materialize first, then open
      try {
        setIsMaterializing(true)
        const result = await api.materializeAppointment(sessionPlanId, virtualDate)
        onEventClick(result as Appointment)
        // Refresh calendar to show the now-materialized event
        const calendarApi = calendarRef.current?.getApi()
        if (calendarApi) {
          const view = calendarApi.view
          fetchAppointments(view.activeStart, view.activeEnd)
        }
      } catch (error) {
        handleApiError(error, "Não foi possível abrir este agendamento")
      } finally {
        setIsMaterializing(false)
      }
      return
    }

    if (appointment) {
      // The CalendarEvent payload is lossy — it only carries the first
      // procedure's name, not the full procedures array. Fetch the real
      // appointment so the edit modal sees every linked procedure.
      const apt = appointment as Appointment
      try {
        setIsMaterializing(true)
        const full = await api.getAppointment(apt.id)
        onEventClick(full as Appointment)
      } catch (error) {
        handleApiError(error, "Não foi possível abrir este agendamento")
      } finally {
        setIsMaterializing(false)
      }
    }
  }

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    onDateSelect(selectInfo.start, selectInfo.end, selectedProfessionalId)
  }

  const performUpdate = async (id: string, start: Date | null, end: Date | null, recurrenceMode?: 'single' | 'all') => {
    if (!start) return

    try {
      setIsLoading(true)
      const durationMinutes = end 
        ? Math.round((end.getTime() - start.getTime()) / 60000)
        : 30 // default if no end

      await api.updateAppointment(id, {
        start_time: start.toISOString(),
        duration_minutes: durationMinutes,
        recurrence_mode: recurrenceMode
      })
      
      // Refresh events to show updated state (especially for recurring series)
      const calendarApi = calendarRef.current?.getApi()
      if (calendarApi) {
        const view = calendarApi.view
        fetchAppointments(view.activeStart, view.activeEnd)
      }
    } catch (error) {
      console.error("Error updating appointment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEventDrop = async (info: EventDropArg) => {
    const { isVirtual, sessionPlanId, virtualDate, appointment } = info.event.extendedProps

    if (isVirtual && sessionPlanId && virtualDate) {
      // Virtual event moved — use rescheduleOccurrence to create exception
      try {
        setIsLoading(true)
        if (info.event.start) {
          await api.rescheduleOccurrence(sessionPlanId, virtualDate, info.event.start.toISOString())
        }
        const calendarApi = calendarRef.current?.getApi()
        if (calendarApi) {
          const view = calendarApi.view
          fetchAppointments(view.activeStart, view.activeEnd)
        }
      } catch (error) {
        console.error("Error rescheduling virtual occurrence:", error)
        info.revert()
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!appointment) { info.revert(); return }

    if (appointment.type === 'recurring') {
      const newStart = info.event.start
      const newEnd = info.event.end
      info.revert()
      setRecurringDialog({ open: true, info, newStart, newEnd })
      return
    }

    await performUpdate(appointment.id, info.event.start, info.event.end)
  }

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const { isVirtual, sessionPlanId, virtualDate, appointment } = info.event.extendedProps

    if (isVirtual && sessionPlanId && virtualDate) {
      // Virtual event resized — use rescheduleOccurrence to create exception
      try {
        setIsLoading(true)
        if (info.event.start) {
          await api.rescheduleOccurrence(sessionPlanId, virtualDate, info.event.start.toISOString())
        }
        const calendarApi = calendarRef.current?.getApi()
        if (calendarApi) {
          const view = calendarApi.view
          fetchAppointments(view.activeStart, view.activeEnd)
        }
      } catch (error) {
        console.error("Error rescheduling virtual occurrence:", error)
        info.revert()
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!appointment) { info.revert(); return }

    if (appointment.type === 'recurring') {
      const newStart = info.event.start
      const newEnd = info.event.end
      info.revert()
      setRecurringDialog({ open: true, info, newStart, newEnd })
      return
    }

    await performUpdate(appointment.id, info.event.start, info.event.end)
  }

  const handleConfirmRecurring = async (mode: 'single' | 'all') => {
    if (!recurringDialog.info) return

    const { newStart, newEnd } = recurringDialog
    const info = recurringDialog.info
    const appointment = info.event.extendedProps.appointment as Appointment
    const sessionPlanId = info.event.extendedProps.sessionPlanId as string | undefined

    if (mode === 'single' && sessionPlanId && newStart) {
      // Use rescheduleOccurrence to create an exception for this single occurrence
      try {
        setIsLoading(true)
        const originalDate = format(new Date(appointment.start_time), "yyyy-MM-dd")
        await api.rescheduleOccurrence(sessionPlanId, originalDate, newStart.toISOString())
        const calendarApi = calendarRef.current?.getApi()
        if (calendarApi) {
          const view = calendarApi.view
          fetchAppointments(view.activeStart, view.activeEnd)
        }
      } catch (error) {
        console.error("Error rescheduling single occurrence:", error)
      } finally {
        setIsLoading(false)
      }
    } else if (mode === 'all' && sessionPlanId && newStart) {
      // Update the session plan's preferred time for all future occurrences
      try {
        setIsLoading(true)
        const newTime = format(newStart, "HH:mm")
        await api.updateSessionPlan(sessionPlanId, { preferred_time: newTime })
        const calendarApi = calendarRef.current?.getApi()
        if (calendarApi) {
          const view = calendarApi.view
          fetchAppointments(view.activeStart, view.activeEnd)
        }
      } catch (error) {
        console.error("Error updating session plan:", error)
      } finally {
        setIsLoading(false)
      }
    } else {
      await performUpdate(appointment.id, newStart, newEnd, mode)
    }

    setRecurringDialog({ open: false, info: null, newStart: null, newEnd: null })
  }

  // Show tooltip on mouse enter — rendered at page level with position:fixed
  const handleEventMouseEnter = useCallback((info: EventHoveringArg) => {
    if (hideTooltipTimer.current) {
      clearTimeout(hideTooltipTimer.current)
      hideTooltipTimer.current = null
    }

    const appointment = info.event.extendedProps?.appointment as Appointment | undefined
    if (!appointment) return

    const rect = (info.el as HTMLElement).getBoundingClientRect()
    const status = appointment.status || "pending"
    const config = statusConfig[status] || statusConfig.pending
    const professionalColor = info.event.extendedProps?.professionalColor as string | undefined
    const professionalName = info.event.extendedProps?.professionalName as string | undefined

    // Format time
    const start = info.event.start
    const end = info.event.end
    const timeText = start
      ? `${format(start, "HH:mm")}${end ? ` – ${format(end, "HH:mm")}` : ""}`
      : ""

    // Position tooltip to the right of the event; adjust if near right edge
    const TOOLTIP_WIDTH = 220
    const MARGIN = 8
    let x = rect.right + MARGIN
    if (x + TOOLTIP_WIDTH > window.innerWidth) {
      x = rect.left - TOOLTIP_WIDTH - MARGIN
    }
    const y = rect.top

    setTooltip({
      visible: true,
      x,
      y,
      appointment,
      professionalColor,
      professionalName,
      timeText,
      config,
    })
  }, [])

  // Hide tooltip on mouse leave (with small delay to avoid flicker)
  const handleEventMouseLeave = useCallback(() => {
    hideTooltipTimer.current = setTimeout(() => {
      setTooltip((t) => ({ ...t, visible: false }))
    }, 80)
  }, [])

  // Custom event content renderer — no Tooltip/portal here
  const renderEventContent = (eventInfo: EventContentArg) => {
    const appointment = eventInfo.event.extendedProps?.appointment as Appointment | undefined
    const isVirtual = eventInfo.event.extendedProps?.isVirtual as boolean | undefined
    const professionalColor = eventInfo.event.extendedProps?.professionalColor as string | undefined

    // Virtual events are scheduled recurrences — not pending confirmation.
    const defaultStatus = isVirtual ? "scheduled" : "pending"
    const status = appointment?.status || defaultStatus
    const config = statusConfig[status] || statusConfig[defaultStatus]

    // Calculate event duration in minutes to decide layout
    const start = eventInfo.event.start
    const end = eventInfo.event.end
    const durationMin = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 60

    // Compact: ≤30min — only patient name (inline with time)
    // Normal: >30min — status + time + patient name
    const isCompact = durationMin <= 50

    if (isCompact) {
      return (
        <div className="flex items-center h-full w-full px-1.5 overflow-hidden rounded-md cursor-pointer">
          <div className="flex items-center gap-1 min-w-0">
            {/* <span className="text-[10px] font-medium text-foreground/60 shrink-0">
              {eventInfo.timeText}
            </span> */}
            <span className="text-[11px] font-bold text-foreground truncate">
              {eventInfo.event.title}
            </span>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full w-full p-1 overflow-hidden rounded-md cursor-pointer">
        {/* Main content */}
        <div className="flex flex-col h-full gap-0.5 pl-1">
          {/* Status badge with icon */}
          <div className="flex items-center">
            <span
              className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-[8px] font-bold uppercase"
              style={{ backgroundColor: config.border, color: "#fff" }}
            >
              <StatusIcon status={status} />
              <span className="hidden sm:inline-block">{config.label}</span>
            </span>
          </div>

          {/* Time & Patient */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="text-[10px] font-bold text-foreground/70 truncate">
              {eventInfo.timeText}
            </div>

            <div className="text-[11px] font-bold text-foreground leading-tight truncate">
              {eventInfo.event.title}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Loading dialog while materializing a virtual appointment — prod backend can take seconds */}
      <Dialog open={isMaterializing} onOpenChange={(o) => !o && setIsMaterializing(false)}>
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Abrindo agendamento…</DialogTitle>
            <DialogDescription>
              Carregando os dados, isso pode levar alguns segundos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom tooltip — rendered at page root with position:fixed, always above everything */}
      {tooltip.visible && tooltip.appointment && (
        <div
          className="fixed pointer-events-none bg-card text-foreground border border-border/50 rounded-xl shadow-elevated p-3.5 min-w-[220px]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 99999,
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 border-b pb-1">
              <span className="text-xs font-bold uppercase text-muted-foreground">Detalhes da Consulta</span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: tooltip.config.bg,
                  color: tooltip.config.text,
                  border: `1px solid ${tooltip.config.border}`,
                }}
              >
                <StatusIcon status={tooltip.appointment.status || "pending"} />
                {tooltip.config.label}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-primary">{tooltip.appointment.patient?.name || tooltip.appointment.title || "Agendamento"}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{tooltip.timeText}</span>
              </div>
              {tooltip.professionalName && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-1 mt-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tooltip.professionalColor }} />
                  <span>Prof: {tooltip.professionalName}</span>
                </div>
              )}
              {(tooltip.appointment.price > 0 || tooltip.appointment.procedures?.length > 0) && (
                <div className="flex items-center justify-between gap-2 text-xs border-t pt-1 mt-1">
                  <span className="text-muted-foreground">
                    {tooltip.appointment.procedures?.[0]?.procedure?.name || "Valor"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">R$ {(tooltip.appointment.price || 0).toFixed(2)}</span>
                    {tooltip.appointment.payment_status === "paid" && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-green-100 text-green-700">Pago</span>
                    )}
                    {tooltip.appointment.payment_status === "partial" && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-100 text-amber-700">Parcial</span>
                    )}
                    {tooltip.appointment.payment_status === "pending" && tooltip.appointment.price > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-100 text-red-700">Pendente</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative h-full">
        {isLoading && events.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={isMobile ? "listWeek" : "timeGridWeek"}
          locale={ptBrLocale}
          headerToolbar={
            isMobile
              ? {
                  left: "prev,next",
                  center: "title",
                  right: "today",
                }
              : {
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                }
          }
          events={events}
          editable={!isMobile}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          eventMinHeight={isMobile ? 50 : 30}
          weekends={true}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          height="100%"
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={renderEventContent}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          nowIndicator={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "08:00",
            endTime: "18:00",
          }}
          eventClassNames="cursor-pointer"
        />
      </div>

      <Dialog open={recurringDialog.open} onOpenChange={(open) => !open && setRecurringDialog({ open: false, info: null, newStart: null, newEnd: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Agendamento Recorrente</DialogTitle>
            <DialogDescription>
              Este agendamento faz parte de uma série (Plano de Sessão). Como você deseja aplicar a alteração?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRecurringDialog({ open: false, info: null, newStart: null, newEnd: null })}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => handleConfirmRecurring('single')}>
              Apenas este
            </Button>
            <Button onClick={() => handleConfirmRecurring('all')}>
              Todos os futuros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
