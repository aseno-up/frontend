"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth-store"
import { showToast, handleApiError } from "@/lib/toast"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { FacebookPixel } from "@/components/facebook-pixel"

const registerSchema = z.object({
  clinic_name: z.string().min(2, "Nome da clinica deve ter no minimo 2 caracteres"),
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
  confirmPassword: z.string(),
  document: z.string().optional(),
  phone: z.string().optional(),
  acceptTerms: z.literal(true, {
    error: "Voce deve aceitar os termos de uso e politica de privacidade",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas nao conferem",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterPageProps {
  params: Promise<{ lng: string }>
}

export default function RegisterPage({ params }: RegisterPageProps) {
  return (
    <>
      <FacebookPixel />
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

function RegisterContent({ params }: RegisterPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register: registerUser, googleLogin } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Capture plan and billing from URL (normalize both legacy 'monthly|annually' and landing 'MONTHLY|YEARLY')
  const selectedPlan = searchParams.get('plan') as 'trial' | 'basic' | 'professional' | 'advanced' | null
  const rawBilling = searchParams.get('billing')
  const selectedBilling: 'monthly' | 'annually' | null =
    rawBilling === 'YEARLY' || rawBilling === 'annually' ? 'annually'
    : rawBilling === 'MONTHLY' || rawBilling === 'monthly' ? 'monthly'
    : null
  const unitsParam = parseInt(searchParams.get('units') || '', 10)
  const selectedUnits = Number.isNaN(unitsParam) ? undefined : Math.max(2, unitsParam)
  const selectedVariant: 'solo' | 'clinic' = searchParams.get('variant') === 'solo' ? 'solo' : 'clinic'

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const termsAccepted = watch("acceptTerms")

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)

    try {
      await registerUser({
        clinic_name: data.clinic_name,
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        document: data.document,
        plan: selectedPlan || undefined,
        billing: selectedBilling || undefined,
        variant: selectedVariant === 'solo' ? 'solo' : undefined,
      })

      // Store selected plan and billing for later use
      if (selectedPlan && selectedBilling) {
        localStorage.setItem('pending_subscription', JSON.stringify({
          plan: selectedPlan,
          billing: selectedBilling
        }))
      }

      const { lng } = await params
      showToast.success("Conta criada com sucesso!")

      // If user selected a paid plan (anything except trial), redirect to billing setup
      if (selectedPlan && selectedPlan !== 'trial') {
        {
          const params = new URLSearchParams()
          params.set('plan', selectedPlan)
          params.set('billing', selectedBilling === 'annually' ? 'YEARLY' : 'MONTHLY')
          if (selectedVariant === 'solo') params.set('variant', 'solo')
          if (selectedPlan === 'advanced' && selectedUnits) params.set('units', String(selectedUnits))
          router.push(`/${lng}/billing-setup?${params.toString()}`)
        }
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
      const { lng } = await params
      showToast.success("Login com Google realizado com sucesso!")

      // Redirect to billing-setup for paid plans, otherwise to agenda
      if (selectedPlan && selectedPlan !== "trial") {
        {
          const params = new URLSearchParams()
          params.set('plan', selectedPlan)
          params.set('billing', selectedBilling === 'annually' ? 'YEARLY' : 'MONTHLY')
          if (selectedVariant === 'solo') params.set('variant', 'solo')
          if (selectedPlan === 'advanced' && selectedUnits) params.set('units', String(selectedUnits))
          router.push(`/${lng}/billing-setup?${params.toString()}`)
        }
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

  const planNames = {
    trial: 'Trial (14 dias grátis)',
    basic: 'Básico',
    professional: 'Profissional',
    advanced: 'Avançado'
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {selectedPlan && selectedPlan !== 'trial' ? 'Criar conta e assinar' : 'Criar conta'}
        </CardTitle>
        <CardDescription>
          {selectedPlan && selectedPlan !== 'trial'
            ? 'Preencha seus dados para ativar seu plano'
            : 'Comece seu teste gratuito de 14 dias'}
        </CardDescription>
        {selectedPlan && selectedPlan !== 'trial' && (
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Plano selecionado:</span>
            <Badge variant="secondary">
              {planNames[selectedPlan]} {selectedBilling === 'annually' && '(Anual)'}
            </Badge>
            {selectedVariant === 'solo' && (
              <Badge variant="outline">Autônomo</Badge>
            )}
          </div>
        )}
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinic_name">Nome da Clinica</Label>
            <Input
              id="clinic_name"
              type="text"
              placeholder="Clinica Exemplo"
              {...register("clinic_name")}
              disabled={isLoading}
            />
            {errors.clinic_name && (
              <p className="text-sm text-destructive">{errors.clinic_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Seu Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Joao Silva"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              {...register("phone")}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {selectedPlan && selectedPlan !== 'trial' && (
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

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="******"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="******"
              {...register("confirmPassword")}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptTerms"
              disabled={isLoading}
              onCheckedChange={(checked) => {
                setValue("acceptTerms", (checked === true) as true)
              }}
            />
            <label
              htmlFor="acceptTerms"
              className="text-sm text-muted-foreground leading-snug cursor-pointer"
            >
              Li e aceito os{" "}
              <Link href="/termos" target="_blank" className="text-primary hover:underline">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" target="_blank" className="text-primary hover:underline">
                Politica de Privacidade
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Conta
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou cadastre-se com
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center w-full gap-2">
            {isGoogleLoading ? (
              <div className="flex items-center justify-center h-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !termsAccepted ? (
              <p className="text-xs text-muted-foreground text-center">
                Aceite os termos acima para cadastrar com Google
              </p>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
                width="280"
              />
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Ja tem uma conta?{" "}
            <Link href="login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
