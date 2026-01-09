"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"

interface PageProps {
  params: Promise<{ lng: string }>
}

function VerifyEmailContent({ lng }: { lng: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token"
  )
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      await api.verifyEmail(verificationToken)
      setStatus("success")
      showToast.success("Email verificado com sucesso!")
    } catch {
      setStatus("error")
    }
  }

  const handleResend = async () => {
    if (!email) {
      showToast.error("Digite seu email")
      return
    }

    setIsResending(true)
    try {
      await api.resendVerificationEmail(email)
      showToast.success("Se o email existir e nao estiver verificado, um novo link foi enviado.")
    } catch (err) {
      handleApiError(err, "Erro ao reenviar email")
    } finally {
      setIsResending(false)
    }
  }

  if (status === "loading") {
    return (
      <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando seu email...</p>
      </CardContent>
    )
  }

  if (status === "success") {
    return (
      <>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Email verificado!</h3>
            <p className="text-muted-foreground">
              Sua conta foi verificada com sucesso. Agora voce pode acessar todas as funcionalidades.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push(`/${lng}/login`)}>
            Ir para Login
          </Button>
        </CardFooter>
      </>
    )
  }

  if (status === "error") {
    return (
      <>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <XCircle className="h-16 w-16 text-destructive" />
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Link invalido ou expirado</h3>
            <p className="text-muted-foreground">
              O link de verificacao pode ter expirado ou ja foi utilizado.
            </p>
          </div>

          <div className="w-full space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Reenviar link de verificacao</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reenviar Email
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href={`/${lng}/login`} className="w-full">
            <Button variant="outline" className="w-full">
              Voltar para Login
            </Button>
          </Link>
        </CardFooter>
      </>
    )
  }

  // no-token state
  return (
    <>
      <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
        <Mail className="h-16 w-16 text-primary" />
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Verifique seu email</h3>
          <p className="text-muted-foreground">
            Enviamos um link de verificacao para o seu email. Clique no link para ativar sua conta.
          </p>
        </div>

        <div className="w-full space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Nao recebeu? Reenvie o link</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reenviar Email
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/${lng}/login`} className="w-full">
          <Button variant="outline" className="w-full">
            Voltar para Login
          </Button>
        </Link>
      </CardFooter>
    </>
  )
}

export default async function VerifyEmailPage({ params }: PageProps) {
  const { lng } = await params

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Verificacao de Email</CardTitle>
        <CardDescription>
          Confirme seu endereco de email para ativar sua conta
        </CardDescription>
      </CardHeader>

      <Suspense fallback={
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      }>
        <VerifyEmailContent lng={lng} />
      </Suspense>
    </Card>
  )
}
