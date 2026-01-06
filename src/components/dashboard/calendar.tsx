"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import { EventClickArg, DateSelectArg, EventDropArg, EventContentArg } from "@fullcalendar/core"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import { format } from "date-fns"
import { Check, Clock, X, UserX, CheckCircle, RefreshCw } from "lucide-react"

import { api } from "@/lib/api/client"
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

  const handleEventDrop = async (info: EventDropArg) => {
    const appointment = info.event.extendedProps.appointment as Appointment

    try {
      await api.updateAppointment(appointment.id, {
        start_time: info.event.start?.toISOString(),
        duration_minutes: Math.round(
          ((info.event.end?.getTime() || 0) -
            (info.event.start?.getTime() || 0)) /
            60000
        ),
      })
    } catch (error) {
      console.error("Error updating appointment:", error)
      info.revert()
    }
  }

  // Custom event content renderer
  const renderEventContent = (eventInfo: EventContentArg) => {
    const appointment = eventInfo.event.extendedProps.appointment as Appointment
    const professionalColor = eventInfo.event.extendedProps.professionalColor as string | undefined
    const status = appointment?.status || "pending"
    const config = statusConfig[status] || statusConfig.pending

    return (
      <div className="flex flex-col h-full w-full overflow-hidden p-1 relative">
        {/* Professional color indicator (left border) */}
        {professionalColor && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
            style={{ backgroundColor: professionalColor }}
          />
        )}

        {/* Main content */}
        <div className={professionalColor ? "pl-2" : ""}>
          {/* Status badge with icon */}
          <div className="flex items-center gap-1 mb-0.5">
            <span
              className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: config.border, color: "#fff" }}
            >
              <StatusIcon status={status} />
              <span className="hidden sm:inline">{config.label}</span>
            </span>
          </div>

          {/* Time */}
          <div className="text-[10px] font-medium opacity-75">
            {eventInfo.timeText}
          </div>

          {/* Patient name */}
          <div className="text-xs font-semibold truncate">
            {eventInfo.event.title}
          </div>
        </div>
      </div>
    )
  }

  return (
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
  )
}
