import { MicrosoftClarity } from '@/components/microsoft-clarity'

interface AuthLayoutProps {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { lng } = await params
  void lng

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Clarity also runs here so register + magic-link /onboarding screens get
          heatmaps + session recordings. Pixel/GA/Ads stay scoped to /register
          (which has its own conversion-tracking init); other auth screens like
          /login don't need conversion pixels. */}
      <MicrosoftClarity projectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? ''} />

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
