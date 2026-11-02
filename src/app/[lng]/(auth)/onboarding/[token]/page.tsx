'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Eye, EyeOff, Calendar, Bell, BarChart3, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { showToast, handleApiError } from '@/lib/toast'
import { gtagEvent } from '@/lib/gtag'
import { trackCompleteRegistration } from '@/lib/meta-pixel'
import { api } from '@/lib/api/client'

interface PageProps {
  params: Promise<{ lng: string; token: string }>
}

interface TokenInfo {
  email: string
  name: string
  whatsapp: string
  expires_at: string
}

type State =
  | { kind: 'loading' }
  | { kind: 'invalid'; message: string }
  | { kind: 'ready'; info: TokenInfo }

const features = [
  { icon: Calendar, title: 'Agendamento online 24h', description: 'Pacientes agendam sem precisar ligar' },
  { icon: Bell, title: 'Confirmações automáticas', description: 'Lembretes por WhatsApp reduzem faltas' },
  { icon: BarChart3, title: 'Controle financeiro', description: 'Receitas e inadimplência em tempo real' },
  { icon: FileText, title: 'Prontuário do paciente', description: 'Evoluções, anexos e histórico no celular' },
]

export default function OnboardingTokenPage({ params }: PageProps) {
  const { lng, token } = use(params)
  const router = useRouter()
  const { setUser } = useAuthStore()
  const getCurrentUserId = () => useAuthStore.getState().user?.id

  const [state, setState] = useState<State>({ kind: 'loading' })
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
    fetch(`${baseUrl}/api/v1/onboarding-tokens/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          setState({ kind: 'invalid', message: body?.error || 'Este link expirou ou já foi utilizado.' })
          return
        }
        const info: TokenInfo = await res.json()
        setState({ kind: 'ready', info })
        // Intentionally do NOT pre-fill the name field. The token stores a
        // best-effort fallback (e-mail local part) but that's not a real name
        // and looks like a bug to the user — let them type it fresh.
      })
      .catch(() => {
        setState({ kind: 'invalid', message: 'Não foi possível validar o link. Tente novamente em instantes.' })
      })
  // The token is provided by the URL and never changes on this page; we
  // intentionally run this once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state.kind !== 'ready') return
    if (name.trim().length < 2) { showToast.error('Informe seu nome completo'); return }
    if (password.length < 8) { showToast.error('Senha precisa ter pelo menos 8 caracteres'); return }

    setSubmitting(true)
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
      const res = await fetch(`${baseUrl}/api/v1/onboarding-tokens/${encodeURIComponent(token)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          password,
          clinic_name: clinicName.trim(),
          phone: state.info.whatsapp,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Não foi possível concluir o cadastro')
      }
      const auth = await res.json()
      // setTokens is a no-op (HttpOnly cookies) but kept for symmetry with login/register flows.
      api.setTokens(auth.access_token, auth.refresh_token)
      setUser(auth.user, auth.clinic)

      gtagEvent('sign_up', { method: 'magic_link', plan: 'trial' })
      trackCompleteRegistration({
        plan: 'trial',
        billingCycle: 'monthly',
        method: 'magic_link',
        userData: { email: state.info.email, externalId: getCurrentUserId() },
      })

      showToast.success('Conta criada! Bem-vindo ao Aseno.')
      router.push(`/${lng}/agenda`)
    } catch (err) {
      handleApiError(err, 'Não foi possível concluir o cadastro')
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl border bg-card shadow-xl">
        {/* Marketing panel */}
        <aside className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary to-primary/80 p-10 text-primary-foreground">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="relative h-10 w-32">
                <Image
                  src="/logo-horizontal.png"
                  alt="Aseno"
                  fill
                  className="object-contain object-left brightness-0 invert"
                  priority
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold leading-tight mb-8">
              Seu teste de 14 dias começa agora.
            </h2>
            <ul className="space-y-5">
              {features.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{title}</p>
                    <p className="text-sm text-primary-foreground/80 leading-snug">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-10 text-xs text-primary-foreground/70 border-t border-primary-foreground/20 pt-6">
            Sem cartão de crédito. Cancela quando quiser.
          </p>
        </aside>

        {/* Form panel */}
        <section className="p-8 md:p-10">
          {state.kind === 'loading' && (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          )}

          {state.kind === 'invalid' && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Link inválido</h1>
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <p className="text-sm text-muted-foreground">
                Volte pra <Link className="text-primary hover:underline" href={`/${lng}`}>página inicial</Link> e
                solicite um novo link.
              </p>
            </div>
          )}

          {state.kind === 'ready' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Finalize sua conta</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  E-mail <span className="font-medium text-foreground">{state.info.email}</span> já está verificado.
                  Falta só nome, senha e o nome da sua clínica.
                </p>
              </div>

              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="ob-name">Seu nome completo</Label>
                  <Input
                    id="ob-name"
                    type="text"
                    placeholder="Maria Souza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    disabled={submitting}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="ob-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="pr-10"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-clinic">Nome da clínica</Label>
                  <Input
                    id="ob-clinic"
                    type="text"
                    placeholder="Clínica Bem-Estar"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    autoComplete="organization"
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode renomear depois nas configurações.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Começar meus 14 dias grátis
                </Button>

                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Ao criar a conta, você aceita os{' '}
                  <Link href={`/${lng}/termos`} target="_blank" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link href={`/${lng}/privacidade`} target="_blank" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>.
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
