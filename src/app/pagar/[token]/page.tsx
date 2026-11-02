"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
  CheckCircle,
  Loader2,
  Copy,
  QrCode,
  CreditCard,
  Lock,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { api } from "@/lib/api/client"

// ─── Helpers ───

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatPriceParts(value: number): { integer: string; decimal: string } {
  const parts = value.toFixed(2).split(".")
  const integer = Number(parts[0]).toLocaleString("pt-BR")
  return { integer, decimal: parts[1] }
}

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

// ─── Types ───

interface PageData {
  appointment_id: string
  clinic_id: string
  clinic_name?: string
  professional?: string
  start_time: string
  end_time: string
  price: number
  payment_status: string
  status: string
  remaining_seconds: number
  has_subaccount: boolean
  existing_payment?: {
    id: string
    status: string
    pix_qrcode_image?: string
    pix_copy_paste?: string
    billing_type: string
  }
}

// ─── Component ───

export default function PagarPage() {
  const params = useParams()
  const token = params.token as string

  // Page data
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ title: string; description: string } | null>(null)

  // Payment state
  const [activeTab, setActiveTab] = useState<"pix" | "card">("pix")
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  // PIX state
  const [pixData, setPixData] = useState<{ pix_qrcode_image?: string; pix_copy_paste?: string } | null>(null)
  const [pixLoading, setPixLoading] = useState(false)
  const [pixError, setPixError] = useState("")
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrExpanded, setQrExpanded] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)

  // Card state
  const [cardHolder, setCardHolder] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardCpf, setCardCpf] = useState("")
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState("")

  // CPF for PIX (shown when needed)
  const [pixCpf, setPixCpf] = useState("")

  // Refs
  const pixChargeCreated = useRef(false)

  // ─── Load page data ───

  useEffect(() => {
    if (!token) return

    async function loadData() {
      try {
        const data = await api.getPaymentPageData(token)
        setPageData(data)

        // Check for already-confirmed payment
        if (
          data.existing_payment &&
          (data.existing_payment.status === "RECEIVED" || data.existing_payment.status === "CONFIRMED")
        ) {
          setPaymentConfirmed(true)
          return
        }

        // Check error states
        if (data.remaining_seconds <= 0) {
          setError({
            title: "Prazo de pagamento expirado",
            description:
              "O prazo para pagamento deste agendamento expirou. Entre em contato com a clinica para reagendar.",
          })
          return
        }

        if (data.status === "canceled") {
          setError({
            title: "Agendamento cancelado",
            description:
              "Este agendamento foi cancelado. Entre em contato com a clinica se precisar de mais informacoes.",
          })
          return
        }

        if (!data.has_subaccount) {
          setError({
            title: "Pagamento indisponivel",
            description:
              "A clinica ainda nao configurou o recebimento de pagamentos online. Entre em contato diretamente com a clinica.",
          })
          return
        }

        // Set timer from API
        setTimerSeconds(data.remaining_seconds)

        // If there's an existing PENDING PIX payment, reuse it
        if (
          data.existing_payment &&
          data.existing_payment.status === "PENDING" &&
          data.existing_payment.pix_qrcode_image
        ) {
          setPaymentId(data.existing_payment.id)
          setPixData({
            pix_qrcode_image: data.existing_payment.pix_qrcode_image,
            pix_copy_paste: data.existing_payment.pix_copy_paste,
          })
          pixChargeCreated.current = true
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          setError({
            title: "Link invalido",
            description: "Este link de pagamento nao foi encontrado. Verifique se o link esta correto.",
          })
        } else {
          setError({
            title: "Erro ao carregar pagamento",
            description: "Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token])

  // ─── Auto-create PIX charge ───

  const createPixCharge = useCallback(async () => {
    if (pixChargeCreated.current || pixLoading || pixData) return
    if (!pixCpf || pixCpf.length < 11) return

    pixChargeCreated.current = true
    setPixLoading(true)
    setPixError("")

    try {
      const charge = await api.createChargeByToken(token, {
        billing_type: "PIX",
        customer_name: "Paciente",
        customer_cpf_cnpj: pixCpf.replace(/\D/g, ""),
      })
      setPaymentId(charge.id)
      setPixData({
        pix_qrcode_image: charge.pix_qrcode_image,
        pix_copy_paste: charge.pix_copy_paste,
      })
    } catch {
      setPixError("Erro ao gerar o QR Code. Tente novamente.")
      pixChargeCreated.current = false
    } finally {
      setPixLoading(false)
    }
  }, [token, pixCpf, pixLoading, pixData])

  // ─── Poll payment status for PIX ───

  useEffect(() => {
    if (activeTab !== "pix" || !paymentId || paymentConfirmed) return
    const interval = setInterval(async () => {
      try {
        const data = await api.getMarketplaceChargeStatus(paymentId)
        if (data.status === "RECEIVED" || data.status === "CONFIRMED") {
          setPaymentConfirmed(true)
          clearInterval(interval)
        }
      } catch {
        /* ignore polling errors */
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [activeTab, paymentId, paymentConfirmed])

  // ─── PIX countdown timer ───

  useEffect(() => {
    if (!pageData || error || paymentConfirmed) return
    if (timerSeconds <= 0) return

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [pageData, error, paymentConfirmed, timerSeconds])

  // ─── Handlers ───

  function handleCopyPix() {
    if (pixData?.pix_copy_paste) {
      navigator.clipboard.writeText(pixData.pix_copy_paste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handlePayCard() {
    if (!cardHolder || !cardNumber || !cardExpiry || !cardCvv || !cardCpf) return
    const [expiryMonth, expiryYear] = cardExpiry.split("/")
    setCardLoading(true)
    setCardError("")
    try {
      const charge = await api.createChargeByToken(token, {
        billing_type: "CREDIT_CARD",
        customer_name: cardHolder,
        customer_cpf_cnpj: cardCpf.replace(/\D/g, ""),
        credit_card: {
          holderName: cardHolder,
          number: cardNumber.replace(/\s/g, ""),
          expiryMonth: expiryMonth?.trim(),
          expiryYear: "20" + (expiryYear?.trim() || ""),
          ccv: cardCvv,
        },
        credit_card_holder_info: {
          name: cardHolder,
          email: "",
          cpfCnpj: cardCpf.replace(/\D/g, ""),
          postalCode: "",
          phone: "",
        },
      })
      if (charge.status === "CONFIRMED" || charge.status === "RECEIVED") {
        setPaymentConfirmed(true)
      } else {
        setPaymentId(charge.id)
        setPaymentConfirmed(true)
      }
    } catch {
      setCardError("Pagamento recusado. Verifique os dados e tente novamente.")
    } finally {
      setCardLoading(false)
    }
  }

  function handlePixCpfSubmit() {
    const cleaned = pixCpf.replace(/\D/g, "")
    if (cleaned.length >= 11) {
      createPixCharge()
    }
  }

  // ─── Loading state ───

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          <p className="text-sm text-slate-500">Carregando...</p>
        </div>
      </div>
    )
  }

  // ─── Error state ───

  if (error) {
    const isExpired = error.title === "Prazo de pagamento expirado"
    const isCanceled = error.title === "Agendamento cancelado"

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[560px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isCanceled ? "bg-red-50" : isExpired ? "bg-amber-50" : "bg-slate-100"
              }`}
            >
              {isCanceled ? (
                <XCircle className="h-10 w-10 text-red-500" />
              ) : isExpired ? (
                <Clock className="h-10 w-10 text-amber-500" />
              ) : (
                <AlertCircle className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">{error.title}</h2>
            <p className="text-sm text-slate-500">{error.description}</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Payment confirmed ───

  if (paymentConfirmed && pageData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[560px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Pagamento confirmado!</h2>
            <p className="text-sm text-slate-500 mb-6">
              Seu pagamento de {formatCurrency(pageData.price)} foi recebido com sucesso.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-1.5 border border-slate-100">
              {pageData.professional && (
                <p>
                  <span className="font-medium text-slate-700">Profissional:</span>{" "}
                  <span className="text-slate-600">{pageData.professional}</span>
                </p>
              )}
              {pageData.clinic_name && (
                <p>
                  <span className="font-medium text-slate-700">Clinica:</span>{" "}
                  <span className="text-slate-600">{pageData.clinic_name}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Payment form ───

  if (!pageData) return null

  const priceParts = formatPriceParts(pageData.price)
  const isCardValid = cardHolder && cardNumber && cardExpiry && cardCvv && cardCpf
  const timerExpired = timerSeconds <= 0

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[560px]">
        {/* Clinic name */}
        {pageData.clinic_name && (
          <p className="text-center text-sm text-slate-400 mb-4">{pageData.clinic_name}</p>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header - Total a pagar */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total a pagar</p>
              <p className="text-4xl font-bold text-slate-900 leading-none tracking-tight">
                <span className="text-lg font-medium text-slate-500 align-super">R$</span> {priceParts.integer}
                ,{priceParts.decimal}
              </p>
            </div>
            {pageData.professional && (
              <span className="bg-cyan-50 text-cyan-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-cyan-200">
                {pageData.professional}
              </span>
            )}
          </div>

          {/* Method tabs */}
          <div className="grid grid-cols-2 gap-3 px-6 pt-5">
            <button
              onClick={() => setActiveTab("pix")}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-[1.5px] text-left transition-all ${
                activeTab === "pix"
                  ? "border-cyan-600 bg-cyan-50/60 shadow-[0_0_0_4px_rgba(8,145,178,0.1)]"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="w-9 h-9 rounded-[10px] bg-cyan-600 flex items-center justify-center flex-shrink-0">
                <QrCode className="h-[18px] w-[18px] text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">PIX</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Aprovacao imediata</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("card")}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-[1.5px] text-left transition-all ${
                activeTab === "card"
                  ? "border-slate-800 bg-slate-50 shadow-[0_0_0_4px_rgba(30,41,59,0.08)]"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="w-9 h-9 rounded-[10px] bg-slate-800 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-[18px] w-[18px] text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Cartao</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Credito</p>
              </div>
            </button>
          </div>

          {/* Content area */}
          <div className="px-6 pt-5 pb-6">
            <div className="h-px bg-slate-100 mb-5" />

            {/* Timer (shared between tabs) */}
            <div className="flex items-center justify-center gap-1.5 mb-4 text-xs text-slate-400">
              <Clock className={`h-3 w-3 ${timerExpired ? "text-red-500" : "text-amber-500"}`} />
              {timerExpired ? (
                <span className="text-red-500 font-medium">Prazo expirado</span>
              ) : (
                <span>
                  Expira em <strong className="text-amber-600">{formatTimer(timerSeconds)}</strong>
                </span>
              )}
            </div>

            {/* ── PIX Panel ── */}
            {activeTab === "pix" && (
              <div>
                {timerExpired ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-500">
                      O prazo para pagamento expirou. Entre em contato com a clinica.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* CPF input (before QR code is generated) */}
                    {!pixData && !pixLoading && !pixError && (
                      <div className="space-y-3">
                        <p className="text-[13px] text-slate-500 text-center mb-2">
                          Informe seu CPF para gerar o QR Code PIX.
                        </p>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide">
                            CPF
                          </label>
                          <input
                            type="text"
                            value={pixCpf}
                            maxLength={14}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "").slice(0, 11)
                              setPixCpf(v)
                            }}
                            placeholder="000.000.000-00"
                            className="w-full px-3.5 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-900 bg-white placeholder:text-slate-300 focus:outline-none focus:border-cyan-600 focus:shadow-[0_0_0_3px_rgba(8,145,178,0.12)] transition-all"
                          />
                        </div>
                        <button
                          onClick={handlePixCpfSubmit}
                          disabled={pixCpf.replace(/\D/g, "").length < 11}
                          className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white rounded-xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                        >
                          Gerar QR Code PIX
                        </button>
                      </div>
                    )}

                    {pixLoading && (
                      <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mb-3" />
                        <p className="text-sm text-slate-500">Gerando QR Code...</p>
                      </div>
                    )}

                    {pixError && (
                      <div className="text-center py-8">
                        <p className="text-sm text-red-500 mb-3">{pixError}</p>
                        <button
                          onClick={() => {
                            setPixError("")
                            setPixData(null)
                          }}
                          className="text-sm text-cyan-600 hover:underline"
                        >
                          Tentar novamente
                        </button>
                      </div>
                    )}

                    {pixData && !pixLoading && (
                      <>
                        <p className="text-[13px] text-slate-500 text-center mb-4">
                          Abra o app do seu banco, acesse a area PIX e escaneie o QR Code abaixo.
                        </p>

                        {/* QR Code */}
                        <div className="flex flex-col items-center mb-4">
                          {pixData.pix_qrcode_image ? (
                            <button
                              onClick={() => setQrExpanded(!qrExpanded)}
                              className="bg-transparent border-none cursor-pointer p-0 transition-transform hover:scale-[1.02]"
                            >
                              <div
                                className={`${qrExpanded ? "w-[280px] h-[280px]" : "w-[200px] h-[200px]"} rounded-2xl border-[1.5px] border-slate-200 flex items-center justify-center bg-white p-3 transition-all duration-200`}
                              >
                                <img
                                  src={`data:image/png;base64,${pixData.pix_qrcode_image}`}
                                  alt="QR Code PIX"
                                  className="w-full h-full"
                                />
                              </div>
                            </button>
                          ) : (
                            <div className="w-[200px] h-[200px] rounded-2xl border-[1.5px] border-slate-200 flex items-center justify-center bg-slate-50">
                              <QrCode className="h-12 w-12 text-slate-300" />
                            </div>
                          )}
                          <button
                            onClick={() => setQrExpanded(!qrExpanded)}
                            className="mt-2 text-xs text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                          >
                            {qrExpanded ? "Reduzir" : "Ampliar QR Code"}
                          </button>
                        </div>

                        {/* Copy key */}
                        {pixData.pix_copy_paste && (
                          <div className="flex items-center gap-2 bg-slate-50 rounded-[10px] p-2.5 border border-slate-200 mb-4">
                            <span className="flex-1 text-xs font-mono text-slate-900 truncate">
                              {pixData.pix_copy_paste}
                            </span>
                            <button
                              onClick={handleCopyPix}
                              className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-[7px] transition-colors flex items-center gap-1"
                            >
                              {copied ? (
                                "Copiado!"
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  Copiar
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Waiting indicator */}
                        <div className="flex items-center justify-center gap-2 py-3 bg-cyan-50/50 rounded-xl border border-cyan-100">
                          <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
                          <span className="text-sm text-cyan-700">Aguardando pagamento...</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Card Panel ── */}
            {activeTab === "card" && (
              <div>
                {timerExpired ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-500">
                      O prazo para pagamento expirou. Entre em contato com a clinica.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide">
                        Nome no cartao
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="Como esta impresso no cartao"
                        className="w-full px-3.5 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-900 bg-white placeholder:text-slate-300 focus:outline-none focus:border-cyan-600 focus:shadow-[0_0_0_3px_rgba(8,145,178,0.12)] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide">
                        Numero do cartao
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          maxLength={19}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 16)
                            setCardNumber(v.replace(/(\d{4})(?=\d)/g, "$1 "))
                          }}
                          placeholder="0000 0000 0000 0000"
                          className="w-full px-3.5 py-3 pr-[72px] border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-900 bg-white placeholder:text-slate-300 focus:outline-none focus:border-cyan-600 focus:shadow-[0_0_0_3px_rgba(8,145,178,0.12)] transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 items-center">
                          <span className="text-[9px] font-bold bg-[#1A1F71] text-white px-1.5 py-0.5 rounded">
                            VISA
                          </span>
                          <span className="text-[9px] font-bold bg-[#EB001B] text-white px-1.5 py-0.5 rounded">
                            MC
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide">
                          Validade
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          maxLength={5}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "").slice(0, 4)
                            if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2)
                            setCardExpiry(v)
                          }}
                          placeholder="MM/AA"
                          className="w-full px-3.5 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-900 bg-white placeholder:text-slate-300 focus:outline-none focus:border-cyan-600 focus:shadow-[0_0_0_3px_rgba(8,145,178,0.12)] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardCvv}
                          maxLength={4}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="123"
                          className="w-full px-3.5 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-900 bg-white placeholder:text-slate-300 focus:outline-none focus:border-cyan-600 focus:shadow-[0_0_0_3px_rgba(8,145,178,0.12)] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide">
                        CPF do titular
                      </label>
                      <input
                        type="text"
                        value={cardCpf}
                        maxLength={14}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 11)
                          setCardCpf(v)
                        }}
                        placeholder="000.000.000-00"
                        className="w-full px-3.5 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-900 bg-white placeholder:text-slate-300 focus:outline-none focus:border-cyan-600 focus:shadow-[0_0_0_3px_rgba(8,145,178,0.12)] transition-all"
                      />
                    </div>

                    {cardError && <p className="text-sm text-red-500 text-center py-1">{cardError}</p>}

                    <button
                      onClick={handlePayCard}
                      disabled={!isCardValid || cardLoading}
                      className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 mt-2 disabled:cursor-not-allowed"
                    >
                      {cardLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                        </>
                      ) : (
                        <>Pagar {formatCurrency(pageData.price)}</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Trust badge */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <Lock className="h-3 w-3 text-slate-300" />
              <p className="text-xs text-slate-300">Pagamento seguro e criptografado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
