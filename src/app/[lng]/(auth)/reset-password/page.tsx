"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"

const resetPasswordSchema = z.object({
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface PageProps {
  params: Promise<{ lng: string }>
}

function ResetPasswordForm({ lng }: { lng: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      showToast.error("Token inválido ou ausente.")
      return
    }

    setIsLoading(true)
    try {
      await api.resetPassword(token, data.password)
      showToast.success("Senha redefinida com sucesso!")
      router.push(`/${lng}/login`)
    } catch (err) {
      handleApiError(err, "Erro ao redefinir senha")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <CardContent className="space-y-4">
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Token de redefinição inválido ou ausente. Por favor, solicite uma nova redefinição.
        </div>
        <Link href="forgot-password">
          <Button variant="outline" className="w-full">
            Solicitar nova senha
          </Button>
        </Link>
      </CardContent>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova Senha</Label>
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
          <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
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

      <CardFooter>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Redefinir Senha
        </Button>
      </CardFooter>
    </form>
  )
}

export default async function ResetPasswordPage({ params }: PageProps) {
  const { lng } = await params
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Criar nova senha</CardTitle>
        <CardDescription>
          Digite sua nova senha abaixo.
        </CardDescription>
      </CardHeader>
      
      <Suspense fallback={
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      }>
        <ResetPasswordForm lng={lng} />
      </Suspense>
    </Card>
  )
}
