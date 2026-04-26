"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { Calendar } from "@/components/dashboard/calendar"
import { AppointmentDialog } from "@/components/dashboard/appointment-dialog"
import { GroupAttendanceDialog } from "@/components/session-plans/group-attendance-dialog"
import { Button } from "@/components/ui/button"
import { ReactSelect, SelectOption } from "@/components/ui/react-select"
import { api } from "@/lib/api/client"
import type { Appointment, Professional } from "@/types/api"

interface AgendaPageProps {
  params: Promise<{ lng: string }>
}

export default function AgendaPage({ params }: AgendaPageProps) {
  const [lng, setLng] = useState("pt-BR")
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [defaultStart, setDefaultStart] = useState<Date>()
  const [defaultEnd, setDefaultEnd] = useState<Date>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [groupAttendanceOpen, setGroupAttendanceOpen] = useState(false)
  const [groupAttendanceSessionPlanId, setGroupAttendanceSessionPlanId] = useState("")
  const [groupAttendanceDate, setGroupAttendanceDate] = useState("")
  const [groupAttendanceSlotId, setGroupAttendanceSlotId] = useState<string | undefined>(undefined)

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const response = await api.getProfessionals({ page: 1, limit: 100 })
        setProfessionals(response.data)
      } catch (error) {
        console.error("Error fetching professionals:", error)
      }
    }

    fetchProfessionals()
  }, [])

  // Convert professionals to select options
  const professionalOptions: SelectOption[] = useMemo(() => {
    return professionals.map((prof) => ({
      value: prof.id,
      label: prof.name,
      color: prof.color,
    }))
  }, [professionals])

  const selectedProfessionalOption = useMemo(() => {
    if (!selectedProfessionalId) return null
    return professionalOptions.find((opt) => opt.value === selectedProfessionalId) || null
  }, [selectedProfessionalId, professionalOptions])

  const handleEventClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDefaultStart(undefined)
    setDefaultEnd(undefined)
    setDialogOpen(true)
  }, [])

  const handleDateSelect = useCallback(
    (start: Date, end: Date, professionalId?: string) => {
      setSelectedAppointment(null)
      setDefaultStart(start)
      setDefaultEnd(end)
      if (professionalId) {
        setSelectedProfessionalId(professionalId)
      }
      setDialogOpen(true)
    },
    []
  )

  const handleNewAppointment = () => {
    setSelectedAppointment(null)
    setDefaultStart(new Date())
    setDefaultEnd(new Date(Date.now() + 30 * 60000))
    setDialogOpen(true)
  }

  const handleGroupEventClick = useCallback((sessionPlanId: string, date: string, slotId?: string) => {
    setGroupAttendanceSessionPlanId(sessionPlanId)
    setGroupAttendanceDate(date)
    setGroupAttendanceSlotId(slotId)
    setGroupAttendanceOpen(true)
  }, [])

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Agenda" tutorialPage="agenda" />

      <div className="flex-1 p-4 md:p-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="w-64" data-tutorial="professional-filter">
            <ReactSelect
              value={selectedProfessionalOption}
              onChange={(option) =>
                setSelectedProfessionalId(option?.value || undefined)
              }
              options={professionalOptions}
              placeholder="Todos os profissionais"
              isClearable
              showColorIndicator
            />
          </div>

          <Button onClick={handleNewAppointment} data-tutorial="new-appointment">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Calendar */}
        <div className="h-[calc(100vh-220px)] rounded-lg border bg-card p-4">
          <Calendar
            refreshKey={refreshKey}
            onEventClick={handleEventClick}
            onGroupEventClick={handleGroupEventClick}
            onDateSelect={handleDateSelect}
            selectedProfessionalId={selectedProfessionalId}
            professionals={professionals}
          />
        </div>
      </div>

      {/* Group Attendance Dialog */}
      <GroupAttendanceDialog
        open={groupAttendanceOpen}
        onOpenChange={setGroupAttendanceOpen}
        sessionPlanId={groupAttendanceSessionPlanId}
        sessionDate={groupAttendanceDate}
        slotId={groupAttendanceSlotId}
      />

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        defaultProfessionalId={selectedProfessionalId}
        professionals={professionals}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
