import { Calendar } from "lucide-react"
import { EmptyState } from "./empty-state"

interface AppointmentsEmptyStateProps {
  onAddAppointment: () => void
}

export function AppointmentsEmptyState({
  onAddAppointment,
}: AppointmentsEmptyStateProps) {
  return (
    <EmptyState
      icon={Calendar}
      title="Nenhum agendamento"
      description="Sua agenda está vazia. Crie seu primeiro agendamento para começar a organizar seus atendimentos."
      action={{
        label: "Criar Primeiro Agendamento",
        onClick: onAddAppointment,
      }}
    />
  )
}
