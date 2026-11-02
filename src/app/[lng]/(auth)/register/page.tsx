"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Eye, EyeOff, Calendar, Bell, BarChart3, FileText } from "lucide-react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth-store"
import { showToast, handleApiError } from "@/lib/toast"
import { FacebookPixel } from "@/components/facebook-pixel"
import { GoogleAnalytics } from "@/components/google-analytics"
import { GoogleAdsTag } from "@/components/google-ads-tag"
import { gtagEvent } from "@/lib/gtag"
import { trackCompleteRegistration, type PlanKey } from "@/lib/meta-pixel"

const registerSchema = z.object({
  clinic_name: z.string().trim().min(2, "Informe o nome da clínica"),
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
  document: z.string().optional(),
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterPageProps {
  params: Promise<{ lng: string }>
}

function deriveUserNameFromEmail(email: string): string {
  const local = (email.split("@")[0] || "").toLowerCase()
  const cleaned = local.replace(/[._+\-0-9]+/g, " ").trim()
  const titled = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 100)
  return titled.length >= 2 ? titled : "Usuário"
}

const BASIC_PRICE_CACHE_KEY = "basic_plan_price_v3_solo_publicconfig"
const BASIC_PRICE_CACHE_TTL_MS = 24 * 60 * 60 * 1000

type CachedPrice = { price: number; ts: number }

function readCachedBasicPrice(): number | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(BASIC_PRICE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedPrice
    if (typeof parsed.price !== "number" || typeof parsed.ts !== "number") return null
    if (Date.now() - parsed.ts > BASIC_PRICE_CACHE_TTL_MS) return null
    return parsed.price
  } catch {
    return null
  }
}

function writeCachedBasicPrice(price: number) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      BASIC_PRICE_CACHE_KEY,
      JSON.stringify({ price, ts: Date.now() } satisfies CachedPrice),
    )
  } catch {
    // ignore
  }
}

export default function RegisterPage({ params }: RegisterPageProps) {
  return (
    <>
      <FacebookPixel />
      <GoogleAnalytics measurementId="G-PQNQJQ3BVH" />
      <GoogleAdsTag conversionId="AW-758071096" />
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <RegisterContent params={params} />
      </Suspense>
    </>
  )
}

const planNames: Record<'trial' | 'basic' | 'professional' | 'advanced', string> = {
  trial: 'Trial (14 dias grátis)',
  basic: 'Básico',
  professional: 'Profissional',
  advanced: 'Avançado',
}

const features = [
  {
    icon: Calendar,
    title: "Agendamento online 24h",
    description: "Pacientes agendam sem precisar ligar",
  },
  {
    icon: Bell,
    title: "Confirmações automáticas",
    description: "Reduza faltas com lembretes por WhatsApp",
  },
  {
    icon: BarChart3,
    title: "Controle financeiro completo",
    description: "Receitas, repasses e inadimplência em tempo real",
  },
  {
    icon: FileText,
    title: "Prontuário e histórico do paciente",
    description: "Evoluções, fotos e documentos organizados",
  },
]

const categories = ["Fisioterapia", "Estética", "Pilates", "Nutrição", "Psicologia"]

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Decode the JWT payload from Google's credential response. The id_token is
// RFC 7515 base64url-encoded `header.payload.signature`; we only need the
// payload's `email` field for CAPI match quality, never trust it for auth.
function decodeGoogleEmail(credential: string): string | undefined {
  try {
    const parts = credential.split('.')
    if (parts.length < 2) return undefined
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '==='.slice((base64.length + 3) % 4)
    const payload = JSON.parse(atob(padded)) as { email?: string }
    return payload.email
  } catch {
    return undefined
  }
}

// Lightweight email check. Matches the server-side `binding:"email"` validator
// well enough to drive progressive-disclosure UX — the form still re-runs the
// full Zod check on submit.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function looksLikeEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim())
}

