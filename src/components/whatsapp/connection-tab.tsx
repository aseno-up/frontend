'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api/client'
import { showToast, handleApiError } from '@/lib/toast'
import { WhatsAppConnectionStatus, WhatsAppQRCode } from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

const testMessageSchema = z.object({
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
})

type TestMessageFormData = z.infer<typeof testMessageSchema>

const officialApiSchema = z.object({
  waba_id: z.string().min(1, 'WABA ID é obrigatório'),
  phone_number_id: z.string().min(1, 'Phone Number ID é obrigatório'),
  token: z.string().min(1, 'Token é obrigatório'),
})
type OfficialApiFormData = z.infer<typeof officialApiSchema>

export function WhatsAppConnectionTab() {
  const [status, setStatus] = useState<WhatsAppConnectionStatus | null>(null)
  const [qrCode, setQRCode] = useState<WhatsAppQRCode | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [error, setError] = useState<string>()
  const [isSending, setIsSending] = useState(false)
  const [pollingStartTime, setPollingStartTime] = useState<number | null>(null)
  const MAX_POLLING_TIME_MS = 1 * 60 * 1000

  const officialForm = useForm<OfficialApiFormData>({
    resolver: zodResolver(officialApiSchema),
    defaultValues: { waba_id: '', phone_number_id: '', token: '' },
  })

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

      if (data?.state === 'open') {
        setQRCode(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar status'
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
      
      await api.updateWhatsAppConfig({ provider: 'EVOLUTION' })
      const data = await api.connectWhatsApp()

      if (data?.base64) {
        setQRCode(data)
        setPollingStartTime(Date.now())
        fetchStatus(false)
      } else {
        // Se a resposta da API for state open (em caso de webhook tardio)
        if (data?.state === 'open') {
           fetchStatus(false)
           return
        }
        setError('Não foi possível obter o QR Code. Por favor, tente novamente em alguns instantes.')
        setQRCode(null)
      }
    } catch (err) {
      handleApiError(err, 'Erro ao conectar WhatsApp')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSaveOfficial = async (data: OfficialApiFormData) => {
    try {
      setIsConnecting(true)
      setError(undefined)
      await api.updateWhatsAppConfig({
        provider: 'GUPSHUP_OFFICIAL',
        ...data
      })
      showToast.success('Configuração da API Oficial salva com sucesso!')
      fetchStatus(false)
    } catch (err) {
      handleApiError(err, 'Erro ao salvar configuração da API Oficial')
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

  useEffect(() => {
    if (!qrCode || isConnected) {
      if (isConnected && pollingStartTime) {
        setPollingStartTime(null)
      }
      return
    }

    if (pollingStartTime && Date.now() - pollingStartTime > MAX_POLLING_TIME_MS) {
      setError('Tempo limite excedido. Por favor, tente conectar novamente.')
      setQRCode(null)
      setPollingStartTime(null)
      return
    }

    const interval = setInterval(() => {
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

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatus(true)
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchStatus])

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
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Status da Conexão
                </CardTitle>
                <CardDescription>
                  Status atual do WhatsApp da sua clínica
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchStatus(false)}
                disabled={isLoadingStatus}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              </Button>
            </div>
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
                    <span className="text-sm font-medium">Instância</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {status.instance}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  {isConnected ? (
                    <div className="space-y-4">
                      {status?.provider && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Provedor</span>
                          <span className="text-muted-foreground">{status.provider === 'EVOLUTION' ? 'QR Code (Não Oficial)' : 'API Oficial'}</span>
                        </div>
                      )}
                      
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
                    </div>
                  ) : (
                    <Tabs defaultValue="evolution" className="w-full">
                      <TabsList className="w-full grid grid-cols-2 mb-4">
                        <TabsTrigger value="evolution">QR Code</TabsTrigger>
                        <TabsTrigger value="official">API Oficial</TabsTrigger>
                      </TabsList>
                      <TabsContent value="evolution" className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Conecte rapidamente escaneando um QR Code, ideal para testes e números já existentes.
                        </p>
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
                          Gerar QR Code
                        </Button>
                      </TabsContent>
                      <TabsContent value="official" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Conexão de alta estabilidade usando Meta Cloud API (Gupshup). Insira suas credenciais abaixo:
                        </p>
                        <form onSubmit={officialForm.handleSubmit(handleSaveOfficial)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="waba_id">WABA ID</Label>
                            <Input
                              id="waba_id"
                              placeholder="ID da sua WhatsApp Business Account"
                              {...officialForm.register('waba_id')}
                            />
                            {officialForm.formState.errors.waba_id && (
                              <p className="text-sm text-destructive">{officialForm.formState.errors.waba_id.message}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone_number_id">Phone Number ID</Label>
                            <Input
                              id="phone_number_id"
                              placeholder="ID do Número de Telefone"
                              {...officialForm.register('phone_number_id')}
                            />
                            {officialForm.formState.errors.phone_number_id && (
                              <p className="text-sm text-destructive">{officialForm.formState.errors.phone_number_id.message}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="token">Token de Acesso</Label>
                            <Input
                              id="token"
                              type="password"
                              placeholder="System User Token ou Token Definitivo"
                              {...officialForm.register('token')}
                            />
                            {officialForm.formState.errors.token && (
                              <p className="text-sm text-destructive">{officialForm.formState.errors.token.message}</p>
                            )}
                          </div>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={isConnecting}
                          >
                            {isConnecting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Wifi className="h-4 w-4 mr-2" />
                            )}
                            Salvar e Conectar API Oficial
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {qrCode && !isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Escaneie o QR Code
              </CardTitle>
              <CardDescription>
                Abra o WhatsApp no seu celular e escaneie o código
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
                  <li>Toque em Menu ou Configurações</li>
                  <li>Selecione &quot;Aparelhos conectados&quot;</li>
                  <li>Toque em &quot;Conectar um aparelho&quot;</li>
                  <li>Aponte a câmera para o QR Code</li>
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

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Enviar Mensagem de Teste
              </CardTitle>
              <CardDescription>
                Envie uma mensagem para testar a conexão
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Confirmação Automática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mensagens de confirmação são enviadas automaticamente quando um agendamento é criado.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Confirmação e Lembretes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Confirmações são enviadas 48h, 24h e 2h antes do agendamento. O não retorno do paciente na primeira tentativa move o status para 'Não Respondido', e na terceira, para 'Ausente'.
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
              O sistema analisa a resposta do paciente para entender a intenção de confirmar ou cancelar, atualizando o agendamento de forma automática.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
