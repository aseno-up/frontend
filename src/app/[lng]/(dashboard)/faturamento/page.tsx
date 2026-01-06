'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api/client'
import { showToast, handleApiError } from '@/lib/toast'
import { BillingCustomer, Payment, Subscription, PaymentStatus, PixQRCode } from '@/types/api'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Schema de validacao com Zod
const customerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  document: z.string().min(11, "CPF/CNPJ invalido"),
  phone: z.string().optional(),
  postal_code: z.string().optional(),
  address: z.string().optional(),
  address_number: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "Use a sigla do estado (ex: SP)").optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface BillingPageProps {
  params: Promise<{ lng: string }>
}

const statusLabels: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendente', variant: 'outline' },
  RECEIVED: { label: 'Recebido', variant: 'default' },
  CONFIRMED: { label: 'Confirmado', variant: 'default' },
  OVERDUE: { label: 'Vencido', variant: 'destructive' },
  REFUNDED: { label: 'Reembolsado', variant: 'secondary' },
  RECEIVED_IN_CASH: { label: 'Recebido em Dinheiro', variant: 'default' },
  REFUND_REQUESTED: { label: 'Reembolso Solicitado', variant: 'secondary' },
  REFUND_IN_PROGRESS: { label: 'Reembolso em Andamento', variant: 'secondary' },
  CHARGEBACK_REQUESTED: { label: 'Chargeback Solicitado', variant: 'destructive' },
  CHARGEBACK_DISPUTE: { label: 'Disputa de Chargeback', variant: 'destructive' },
  AWAITING_CHARGEBACK_REVERSAL: { label: 'Aguardando Reversao', variant: 'secondary' },
  DUNNING_REQUESTED: { label: 'Cobranca Solicitada', variant: 'outline' },
  DUNNING_RECEIVED: { label: 'Cobranca Recebida', variant: 'default' },
  AWAITING_RISK_ANALYSIS: { label: 'Analise de Risco', variant: 'outline' },
  CANCELED: { label: 'Cancelado', variant: 'secondary' },
}

const billingTypeLabels: Record<string, string> = {
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartao de Credito',
  DEBIT_CARD: 'Cartao de Debito',
  PIX: 'PIX',
  UNDEFINED: 'Indefinido',
}