function RegisterContent({ params }: RegisterPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register: registerUser, googleLogin } = useAuthStore()
  const getCurrentUserId = () => useAuthStore.getState().user?.id
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [basicPrice, setBasicPrice] = useState<number | null>(null)
  const [emailRevealed, setEmailRevealed] = useState(false)

  const selectedPlan = searchParams.get('plan') as 'trial' | 'basic' | 'professional' | 'advanced' | null
  const rawBilling = searchParams.get('billing')
  const selectedBilling: 'monthly' | 'annually' | null =
    rawBilling === 'YEARLY' || rawBilling === 'annually' ? 'annually'
    : rawBilling === 'MONTHLY' || rawBilling === 'monthly' ? 'monthly'
    : null
  const unitsParam = parseInt(searchParams.get('units') || '', 10)
  const selectedUnits = Number.isNaN(unitsParam) ? undefined : Math.max(2, unitsParam)
  const selectedVariant: 'solo' | 'clinic' = searchParams.get('variant') === 'solo' ? 'solo' : 'clinic'

  const isPaidPlan = !!selectedPlan && selectedPlan !== 'trial'

  useEffect(() => {
    if (isPaidPlan) return
    const cached = readCachedBasicPrice()
    if (cached !== null) {
      setBasicPrice(cached)
      return
    }
    let cancelled = false
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
    fetch(`${baseUrl}/api/v1/public/config`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { plans?: { basic?: { solo_price_monthly?: number; price_monthly?: number } } } | null) => {
        if (cancelled || !data) return
        const basic = data.plans?.basic
        // Prioriza preço solo (1 profissional), que é o que aparece em /autonomos#precos
        const solo = basic?.solo_price_monthly
        const standard = basic?.price_monthly
        const price = (typeof solo === 'number' && solo > 0)
          ? solo
          : (typeof standard === 'number' && standard > 0 ? standard : null)
        if (price !== null) {
          setBasicPrice(price)
          writeCachedBasicPrice(price)
        }
      })
      .catch(() => {
        // silenciar — header cai pra mensagem sem preço
      })
    return () => {
      cancelled = true
    }
  }, [isPaidPlan])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const emailValue = watch('email') || ''
  const emailLooksValid = looksLikeEmail(emailValue)
  const shouldShowMoreFields = emailRevealed || emailLooksValid

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)

    try {
      const userName = deriveUserNameFromEmail(data.email)

      await registerUser({
        clinic_name: data.clinic_name.trim(),
        name: userName,
        email: data.email,
        password: data.password,
        document: data.document,
        plan: selectedPlan || undefined,
        billing: selectedBilling || undefined,
        variant: selectedVariant === 'solo' ? 'solo' : undefined,
      })

      gtagEvent('sign_up', {
        method: 'email',
        plan: selectedPlan || 'trial',
        billing: selectedBilling || undefined,
      })
      trackCompleteRegistration({
        plan: (selectedPlan || 'trial') as PlanKey,
        billingCycle: selectedBilling || 'monthly',
        variant: selectedVariant,
        units: selectedUnits,
        method: 'email',
        userData: { email: data.email, externalId: getCurrentUserId() },
      })

      if (selectedPlan && selectedBilling) {
        localStorage.setItem('pending_subscription', JSON.stringify({
          plan: selectedPlan,
          billing: selectedBilling,
        }))
      }

      const { lng } = await params
      showToast.success("Conta criada com sucesso!")

      if (isPaidPlan && selectedPlan) {
        const qp = new URLSearchParams()
        qp.set('plan', selectedPlan)
        qp.set('billing', selectedBilling === 'annually' ? 'YEARLY' : 'MONTHLY')
        if (selectedVariant === 'solo') qp.set('variant', 'solo')
        if (selectedPlan === 'advanced' && selectedUnits) qp.set('units', String(selectedUnits))
        router.push(`/${lng}/billing-setup?${qp.toString()}`)
      } else {
        router.push(`/${lng}/agenda`)
      }
    } catch (err) {
      handleApiError(err, "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      showToast.error("Erro ao obter credenciais do Google")
      return
    }

    setIsGoogleLoading(true)

    try {
      await googleLogin(
        credentialResponse.credential,
        selectedPlan || undefined,
        selectedBilling || undefined
      )

      gtagEvent('sign_up', {
        method: 'google',
        plan: selectedPlan || 'trial',
        billing: selectedBilling || undefined,
      })
      trackCompleteRegistration({
        plan: (selectedPlan || 'trial') as PlanKey,
        billingCycle: selectedBilling || 'monthly',
        variant: selectedVariant,
        units: selectedUnits,
        method: 'google',
        userData: {
          email: decodeGoogleEmail(credentialResponse.credential),
          externalId: getCurrentUserId(),
        },
      })

      const { lng } = await params
      showToast.success("Login com Google realizado com sucesso!")

      if (isPaidPlan && selectedPlan) {
        const qp = new URLSearchParams()
        qp.set('plan', selectedPlan)
        qp.set('billing', selectedBilling === 'annually' ? 'YEARLY' : 'MONTHLY')
        if (selectedVariant === 'solo') qp.set('variant', 'solo')
        if (selectedPlan === 'advanced' && selectedUnits) qp.set('units', String(selectedUnits))
        router.push(`/${lng}/billing-setup?${qp.toString()}`)
      } else {
        router.push(`/${lng}/agenda`)
      }
    } catch (err) {
      handleApiError(err, "Erro ao cadastrar com Google")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    showToast.error("Erro ao conectar com Google")
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
              Tudo que sua clínica precisa em um só lugar
            </h2>

            <ul className="space-y-5">
              {features.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{title}</p>
                    <p className="text-sm text-primary-foreground/80 leading-snug">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 border-t border-primary-foreground/20 pt-6">
            <p className="text-xs uppercase tracking-wider text-primary-foreground/70 mb-3">
              Usado por clínicas de
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-primary-foreground/10 px-3 py-1 text-xs"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <section className="p-8 md:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {isPaidPlan ? 'Criar conta e assinar' : 'Criar conta'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isPaidPlan
                ? 'Preencha seus dados para ativar seu plano'
                : 'Teste grátis por 14 dias. Sem cartão.'}
            </p>
            {!isPaidPlan && (
              <p className="text-xs text-muted-foreground mt-1">
                {basicPrice !== null
                  ? <>Depois do período, a partir de <span className="font-medium text-foreground">{formatBRL(basicPrice)}/mês</span>. <Link href="/autonomos#precos" target="_blank" className="text-primary hover:underline">Ver planos</Link></>
                  : <Link href="/autonomos#precos" target="_blank" className="text-primary hover:underline">Ver planos e preços</Link>}
              </p>
            )}
            {isPaidPlan && selectedPlan && (
              <div className="flex items-center gap-2 pt-3 flex-wrap">
                <span className="text-sm text-muted-foreground">Plano selecionado:</span>
                <Badge variant="secondary">
                  {planNames[selectedPlan]} {selectedBilling === 'annually' && '(Anual)'}
                </Badge>
                {selectedVariant === 'solo' && (
                  <Badge variant="outline">Autônomo</Badge>
                )}
              </div>
            )}
          </div>

          {/* Google OAuth — primary path */}
          <div className="mb-5">
            <div className="flex justify-center">
              {isGoogleLoading ? (
                <div className="flex items-center justify-center h-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="280"
                />
              )}
            </div>

            <div className="relative mt-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou com email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@clinica.com"
                autoComplete="email"
                {...register("email")}
                onBlur={() => { if (emailLooksValid) setEmailRevealed(true) }}
                disabled={isLoading}
                autoFocus
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div
              className={`grid transition-all duration-300 ease-out ${
                shouldShowMoreFields
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
              aria-hidden={!shouldShowMoreFields}
            >
              <div className="overflow-hidden space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic_name">Nome da clínica</Label>
                  <Input
                    id="clinic_name"
                    type="text"
                    placeholder="Clínica Bem-Estar"
                    autoComplete="organization"
                    {...register("clinic_name")}
                    disabled={isLoading || !shouldShowMoreFields}
                    tabIndex={shouldShowMoreFields ? 0 : -1}
                  />
                  {errors.clinic_name && (
                    <p className="text-sm text-destructive">{errors.clinic_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="mínimo 8 caracteres"
                      autoComplete="new-password"
                      className="pr-10"
                      {...register("password")}
                      disabled={isLoading || !shouldShowMoreFields}
                      tabIndex={shouldShowMoreFields ? 0 : -1}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </div>
            </div>

            {isPaidPlan && shouldShowMoreFields && (
              <div className="space-y-2">
                <Label htmlFor="document">CPF ou CNPJ</Label>
                <Input
                  id="document"
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  {...register("document")}
                  disabled={isLoading}
                />
                {errors.document && (
                  <p className="text-sm text-destructive">{errors.document.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Necessário para gerar cobranças e notas fiscais
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isGoogleLoading || !shouldShowMoreFields}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPaidPlan ? 'Criar conta e continuar' : 'Criar conta grátis'}
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Ao criar conta, você concorda com os{" "}
              <Link href="/termos" target="_blank" className="text-primary hover:underline">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" target="_blank" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
            </p>

            <p className="text-sm text-muted-foreground text-center">
              Já tem conta?{" "}
              <Link href="login" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}
