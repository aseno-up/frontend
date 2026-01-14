import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Agendamento Online",
  description: "Agende sua consulta online",
}

export default function AgendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
