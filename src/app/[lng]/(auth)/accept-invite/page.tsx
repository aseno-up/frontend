'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2, Building2, User, Clock, Stethoscope } from 'lucide-react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth-store'
import type { InviteDetails, AuthResponse } from '@/types/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}

// Schema for NEW users (registration)
const newUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas nao conferem',
  path: ['confirmPassword'],
})

// Schema for EXISTING users (just confirm with password)
const existingUserSchema = z.object({
  password: z.string().min(1, 'Digite sua senha'),
})

type NewUserFormData = z.infer<typeof newUserSchema>
type ExistingUserFormData = z.infer<typeof existingUserSchema>

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  professional: 'Profissional',
  receptionist: 'Recepcionista',
}

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const lng = params.lng as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { setUser } = useAuthStore()

  const token = searchParams.get('token')

  const newUserForm = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
  })

  const existingUserForm = useForm<ExistingUserFormData>({
    resolver: zodResolver(existingUserSchema),
  })

  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setError('Token de convite nao encontrado')
        setIsLoading(false)
        return
      }

      try {
        const data = await api.getInviteByToken(token)
        setInvite(data)

        if (!data.is_valid) {
          if (data.is_expired) {
            setError('Este convite expirou. Solicite um novo convite ao administrador da clinica.')
          } else {
            setError('Este convite nao e mais valido.')
          }
        }
      } catch {
        setError('Convite nao encontrado ou invalido')
      } finally {
        setIsLoading(false)
      }
    }

    loadInvite()
  }, [token])

  const handleAccept = async (opts: { password?: string; name?: string; googleCredential?: string }) => {
    if (!token) return

    setIsSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, string> = { token }
      if (opts.password) payload.password = opts.password
      if (opts.name) payload.name = opts.name
      if (opts.googleCredential) payload.google_credential = opts.googleCredential

      const response: AuthResponse = await api.acceptInvite(payload as { token: string; name: string; password: string })

      api.setTokens(response.access_token, response.refresh_token)
      setUser(response.user, response.clinic)
      router.push(`/${lng}/agenda`)
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      const message = err.response?.data?.error?.message || 'Erro ao aceitar convite'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Erro ao autenticar com Google')
      return
    }
    handleAccept({ googleCredential: credentialResponse.credential })
  }

  const onNewUserSubmit = (data: NewUserFormData) => {
    handleAccept({ password: data.password, name: data.name })
  }

  const onExistingUserSubmit = (data: ExistingUserFormData) => {
    handleAccept({ password: data.password })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if ((error && !invite?.is_valid) || !invite?.is_valid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Convite Invalido</AlertTitle>
              <AlertDescription>{error || 'Este convite nao e mais valido.'}</AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => router.push(`/${lng}/login`)}>
                Ir para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {invite.user_exists ? 'Convite para nova clinica' : 'Voce foi convidado!'}
          </CardTitle>
          <CardDescription>
            {invite.user_exists
              ? `Ola, ${invite.user_name}! Confirme sua senha para entrar na equipe`
              : 'Complete seu cadastro para fazer parte da equipe'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invite Details */}
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Clinica:</strong> {invite.clinic_name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Convidado por:</strong> {invite.inviter_name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                <strong>Funcao:</strong>{' '}
                <Badge variant="secondary">{roleLabels[invite.role]}</Badge>
              </span>
            </div>
            {invite.professional_name && (
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Profissional:</strong> {invite.professional_name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Expira em {format(new Date(invite.expires_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Google login — works for both existing and new users */}
          <div className="flex justify-center w-full">
            {isSubmitting ? (
              <div className="flex items-center justify-center h-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Erro ao conectar com Google')}
                theme="outline"
                size="large"
                text={invite.user_exists ? 'continue_with' : 'signup_with'}
                width="100%"
              />
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {invite.user_exists ? (
            /* EXISTING USER: just confirm password */
            <form onSubmit={existingUserForm.handleSubmit(onExistingUserSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Sua Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha para confirmar"
                  {...existingUserForm.register('password')}
                />
                {existingUserForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{existingUserForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aceitar Convite e Entrar
              </Button>
            </form>
          ) : (
            /* NEW USER: registration form */
            <form onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu Nome</Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome completo"
                  {...newUserForm.register('name')}
                />
                {newUserForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{newUserForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  {...newUserForm.register('password')}
                />
                {newUserForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{newUserForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  {...newUserForm.register('confirmPassword')}
                />
                {newUserForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{newUserForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta e Acessar
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {invite.user_exists ? (
              <>
                Nao lembra sua senha?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => router.push(`/${lng}/forgot-password`)}
                >
                  Redefinir senha
                </Button>
              </>
            ) : (
              <>
                Ja tem uma conta?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => router.push(`/${lng}/login`)}
                >
                  Fazer login
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
