"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginPageProps {
  params: Promise<{ lng: string }>
}

export default function LoginPage({ params }: LoginPageProps) {
  const router = useRouter()
  const { login, googleLogin } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.getCurrentUser()
        const { lng } = await params
        router.push(`/${lng}/agenda`)
      } catch {
        // Not authenticated, stay on login page
      }
    }
    checkAuth()
  }, [params, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await login(data.email, data.password)
      const { lng } = await params
      router.push(`/${lng}/agenda`)
    } catch (err) {
      handleApiError(err, "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError("Erro ao fazer login com Google")
      return
    }

    setIsGoogleLoading(true)
    setError(null)

    try {
      await googleLogin(credentialResponse.credential)
      const { lng } = await params
      router.push(`/${lng}/agenda`)
    } catch (err) {
      handleApiError(err, "Erro ao fazer login com Google")
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
          <div className="flex justify-center mb-4">
            <div className="relative h-12 w-48">
              <Image 
                src="/logo.png" 
                alt="Aseno" 
                fill 
                className="object-contain" 
                priority
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
          <CardDescription className="text-center">
            Digite seu email e senha para acessar sua conta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="#"
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
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
                text="continue_with"
                shape="rectangular"
                width="280"
              />
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Nao tem uma conta?{" "}
            <Link href="register" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}