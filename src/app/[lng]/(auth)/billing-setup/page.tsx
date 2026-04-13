"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { api } from "@/lib/api/client"
import { CreditCard, QrCode, ArrowRight, ArrowLeft, Check, Loader2, Copy, CheckCircle2 } from "lucide-react"

type Step = "billing" | "payment" | "process"

const planLabels: Record<string, string> = {
  basic: "Básico",
  professional: "Profissional",
  advanced: "Avançado",
}

interface PublicConfig {
  trial_days: number
  plans: {
    [key: string]: {
      limit_professionals: number
      price_monthly: number
      price_yearly: number
      excess_price: number
    }
  }
}


export default function BillingSetupPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BillingSetupContent />
    </Suspense>
  )
}

function BillingSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore()

  const selectedPlan = searchParams.get("plan") || "professional"
  const selectedBilling = searchParams.get("billing") || "MONTHLY"
  const offerToken = searchParams.get("offer") || ""
  const initialUnits = Math.max(2, parseInt(searchParams.get("units") || "2", 10) || 2)
  const [units, setUnits] = useState<number>(initialUnits)

  const [step, setStep] = useState<Step>("billing")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)

  // Coupon/offer state
  const [coupon, setCoupon] = useState(offerToken)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null)

  // Billing form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [document, setDocument] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [address, setAddress] = useState("")
  const [addressNumber, setAddressNumber] = useState("")
  const [province, setProvince] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")

  // Payment method
  const [billingType, setBillingType] = useState<"CREDIT_CARD" | "PIX">("PIX")

  // Credit card fields
  const [cardHolderName, setCardHolderName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiryMonth, setCardExpiryMonth] = useState("")
  const [cardExpiryYear, setCardExpiryYear] = useState("")
  const [cardCvv, setCardCvv] = useState("")

  // PIX state
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState("")
  const [pixPayload, setPixPayload] = useState("")
  const [pixCopied, setPixCopied] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setPhone(user.phone || "")
    }
  }, [user])

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
        const response = await fetch(`${baseUrl}/api/v1/public/config`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          setPublicConfig(data)
        }
      } catch (err) {
        console.error("Failed to fetch config", err)
      }
    }
    fetchConfig()
  }, [])

  // Auto-apply coupon if offer token is present in URL
  useEffect(() => {
    const applyInitialCoupon = async () => {
      if (offerToken && publicConfig) {
        try {
          const response = await api.validateOffer(selectedPlan, offerToken, selectedBilling)
          if (response.valid && response.price !== undefined) {
            setDiscountedPrice(response.price)
            setCouponApplied(true)
          }
        } catch (err) {
          console.error("Failed to auto-apply coupon", err)
        }
      }
    }
    applyInitialCoupon()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerToken, publicConfig])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Creates billing customer + subscription, then handles PIX QR code or redirect
  const handleCreateSubscription = async () => {
    setLoading(true)
    setError("")

    try {
      // Step 1: Create billing customer in Asaas
      await api.createBillingCustomer({
        name,
        email,
        phone,
        document,
        postal_code: postalCode,
        address,
        address_number: addressNumber,
        province,
        city,
        state,
      })

      if (billingType === "PIX") {
        // Step 2: Create subscription (PIX)
        await api.switchPlan({
          plan: selectedPlan as "basic" | "professional" | "advanced",
          billing_type: "PIX",
          cycle: selectedBilling,
          offer_token: coupon || undefined,
          units: selectedPlan === "advanced" ? units : undefined,
        })

        // Step 3: Get subscription payments to find the first pending payment
        const paymentsResponse = await api.getSubscriptionPayments()
        const payments = paymentsResponse?.data || []
        const pendingPayment = payments.find((p: any) => p.status === "PENDING")

        if (pendingPayment) {
          // Step 4: Get PIX QR code for the payment
          const qrResponse = await api.getPaymentPixQRCode(pendingPayment.id)
          setPixQrCodeBase64(qrResponse.encodedImage || "")
          setPixPayload(qrResponse.payload || "")

          // Step 5: Start polling for payment confirmation
          startPaymentPolling()
        }
      } else {
        // Credit Card: Create subscription with card data
        await api.switchPlan({
          plan: selectedPlan as "basic" | "professional" | "advanced",
          billing_type: "CREDIT_CARD",
          cycle: selectedBilling,
          offer_token: coupon || undefined,
          units: selectedPlan === "advanced" ? units : undefined,
          credit_card: {
            holderName: cardHolderName,
            number: cardNumber.replace(/\s/g, ""),
            expiryMonth: cardExpiryMonth,
            expiryYear: cardExpiryYear,
            ccv: cardCvv,
          },
          credit_card_holder_info: {
            name,
            email,
            cpfCnpj: document,
            postalCode,
            phone,
          },
        })

        // Credit card processed - reload user and redirect
        await loadUser()
        router.push("/agenda")
        return
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || "Erro ao processar. Tente novamente."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Polls subscription payments to check if PIX was paid
  const startPaymentPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      try {
        const paymentsResponse = await api.getSubscriptionPayments()
        const payments = paymentsResponse?.data || []
        const confirmedPayment = payments.find((p: any) =>
          p.status === "CONFIRMED" || p.status === "RECEIVED"
        )

        if (confirmedPayment) {
          setPaymentConfirmed(true)
          if (pollingRef.current) clearInterval(pollingRef.current)

          // Reload user and redirect after short delay
          await loadUser()
          setTimeout(() => router.push("/agenda"), 2000)
        }
      } catch {
        // Silently retry
      }
    }, 5000) // Poll every 5 seconds
  }

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixPayload)
    setPixCopied(true)
    setTimeout(() => setPixCopied(false), 3000)
  }

  const stepLabels = billingType === "PIX"
    ? [
        { key: "billing" as Step, label: "Dados de Cobrança" },
        { key: "payment" as Step, label: "Método de Pagamento" },
        { key: "process" as Step, label: "Pagamento PIX" },
      ]
    : [
        { key: "billing" as Step, label: "Dados de Cobrança" },
        { key: "payment" as Step, label: "Método de Pagamento" },
        { key: "process" as Step, label: "Dados do Cartão" },
      ]

  const currentStepIdx = stepLabels.findIndex((s) => s.key === step)

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:text-white"

  const getPlanPrice = (): number => {
    let base: number
    if (couponApplied && discountedPrice !== null) {
      base = discountedPrice
    } else if (!publicConfig?.plans?.[selectedPlan]) {
      return 0
    } else if (selectedBilling === 'YEARLY') {
      base = publicConfig.plans[selectedPlan].price_yearly
    } else {
      base = publicConfig.plans[selectedPlan].price_monthly
    }
    if (selectedPlan === 'advanced') {
      return base * Math.max(2, units)
    }
    return base
  }

  const priceBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getPlanPrice())

  const handleApplyCoupon = async () => {
    setCouponError("")
    if (!coupon.trim()) {
      setCouponError("Digite um código de cupom")
      setCouponApplied(false)
      setDiscountedPrice(null)
      return
    }
    
    try {
      const response = await api.validateOffer(selectedPlan, coupon, selectedBilling)
      if (response.valid && response.price !== undefined) {
        setDiscountedPrice(response.price)
        setCouponApplied(true)
      } else {
        setCouponError("Cupom inválido")
        setCouponApplied(false)
        setDiscountedPrice(null)
      }
    } catch (err: any) {
      setCouponError(err?.response?.data?.error || "Cupom inválido ou expirado")
      setCouponApplied(false)
      setDiscountedPrice(null)
    }
  }

  const priceSummaryBox = (
    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20 mb-6 border border-blue-100 dark:border-blue-800">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">Total a pagar</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Plano {planLabels[selectedPlan] || selectedPlan} ({selectedBilling === "YEARLY" ? "Anual" : "Mensal"})
            {selectedPlan === 'advanced' && ` · ${units} unidades`}
          </p>
        </div>
        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
          {publicConfig ? priceBRL : 'Calculando...'}
        </div>
      </div>
      {selectedPlan === 'advanced' && step !== 'process' && (
        <div className="mt-3 flex items-center justify-between rounded-md bg-white/60 dark:bg-blue-950/30 p-3 border border-blue-100 dark:border-blue-800">
          <div>
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">Quantidade de unidades</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Mínimo 2 unidades</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUnits(u => Math.max(2, u - 1))}
              disabled={units <= 2}
              aria-label="Diminuir unidades"
              className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-blue-200 dark:border-blue-700 bg-white dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 hover:text-white transition-colors"
            >−</button>
            <span aria-live="polite" className="min-w-[1.5rem] text-center font-bold tabular-nums text-blue-900 dark:text-blue-100">{units}</span>
            <button
              type="button"
              onClick={() => setUnits(u => u + 1)}
              aria-label="Aumentar unidades"
              className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-blue-200 dark:border-blue-700 bg-white dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold text-lg hover:bg-blue-600 hover:text-white transition-colors"
            >+</button>
          </div>
        </div>
      )}
      {couponApplied && coupon && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <Check className="h-4 w-4" />
          <span>Cupom aplicado: <strong>{coupon}</strong></span>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Configurar Assinatura
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Plano {planLabels[selectedPlan] || selectedPlan} •{" "}
            {selectedBilling === "YEARLY" ? "Anual" : "Mensal"}
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {stepLabels.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  i <= currentStepIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                }`}
              >
                {i < currentStepIdx ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`hidden text-sm sm:block ${
                  i <= currentStepIdx
                    ? "font-medium text-slate-900 dark:text-white"
                    : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
              {i < stepLabels.length - 1 && (
                <div
                  className={`h-px w-8 ${
                    i < currentStepIdx ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Step 1: Billing Data */}
          {step === "billing" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Nome completo" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">CPF/CNPJ *</label>
                  <input type="text" value={document} onChange={(e) => setDocument(e.target.value)} className={inputClass} placeholder="000.000.000-00" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(11) 99999-9999" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">CEP</label>
                  <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} placeholder="00000-000" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Rua, Avenida..." />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nº</label>
                  <input type="text" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Bairro</label>
                  <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">UF</label>
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className={`${inputClass} uppercase`} />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    if (!name || !document || !email) {
                      setError("Preencha nome, CPF/CNPJ e email")
                      return
                    }
                    setError("")
                    setStep("payment")
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === "payment" && (
            <div className="space-y-4">
              {/* Coupon input */}
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Cupom de desconto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value)
                      setCouponApplied(false)
                      setCouponError("")
                    }}
                    className={inputClass}
                    placeholder="Digite seu cupom"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponApplied && coupon.trim() !== ""}
                    className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {couponApplied ? "Aplicado" : "Aplicar"}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{couponError}</p>
                )}
                {couponApplied && coupon && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <Check className="h-3 w-3" />
                    Cupom aplicado com sucesso
                  </p>
                )}
              </div>

              {priceSummaryBox}
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Escolha como deseja pagar sua assinatura:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setBillingType("PIX")}
                  className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                    billingType === "PIX"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <QrCode className={`h-10 w-10 ${billingType === "PIX" ? "text-primary" : "text-slate-400"}`} />
                  <span className="font-medium">PIX</span>
                  <span className="text-xs text-slate-500">Pagamento instantâneo</span>
                </button>

                <button
                  onClick={() => setBillingType("CREDIT_CARD")}
                  className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                    billingType === "CREDIT_CARD"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <CreditCard className={`h-10 w-10 ${billingType === "CREDIT_CARD" ? "text-primary" : "text-slate-400"}`} />
                  <span className="font-medium">Cartão de Crédito</span>
                  <span className="text-xs text-slate-500">Recorrente automático</span>
                </button>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep("billing")}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button
                  onClick={() => {
                    setStep("process")
                    if (billingType === "PIX") {
                      handleCreateSubscription()
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: PIX QR Code */}
          {step === "process" && billingType === "PIX" && (
            <div className="space-y-4">
              {priceSummaryBox}
              {loading && !pixQrCodeBase64 ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Gerando QR Code PIX...
                  </p>
                </div>
              ) : paymentConfirmed ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                    Pagamento confirmado!
                  </h3>
                  <p className="text-sm text-slate-500">
                    Redirecionando para o dashboard...
                  </p>
                </div>
              ) : pixQrCodeBase64 ? (
                <>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Escaneie o QR Code para pagar
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Abra o app do seu banco e escaneie o código abaixo
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="rounded-xl border-2 border-slate-200 bg-white p-4 dark:border-slate-700">
                      <img
                        src={`data:image/png;base64,${pixQrCodeBase64}`}
                        alt="QR Code PIX"
                        className="h-56 w-56"
                      />
                    </div>
                  </div>

                  {pixPayload && (
                    <div className="space-y-2">
                      <p className="text-center text-xs text-slate-500">
                        Ou copie o código PIX:
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={pixPayload}
                          className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        />
                        <button
                          onClick={copyPixCode}
                          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                        >
                          {pixCopied ? (
                            <><Check className="h-4 w-4 text-green-500" /> Copiado</>
                          ) : (
                            <><Copy className="h-4 w-4" /> Copiar</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-400">
                      Aguardando confirmação do pagamento...
                    </span>
                  </div>
                </>
              ) : null}

              <div className="flex justify-start pt-2">
                <button
                  onClick={() => {
                    if (pollingRef.current) clearInterval(pollingRef.current)
                    setPixQrCodeBase64("")
                    setPixPayload("")
                    setStep("payment")
                  }}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Credit Card Form */}
          {step === "process" && billingType === "CREDIT_CARD" && (
            <div className="space-y-4">
              {priceSummaryBox}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome no Cartão *</label>
                <input
                  type="text"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  className={inputClass}
                  placeholder="NOME COMO NO CARTÃO"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Número do Cartão *</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16)
                    setCardNumber(v.replace(/(\d{4})/g, "$1 ").trim())
                  }}
                  className={inputClass}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
              </div>

              <div className="grid gap-4 grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mês *</label>
                  <input
                    type="text"
                    value={cardExpiryMonth}
                    onChange={(e) => setCardExpiryMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    className={inputClass}
                    placeholder="MM"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Ano *</label>
                  <input
                    type="text"
                    value={cardExpiryYear}
                    onChange={(e) => setCardExpiryYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className={inputClass}
                    placeholder="AAAA"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">CVV *</label>
                  <input
                    type="text"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className={inputClass}
                    placeholder="000"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep("payment")}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button
                  onClick={() => {
                    if (!cardHolderName || !cardNumber || !cardExpiryMonth || !cardExpiryYear || !cardCvv) {
                      setError("Preencha todos os dados do cartão")
                      return
                    }
                    setError("")
                    handleCreateSubscription()
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Assinar Agora
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
