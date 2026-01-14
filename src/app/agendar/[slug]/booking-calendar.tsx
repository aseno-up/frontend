"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import { format, addDays, startOfWeek, endOfWeek } from "date-fns"
import { Loader2, Search } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4901/api/v1"

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

interface BookingCalendarProps {
  slug: string
  professionals: Professional[]
  primaryColor?: string
  durationMinutes: number
  onSlotSelect: (slot: AvailableSlot, professional: Professional) => void
}

export function BookingCalendar({
  slug,
  professionals,
  primaryColor = "#38b6ff",
  durationMinutes,
  onSlotSelect,
}: BookingCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<EventInput[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fetchingRef = useRef(false)

  const filteredProfessionals = professionals
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 20)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function fetchSlots(startDate: Date, endDate: Date, professional: Professional) {
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
            const res = await fetch(
              `${API_URL}/book/${slug}/slots?professional_id=${professional.id}&date=${dateStr}`
            )
            if (!res.ok) return []
            const data = await res.json() as SlotsResponse
            return data.slots || []
          } catch {
            return []
          }
        })
      )

      const allSlots = responses.flat()
      const newEvents: EventInput[] = allSlots.map((slot, idx) => ({
        id: `slot-${idx}-${slot.start_time}`,
        title: "Disponivel",
        start: slot.start_time,
        end: slot.end_time,
        backgroundColor: primaryColor,
        borderColor: primaryColor,
        textColor: "#ffffff",
        classNames: ["cursor-pointer", "hover:opacity-80", "transition-opacity"],
        extendedProps: { slot },
      }))

      setEvents(newEvents)

      // Use calendar API to add events directly after a small delay
      setTimeout(() => {
        const calendarApi = calendarRef.current?.getApi()
        if (calendarApi) {
          calendarApi.removeAllEvents()
          newEvents.forEach(event => calendarApi.addEvent(event))
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

  // Fetch when professional changes
  useEffect(() => {
    if (selectedProfessional) {
      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
      fetchSlots(weekStart, weekEnd, selectedProfessional)
    } else {
      setEvents([])
    }
  }, [selectedProfessional])

  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    if (selectedProfessional && !fetchingRef.current) {
      fetchSlots(dateInfo.start, dateInfo.end, selectedProfessional)
    }
  }, [selectedProfessional, slug, primaryColor])

  const handleEventClick = useCallback((info: EventClickArg) => {
    if (!selectedProfessional) return
    const slot = info.event.extendedProps.slot as AvailableSlot
    onSlotSelect(slot, selectedProfessional)
  }, [selectedProfessional, onSlotSelect])

  const handleSelectProfessional = (prof: Professional) => {
    setSelectedProfessional(prof)
    setIsDropdownOpen(false)
    setSearchQuery("")
    setEvents([])
    fetchingRef.current = false
  }

  return (
    <div className="flex flex-col h-full">
      {/* Professional Select */}
      <div className="mb-4" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Profissional
        </label>
        <div className="relative">
          <div
            className="w-full flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors bg-white"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedProfessional ? (
              <>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ backgroundColor: selectedProfessional.color || "#6366f1" }}
                >
                  {selectedProfessional.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedProfessional.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedProfessional.specialty}</p>
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">Selecione um profissional...</span>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-hidden">
              <div className="p-2 border-b sticky top-0 bg-white">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar profissional..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-48">
                {filteredProfessionals.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground text-center">
                    Nenhum profissional encontrado
                  </p>
                ) : (
                  filteredProfessionals.map((prof) => (
                    <button
                      key={prof.id}
                      onClick={() => handleSelectProfessional(prof)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                        style={{ backgroundColor: prof.color || "#6366f1" }}
                      >
                        {prof.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{prof.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{prof.specialty}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {selectedProfessional && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: primaryColor }}
            />
            <span>Horario disponivel - clique para agendar</span>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="booking-calendar relative bg-white rounded-lg border overflow-y-auto flex-1" style={{ maxHeight: "calc(100vh - 280px)", minHeight: "400px" }}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
          </div>
        )}

        {!selectedProfessional ? (
          <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium mb-1">Selecione um profissional</p>
              <p className="text-sm">para ver os horarios disponiveis</p>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}
