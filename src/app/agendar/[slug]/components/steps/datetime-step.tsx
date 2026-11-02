"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import { format, addDays } from "date-fns"
import { Loader2 } from "lucide-react"
import { fetchSlots } from "../../api"
import type { AvailableSlot } from "../../api"

export function DateTimeStep({
  slug,
  professionalId,
  procedureId,
  durationMinutes,
  brandColor = "#0891b2",
  onSelect,
}: {
  slug: string
  professionalId: string
  procedureId?: string
  durationMinutes: number
  brandColor?: string
  onSelect: (slot: AvailableSlot) => void
}) {
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<EventInput[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fetchingRef = useRef(false)

  async function loadSlots(startDate: Date, endDate: Date) {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setIsLoading(true)

    try {
      const dates: Date[] = []
      let currentDate = new Date(startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      while (currentDate <= endDate) {
        if (currentDate >= today) {
          dates.push(new Date(currentDate))
        }
        currentDate = addDays(currentDate, 1)
      }

      const responses = await Promise.all(
        dates.map(async (date) => {
          const dateStr = format(date, "yyyy-MM-dd")
          try {
            const data = await fetchSlots(slug, professionalId, dateStr, procedureId)
            return data.slots || []
          } catch {
            return []
          }
        })
      )

      const allSlots = responses.flat()
      const newEvents: EventInput[] = allSlots.map((slot, idx) => ({
        id: `slot-${idx}-${slot.start_time}`,
        title: "Disponível",
        start: slot.start_time,
        end: slot.end_time,
        backgroundColor: brandColor,
        borderColor: brandColor,
        textColor: "#ffffff",
        classNames: ["cursor-pointer", "hover:opacity-80", "transition-opacity"],
        extendedProps: { slot },
      }))

      setEvents(newEvents)

      setTimeout(() => {
        const calendarApi = calendarRef.current?.getApi()
        if (calendarApi) {
          calendarApi.removeAllEvents()
          newEvents.forEach((event) => calendarApi.addEvent(event))
        }
      }, 100)
    } catch (error) {
      console.error("Error fetching slots:", error)
      setEvents([])
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    loadSlots(weekStart, weekEnd)
  }, [professionalId, procedureId])

  const handleDatesSet = useCallback(
    (dateInfo: DatesSetArg) => {
      if (!fetchingRef.current) {
        loadSlots(dateInfo.start, dateInfo.end)
      }
    },
    [professionalId, procedureId, slug, brandColor]
  )

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const slot = info.event.extendedProps.slot as AvailableSlot
      onSelect(slot)
    },
    [onSelect]
  )

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Data e horário</h2>
      <p className="text-sm text-slate-500 mb-4">
        Clique em um horário disponível para agendar ({durationMinutes} min)
      </p>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: brandColor }} />
          <span>Horário disponível - clique para agendar</span>
        </div>
      </div>

      {/* Calendar */}
      <div
        className="booking-calendar relative rounded-lg border overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 350px)", minHeight: "400px" }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={ptBrLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay",
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
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          nowIndicator={true}
        />
      </div>
    </div>
  )
}
