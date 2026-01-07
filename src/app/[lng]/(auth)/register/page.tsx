"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

const registerSchema = z.object({
  clinic_name: z.string().min(2, "Nome da clinica deve ter no minimo 2 caracteres"),
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas nao conferem",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterPageProps {
  params: Promise<{ lng: string }>
}

export default function RegisterPage({ params }: RegisterPageProps) {
  const router = useRouter()
  const { register: registerUser, googleLogin } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

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
      await registerUser({
        clinic_name: data.clinic_name,
        name: data.name,
        email: data.email,
        password: data.password,
      })
      const { lng } = await params
      showToast.success("Conta criada com sucesso!")
      router.push(`/${lng}/agenda`)
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
      await googleLogin(credentialResponse.credential)
      const { lng } = await params
      showToast.success("Login com Google realizado com sucesso!")
      router.push(`/${lng}/agenda`)
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
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
        <CardDescription>
          Comece seu teste gratuito de 14 dias
        </CardDescription>
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

          <div className="flex justify-center w-full">
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
