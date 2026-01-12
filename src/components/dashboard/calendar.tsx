"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { EventResizeDoneArg } from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import { EventClickArg, DateSelectArg, EventDropArg, EventContentArg } from "@fullcalendar/core"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import { format } from "date-fns"
import { Check, Clock, X, UserX, CheckCircle, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import type { Appointment, Professional } from "@/types/api"

// Status configuration with colors and icons
const statusConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  pending: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E", label: "Pendente" },
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

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    appointment: Appointment
    professionalColor?: string
  }
}

interface CalendarProps {
  onEventClick: (appointment: Appointment) => void
  onDateSelect: (start: Date, end: Date, professionalId?: string) => void
  selectedProfessionalId?: string
  professionals: Professional[]
}

export function Calendar({
  onEventClick,
  onDateSelect,
  selectedProfessionalId,
  professionals,
}: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recurringDialog, setRecurringDialog] = useState<{
    open: boolean
    info: EventDropArg | EventResizeDoneArg | null
  }>({ open: false, info: null })

  const fetchAppointments = useCallback(
    async (startDate: Date, endDate: Date) => {
      setIsLoading(true)
      try {
        const start = format(startDate, "yyyy-MM-dd")
        const end = format(endDate, "yyyy-MM-dd")

        const response = await api.getAppointments({
          start_date: start,
          end_date: end,
          professional_id: selectedProfessionalId,
          per_page: 500,
        })

        const calendarEvents: CalendarEvent[] = response.data.map(
          (apt: Appointment) => {
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
              borderColor: colors.border,
              textColor: colors.text,
              extendedProps: {
                appointment: apt,
                professionalColor: professional?.color,
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
  }, [selectedProfessionalId, fetchAppointments])

  const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
    fetchAppointments(dateInfo.start, dateInfo.end)
  }

  const handleEventClick = (info: EventClickArg) => {
    const appointment = info.event.extendedProps.appointment as Appointment
    onEventClick(appointment)
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
    const appointment = info.event.extendedProps.appointment as Appointment
    
    if (appointment.type === 'recurring') {
      info.revert()
      setRecurringDialog({ open: true, info })
      return
    }

    await performUpdate(appointment.id, info.event.start, info.event.end)
  }

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const appointment = info.event.extendedProps.appointment as Appointment

    if (appointment.type === 'recurring') {
      info.revert()
      setRecurringDialog({ open: true, info })
      return
    }

    await performUpdate(appointment.id, info.event.start, info.event.end)
  }

  const handleConfirmRecurring = async (mode: 'single' | 'all') => {
    if (!recurringDialog.info) return

    const info = recurringDialog.info
    const appointment = info.event.extendedProps.appointment as Appointment
    
    // For dropped/resized events, the 'event' object in info contains the NEW values
    // even though we reverted the UI. We can use info.event.start/end.
    // Wait, if we called revert(), does info.event still hold new values?
    // FullCalendar docs say revert() reverses the visual change.
    // However, the 'info' object passed to the handler has the 'event' with new date, 
    // and 'oldEvent' with old date.
    // We should use info.event.start/end (the drop/resize destination).
    
    await performUpdate(appointment.id, info.event.start, info.event.end, mode)
    setRecurringDialog({ open: false, info: null })
  }

  // Custom event content renderer
  const renderEventContent = (eventInfo: EventContentArg) => {
    const appointment = eventInfo.event.extendedProps?.appointment as Appointment | undefined
    const professionalColor = eventInfo.event.extendedProps?.professionalColor as string | undefined

    // If no appointment data, return simple event rendering
    if (!appointment) {
      return (
        <div className="p-1 text-xs truncate">
          {eventInfo.event.title}
        </div>
      )
    }

    const status = appointment.status || "pending"
    const config = statusConfig[status] || statusConfig.pending

    // Find professional name if multiple professionals are shown
    const professionalName = appointment.professional_id
      ? professionals.find(p => p.id === appointment.professional_id)?.name
      : undefined 

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col h-full w-full p-1 relative overflow-hidden rounded-md cursor-pointer">
            {/* Professional color indicator (left border) */}
            {professionalColor && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                style={{ backgroundColor: professionalColor }}
              />
            )}

            {/* Main content */}
            <div className={cn("flex flex-col h-full gap-0.5", professionalColor ? "pl-2" : "pl-1")}>
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
        </TooltipTrigger>
        <TooltipContent side="right" className="p-3 min-w-[200px] bg-white text-foreground border shadow-lg z-[1000]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 border-b pb-1">
              <span className="text-xs font-bold uppercase text-muted-foreground">Detalhes da Consulta</span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
              >
                <StatusIcon status={status} />
                {config.label}
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-bold text-primary">{eventInfo.event.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{eventInfo.timeText}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-1 mt-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: professionalColor }} />
                <span>Prof: {professionalName}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative h-full">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="timeGridWeek"
          locale={ptBrLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
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
          nowIndicator={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "08:00",
            endTime: "18:00",
          }}
          eventClassNames="cursor-pointer"
        />
      </div>

      <Dialog open={recurringDialog.open} onOpenChange={(open) => !open && setRecurringDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Agendamento Recorrente</DialogTitle>
            <DialogDescription>
              Este agendamento faz parte de uma série (Plano de Sessão). Como você deseja aplicar a alteração?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRecurringDialog({ open: false, info: null })}>
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
    </TooltipProvider>
  )
}
