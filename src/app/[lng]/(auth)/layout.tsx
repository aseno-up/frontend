interface AuthLayoutProps {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { lng } = await params

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Aseno. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
