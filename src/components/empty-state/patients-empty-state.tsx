import { Users } from "lucide-react"
import { EmptyState } from "./empty-state"

interface PatientsEmptyStateProps {
  onAddPatient: () => void
}

export function PatientsEmptyState({ onAddPatient }: PatientsEmptyStateProps) {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum paciente cadastrado"
      description="Comece adicionando seus primeiros pacientes para gerenciar seus atendimentos de forma organizada."
      action={{
        label: "Adicionar Primeiro Paciente",
        onClick: onAddPatient,
      }}
    />
  )
}
