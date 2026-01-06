import { Calendar } from "lucide-react"
import Link from "next/link"

interface AuthLayoutProps {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { lng } = await params

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="flex h-16 items-center px-4 md:px-6">
        <Link href={`/${lng}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">AgendaClinica</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AgendaClinica. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
