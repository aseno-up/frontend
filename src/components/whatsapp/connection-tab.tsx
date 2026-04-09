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
  AlertCircle,
  Circle,
  Lock
} from 'lucide-react'

const testMessageSchema = z.object({
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
})

type TestMessageFormData = z.infer<typeof testMessageSchema>

const officialApiSchema = z.object({
  instance: z.string().min(1, 'Nome do App é obrigatório'),
  waba_id: z.string().min(1, 'WABA ID é obrigatório'),
  phone_number_id: z.string().min(1, 'Telefone de origem é obrigatório'),
  token: z.string().min(1, 'API Key é obrigatória'),
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
  const [connectionMethod, setConnectionMethod] = useState<'evolution' | 'official'>('official')
  const MAX_POLLING_TIME_MS = 1 * 60 * 1000

  const officialForm = useForm<OfficialApiFormData>({
    resolver: zodResolver(officialApiSchema),
    defaultValues: { instance: '', waba_id: '', phone_number_id: '', token: '' },
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Connection Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          {/* Header Area */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Conexão com WhatsApp</h2>
              <p className="text-muted-foreground text-sm">Vincule o número da sua clínica para enviar mensagens</p>
            </div>
          </div>

          {/* Connected Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${isConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500'}`} />
              <div>
                <p className={`font-medium text-sm ${isConnected ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </p>
                <p className={`text-xs ${isConnected ? 'text-green-600/80 dark:text-green-500/80' : 'text-amber-600/80 dark:text-amber-500/80'}`}>
                  {isConnected ? (status?.provider === 'EVOLUTION' ? 'Conectado via QR Code' : 'Conectado via WhatsApp Oficial') : 'Nenhum número vinculado ainda'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStatus(false)}
                disabled={isLoadingStatus}
                className={`bg-white/50 backdrop-blur-sm hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40 ${isConnected ? 'border-green-500/20 text-green-700 dark:text-green-400' : 'border-amber-500/20 text-amber-700 dark:text-amber-400'}`}
              >
                <RefreshCw className={`h-3 w-3 mr-2 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                Verificar status
              </Button>
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="bg-white/50 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 dark:bg-black/20 text-destructive border-destructive/20"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-2" />
                  )}
                  Desconectar
                </Button>
              )}
            </div>
          </div>

          {!isConnected && (
            <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* HOW TO CONNECT LIST */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Como Conectar</h3>
                <div className="relative space-y-6">
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-border/40 -z-10" />
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">1</span>
                    </div>
                    <div className="pt-1.5">
                      <h4 className="font-medium text-sm">Escolha o método de conexão</h4>
                      <p className="text-sm text-muted-foreground">QR Code para números existentes; API Oficial para novos números com maior estabilidade.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">2</span>
                    </div>
                    <div className="pt-1.5">
                      <h4 className="font-medium text-sm">Escaneie ou insira suas credenciais</h4>
                      <p className="text-sm text-muted-foreground">Abra o WhatsApp no celular → Dispositivos vinculados → Vincular um dispositivo (se Evolution).</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">3</span>
                    </div>
                    <div className="pt-1.5">
                      <h4 className="font-medium text-sm">Pronto! Envios automáticos ativados</h4>
                      <p className="text-sm text-muted-foreground">Confirmações e lembretes serão enviados automaticamente para seus pacientes.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* METHOD SELECTION */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Método de Conexão</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Option: WhatsApp Oficial */}
                  <div
                    onClick={() => setConnectionMethod('official')}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${connectionMethod === 'official' ? 'border-primary bg-background shadow-sm' : 'border-border/50 hover:border-border hover:bg-muted/30'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">WhatsApp Oficial</h4>
                      {connectionMethod === 'official' ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/30" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Número dedicado via Meta Business, sem risco de banimento</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary font-normal text-[10px] px-2 py-0.5">Recomendado</Badge>
                  </div>

                  {/* Option: QR Code */}
                  <div
                    onClick={() => setConnectionMethod('evolution')}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${connectionMethod === 'evolution' ? 'border-primary bg-background shadow-sm' : 'border-border/50 hover:border-border hover:bg-muted/30'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">QR Code</h4>
                      {connectionMethod === 'evolution' ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/30" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Escaneie com o WhatsApp já instalado no celular</p>
                    <Badge variant="secondary" className="font-normal text-[10px] px-2 py-0.5 text-muted-foreground">Mais rápido</Badge>
                  </div>
                </div>

                {/* THE ACTION AREA */}
                <div className="mt-8">
                  {connectionMethod === 'evolution' ? (
                    <div className="space-y-6">
                      {!qrCode ? (
                        <Button
                          className="w-full py-6 text-sm font-medium transition-all shadow-md hover:shadow-lg"
                          onClick={handleConnect}
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          ) : (
                            <QrCode className="h-5 w-5 mr-3" />
                          )}
                          Gerar QR Code
                        </Button>
                      ) : (
                        <div className="border border-border/50 rounded-xl p-6 bg-muted/10 flex flex-col items-center animate-in zoom-in-95 duration-300">
                          <h4 className="font-medium mb-1">Aponte sua câmera</h4>
                          <p className="text-xs text-muted-foreground mb-4 text-center max-w-xs">Use o WhatsApp no seu celular para escanear este código e conectar.</p>
                          <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={handleRefreshQR}
                            disabled={isConnecting}
                          >
                            <RefreshCw className={`h-3 w-3 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
                            Atualizar código
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-border/50 rounded-xl p-6 bg-muted/10 animate-in fade-in slide-in-from-top-4 duration-300">
                      <form onSubmit={officialForm.handleSubmit(handleSaveOfficial)} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="instance" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nome do App</Label>
                          <Input
                            id="instance"
                            placeholder="Ex: minha-clinica"
                            className="bg-background"
                            {...officialForm.register('instance')}
                          />
                          <p className="text-[10px] text-muted-foreground">Nome do app criado no painel do provedor</p>
                          {officialForm.formState.errors.instance && (
                            <p className="text-[10px] text-destructive">{officialForm.formState.errors.instance.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="waba_id" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">WABA ID</Label>
                          <Input
                            id="waba_id"
                            placeholder="Ex: 1234567890"
                            className="bg-background"
                            {...officialForm.register('waba_id')}
                          />
                          {officialForm.formState.errors.waba_id && (
                            <p className="text-[10px] text-destructive">{officialForm.formState.errors.waba_id.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone_number_id" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Telefone de Origem</Label>
                          <Input
                            id="phone_number_id"
                            placeholder="Ex: 5511999990000"
                            className="bg-background"
                            {...officialForm.register('phone_number_id')}
                          />
                          <p className="text-[10px] text-muted-foreground">Telefone registrado no app (com DDI+DDD, sem +)</p>
                          {officialForm.formState.errors.phone_number_id && (
                            <p className="text-[10px] text-destructive">{officialForm.formState.errors.phone_number_id.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="token" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">API Key</Label>
                          <Input
                            id="token"
                            type="password"
                            placeholder="Cole a API Key do app aqui"
                            className="bg-background font-mono text-sm"
                            {...officialForm.register('token')}
                          />
                          <p className="text-[10px] text-muted-foreground">Encontre em App Settings no painel do provedor</p>
                          {officialForm.formState.errors.token && (
                            <p className="text-[10px] text-destructive">{officialForm.formState.errors.token.message}</p>
                          )}
                        </div>
                        <Button
                          type="submit"
                          className="w-full mt-2 py-6 text-sm font-medium shadow-md hover:shadow-lg"
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          ) : (
                            <Wifi className="h-5 w-5 mr-3" />
                          )}
                          Salvar e Conectar
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits / Info Cards below */}
      <div className="pt-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-4">
          O que será ativado após conectar
          <div className="h-px bg-border flex-1" />
        </h3>
        <div className="grid gap-4 md:grid-cols-3 items-stretch">
          <Card className="bg-white/50 dark:bg-black/20 border-border/40 shadow-sm relative overflow-hidden">
            <Lock className="absolute top-3 right-3 h-3 w-3 text-amber-500/40" />
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <h4 className="font-medium text-sm mb-1.5">Confirmação Automática</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mensagens enviadas automaticamente quando um agendamento é criado no sistema.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-black/20 border-border/40 shadow-sm relative overflow-hidden">
            <Lock className="absolute top-3 right-3 h-3 w-3 text-amber-500/40" />
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                <RefreshCw className="h-4 w-4 text-blue-500" />
              </div>
              <h4 className="font-medium text-sm mb-1.5">Confirmação e Lembretes</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Avisos enviados 48h, 24h e 2h antes com opção interativa para o cliente.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-black/20 border-border/40 shadow-sm relative overflow-hidden">
            <Lock className="absolute top-3 right-3 h-3 w-3 text-amber-500/40" />
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                <MessageSquare className="h-4 w-4 text-purple-500" />
              </div>
              <h4 className="font-medium text-sm mb-1.5">Respostas Inteligentes</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O agente entende respostas humanas e gerencia a alteração de status na agenda.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Message Module (Displays only if Connected) */}
      {isConnected && (
        <Card className="border-border/50 bg-background mt-8 max-w-xl mx-auto shadow-sm">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Enviar Mensagem de Teste
            </CardTitle>
            <CardDescription className="text-xs">
              Valide se a integração está totalmente funcional enviando uma mensagem.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmitTestMessage)} className="flex items-end gap-3 flex-col sm:flex-row">
              <div className="space-y-1.5 flex-1 w-full">
                <Label htmlFor="phone" className="text-xs text-muted-foreground">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="5511999999999"
                  {...register('phone')}
                  className={`bg-background ${errors.phone ? 'border-destructive' : ''}`}
                />
              </div>
              <div className="space-y-1.5 flex-1 w-full">
                <Label htmlFor="message" className="text-xs text-muted-foreground">Mensagem</Label>
                <Input
                  id="message"
                  placeholder="Oi, teste!"
                  {...register('message')}
                  className={`bg-background ${errors.message ? 'border-destructive' : ''}`}
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
              </Button>
            </form>
            {(errors.phone || errors.message) && (
              <div className="mt-2 text-[10px] text-destructive flex flex-col gap-0.5">
                {errors.phone && <span>• {errors.phone.message}</span>}
                {errors.message && <span>• {errors.message.message}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
