'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api/client'
import { showToast, handleApiError } from '@/lib/toast'
import { WhatsAppConnectionStatus, WhatsAppQRCode } from '@/types/api'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Wifi,
  WifiOff,
  QrCode,
  Loader2,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'

// Schema de validacao para mensagem de teste
const testMessageSchema = z.object({
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 digitos'),
  message: z.string().min(1, 'Mensagem e obrigatoria'),
})

type TestMessageFormData = z.infer<typeof testMessageSchema>

interface WhatsAppPageProps {
  params: Promise<{ lng: string }>
}

export default function WhatsAppPage({ params }: WhatsAppPageProps) {
  const [lng, setLng] = useState('pt-BR')

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])
  const [status, setStatus] = useState<WhatsAppConnectionStatus | null>(null)
  const [qrCode, setQRCode] = useState<WhatsAppQRCode | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [error, setError] = useState<string>()
  const [isSending, setIsSending] = useState(false)
  const [pollingStartTime, setPollingStartTime] = useState<number | null>(null)
  const MAX_POLLING_TIME_MS = 5 * 60 * 1000 // 5 minutes max polling

  // Test message form with validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TestMessageFormData>({
    resolver: zodResolver(testMessageSchema),
    defaultValues: {
      phone: '',
      message: '',
    },
  })

  const isConnected = status?.state === 'open'

  const fetchStatus = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoadingStatus(true)
      setError(undefined)
      const data = await api.getWhatsAppStatus()
      setStatus(data)

      // Clear QR code when connection is established
      if (data?.state === 'open') {
        setQRCode(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar status'
      // Only show error if not silent (polling errors shouldn't break UI)
      if (!silent) setError(message)
      setStatus(null)
    } finally {
      if (!silent) setIsLoadingStatus(false)
    }
  }, [])

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      setError(undefined)
      const data = await api.connectWhatsApp()
      setQRCode(data)
      setPollingStartTime(Date.now())
      // Start polling for status
      fetchStatus(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao conectar WhatsApp'
      setError(message)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true)
      setError(undefined)
      await api.disconnectWhatsApp()
      setStatus(null)
      setQRCode(null)
      setPollingStartTime(null)
      fetchStatus(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao desconectar WhatsApp'
      setError(message)
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleRefreshQR = async () => {
    try {
      setIsConnecting(true)
      setError(undefined)
      const data = await api.getWhatsAppQRCode()
      setQRCode(data)
      // Reset polling time on manual refresh
      setPollingStartTime(Date.now())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar QR Code'
      setError(message)
    } finally {
      setIsConnecting(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Poll status when waiting for connection
  useEffect(() => {
    if (!qrCode || isConnected) {
      // Clear polling start time when not polling
      if (isConnected && pollingStartTime) {
        setPollingStartTime(null)
      }
      return
    }

    // Check for polling timeout
    if (pollingStartTime && Date.now() - pollingStartTime > MAX_POLLING_TIME_MS) {
      setError('Tempo limite excedido. Por favor, tente conectar novamente.')
      setQRCode(null)
      setPollingStartTime(null)
      return
    }

    const interval = setInterval(() => {
      // Check timeout inside interval as well
      if (pollingStartTime && Date.now() - pollingStartTime > MAX_POLLING_TIME_MS) {
        setError('Tempo limite excedido. Por favor, tente conectar novamente.')
        setQRCode(null)
        setPollingStartTime(null)
        return
      }
      fetchStatus(true)
    }, 3000)

    return () => clearInterval(interval)
  }, [qrCode, isConnected, fetchStatus, pollingStartTime, MAX_POLLING_TIME_MS])

  const onSubmitTestMessage = async (data: TestMessageFormData) => {
    try {
      setIsSending(true)
      await api.sendWhatsAppMessage(data.phone, data.message)
      showToast.success('Mensagem enviada com sucesso!')
      reset()
    } catch (err) {
      handleApiError(err, 'Erro ao enviar mensagem')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="WhatsApp" tutorialPage="whatsapp" />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Status da Conexao
            </CardTitle>
            <CardDescription>
              Status atual do WhatsApp da sua clinica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingStatus ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {isConnected ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <Wifi className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      <WifiOff className="h-3 w-3 mr-1" />
                      Desconectado
                    </Badge>
                  )}
                </div>

                {status?.instance && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Instancia</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {status.instance}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  {isConnected ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Desconectar WhatsApp
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleConnect}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4 mr-2" />
                      )}
                      Conectar WhatsApp
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* QR Code Card - only show when connecting */}
        {qrCode && !isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Escaneie o QR Code
              </CardTitle>
              <CardDescription>
                Abra o WhatsApp no seu celular e escaneie o codigo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                {qrCode.base64 ? (
                  <img
                    src={qrCode.base64.startsWith('data:') ? qrCode.base64 : `data:image/png;base64,${qrCode.base64}`}
                    alt="QR Code WhatsApp"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Como conectar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em Menu ou Configuracoes</li>
                  <li>Selecione &quot;Aparelhos conectados&quot;</li>
                  <li>Toque em &quot;Conectar um aparelho&quot;</li>
                  <li>Aponte a camera para o QR Code</li>
                </ol>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleRefreshQR}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Atualizar QR Code
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Test Message Card - only show when connected */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Enviar Mensagem de Teste
              </CardTitle>
              <CardDescription>
                Envie uma mensagem para testar a conexao
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitTestMessage)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Telefone (com DDD) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="5511999999999"
                    {...register('phone')}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Mensagem <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="message"
                    placeholder="Digite sua mensagem..."
                    {...register('message')}
                    className={errors.message ? 'border-destructive' : ''}
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Enviar Mensagem
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Information Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Confirmacao Automatica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mensagens de confirmacao sao enviadas automaticamente quando um agendamento e criado.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Lembretes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Lembretes sao enviados automaticamente 24h e 2h antes do horario agendado.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Respostas Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O sistema reconhece respostas como &quot;Sim&quot;, &quot;Confirmo&quot;, &quot;Cancela&quot; e atualiza automaticamente.
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