export default function BillingPage({ params }: BillingPageProps) {
  const [lng, setLng] = useState('pt-BR')
  const [customer, setCustomer] = useState<BillingCustomer | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [pixQRCode, setPixQRCode] = useState<PixQRCode | null>(null)
  const [isLoadingPix, setIsLoadingPix] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      document: '',
      phone: '',
      postal_code: '',
      address: '',
      address_number: '',
      province: '',
      city: '',
      state: '',
    },
  })

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  const fetchCustomer = useCallback(async () => {
    try {
      setIsLoadingCustomer(true)
      const data = await api.getBillingCustomer()
      setCustomer(data)
    } catch {
      setCustomer(null)
    } finally {
      setIsLoadingCustomer(false)
    }
  }, [])

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoadingSubscription(true)
      const data = await api.getSubscription()
      setSubscription(data)
    } catch {
      setSubscription(null)
    } finally {
      setIsLoadingSubscription(false)
    }
  }, [])

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoadingPayments(true)
      const data = await api.getPayments(1, 10)
      setPayments(data.data || [])
    } catch {
      setPayments([])
    } finally {
      setIsLoadingPayments(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomer()
    fetchSubscription()
    fetchPayments()
  }, [fetchCustomer, fetchSubscription, fetchPayments])

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsCreatingCustomer(true)
      const result = await api.createBillingCustomer(data)
      setCustomer(result)
      setShowCustomerForm(false)
      showToast.success('Dados de cobranca cadastrados com sucesso!')
      reset()
    } catch (err) {
      handleApiError(err, 'Erro ao cadastrar dados de cobranca')
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const handleViewPix = async (payment: Payment) => {
    setIsLoadingPix(true)
    try {
      const data = await api.getPaymentPixQRCode(payment.id)
      setPixQRCode(data)
    } catch {
      setPixQRCode(null)
      showToast.error('Erro ao carregar QR Code')
    } finally {
      setIsLoadingPix(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Faturamento" />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados de Cobranca</CardTitle>
              <CardDescription>
                Informacoes do cliente para faturamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCustomer ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : customer ? (
                <div className="space-y-2">
                  <p><strong>Nome:</strong> {customer.name}</p>
                  <p><strong>Email:</strong> {customer.email}</p>
                  <p><strong>Documento:</strong> {customer.document}</p>
                  {customer.phone && <p><strong>Telefone:</strong> {customer.phone}</p>}
                  {customer.address && (
                    <p><strong>Endereco:</strong> {customer.address}, {customer.address_number} - {customer.province}, {customer.city}/{customer.state}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {!showCustomerForm ? (
                    <Button onClick={() => setShowCustomerForm(true)}>
                      Cadastrar Dados de Cobranca
                    </Button>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            Nome <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="name"
                            {...register('name')}
                            className={errors.name ? 'border-destructive' : ''}
                          />
                          {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            className={errors.email ? 'border-destructive' : ''}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="document">
                            CPF/CNPJ <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="document"
                            {...register('document')}
                            className={errors.document ? 'border-destructive' : ''}
                          />
                          {errors.document && (
                            <p className="text-sm text-destructive">{errors.document.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            {...register('phone')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postal_code">CEP</Label>
                          <Input
                            id="postal_code"
                            {...register('postal_code')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Endereco</Label>
                          <Input
                            id="address"
                            {...register('address')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address_number">Numero</Label>
                          <Input
                            id="address_number"
                            {...register('address_number')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="province">Bairro</Label>
                          <Input
                            id="province"
                            {...register('province')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            {...register('city')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">Estado</Label>
                          <Input
                            id="state"
                            {...register('state')}
                            maxLength={2}
                            placeholder="SP"
                            className={errors.state ? 'border-destructive' : ''}
                          />
                          {errors.state && (
                            <p className="text-sm text-destructive">{errors.state.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isCreatingCustomer}>
                          {isCreatingCustomer ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowCustomerForm(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle>Assinatura</CardTitle>
              <CardDescription>
                Status da sua assinatura atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscription ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{formatCurrency(subscription.value)}</span>
                    <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {subscription.status === 'ACTIVE' ? 'Ativa' : subscription.status === 'INACTIVE' ? 'Inativa' : 'Expirada'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Ciclo:</strong> {subscription.cycle === 'MONTHLY' ? 'Mensal' : subscription.cycle}</p>
                    <p><strong>Metodo:</strong> {billingTypeLabels[subscription.billing_type] || subscription.billing_type}</p>
                    <p><strong>Proximo vencimento:</strong> {formatDate(subscription.next_due_date)}</p>
                    {subscription.description && <p><strong>Descricao:</strong> {subscription.description}</p>}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">Nenhuma assinatura ativa</p>
                  <Button disabled={!customer}>
                    Assinar Plano
                  </Button>
                  {!customer && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Cadastre os dados de cobranca primeiro
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Historico de Pagamentos</CardTitle>
            <CardDescription>
              Ultimos pagamentos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPayments ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(payment.value)}</span>
                        <Badge variant={statusLabels[payment.status]?.variant || 'outline'}>
                          {statusLabels[payment.status]?.label || payment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {billingTypeLabels[payment.billing_type] || payment.billing_type} - Vencimento: {formatDate(payment.due_date)}
                      </p>
                      {payment.description && (
                        <p className="text-sm text-muted-foreground">{payment.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {payment.billing_type === 'PIX' && payment.status === 'PENDING' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleViewPix(payment)}>
                              Ver PIX
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Pagamento via PIX</DialogTitle>
                              <DialogDescription>
                                Escaneie o QR Code ou copie o codigo PIX
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center gap-4 py-4">
                              {isLoadingPix ? (
                                <div className="animate-pulse bg-gray-200 w-48 h-48 rounded"></div>
                              ) : pixQRCode ? (
                                <>
                                  <img
                                    src={`data:image/png;base64,${pixQRCode.encodedImage}`}
                                    alt="PIX QR Code"
                                    className="w-48 h-48"
                                  />
                                  <div className="w-full">
                                    <Label>Codigo PIX (Copia e Cola)</Label>
                                    <div className="flex gap-2 mt-1">
                                      <Input value={pixQRCode.payload} readOnly className="text-xs" />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(pixQRCode.payload)
                                          showToast.success('Codigo copiado!')
                                        }}
                                      >
                                        Copiar
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <p className="text-muted-foreground">QR Code nao disponivel</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {payment.invoice_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                            Fatura
                          </a>
                        </Button>
                      )}
                      {payment.bank_slip_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={payment.bank_slip_url} target="_blank" rel="noopener noreferrer">
                            Boleto
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pagamento encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
