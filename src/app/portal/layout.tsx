import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Portal do Paciente",
  description: "Gerencie seus agendamentos online",
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1">{children}</div>
      <div className="py-4 text-center text-xs text-slate-400">
        Agendamento online por <strong className="text-cyan-600 font-semibold">aseno</strong>
      </div>
    </div>
  )
}
