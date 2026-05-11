"use client"

import { useState, Suspense } from "react"
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
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  document: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas nao conferem",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterPageProps {
  params: Promise<{ lng: string }>
}

function deriveNamesFromEmail(email: string): { name: string; clinic_name: string } {
  const local = (email.split("@")[0] || "").toLowerCase()
  const cleaned = local.replace(/[._+\-0-9]+/g, " ").trim()
  const titled = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 100)
  const fallback = "Minha clinica"
  return {
    name: titled.length >= 2 ? titled : fallback,
    clinic_name: titled.length >= 2 ? titled : fallback,
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

function RegisterContent({ params }: RegisterPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register: registerUser, googleLogin } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)

    try {
      const { name, clinic_name } = deriveNamesFromEmail(data.email)

      await registerUser({
        clinic_name,
        name,
        email: data.email,
        password: data.password,
        phone: data.phone,
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@clinica.com"
                autoComplete="email"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
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
                  disabled={isLoading}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="repita a senha"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                {...register("phone")}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {isPaidPlan && (
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
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPaidPlan ? 'Criar conta e continuar' : 'Criar conta grátis'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

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
