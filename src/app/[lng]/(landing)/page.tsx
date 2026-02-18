'use client'

import { use, useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import {
  Calendar,
  MessageSquare,
  RefreshCw,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
  BarChart3,
  Bell,
  Smartphone,
  Zap,
  Check,
  Quote,
  Shield,
  FileText,
  UserCog,
  HelpCircle
} from 'lucide-react'

interface PageProps {
  params: Promise<{ lng: string }>
}

interface PublicConfig {
  trial_days: number
  plans: {
    [key: string]: {
      limit_professionals: number
      price_monthly: number
      excess_price: number
    }
  }
}

export default function LandingPage(props: PageProps) {
  const params = use(props.params)
  const router = useRouter()
  const { t } = useTranslation(params.lng, 'landing')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually')
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)

  // Fetch public config for dynamic pricing
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // NEXT_PUBLIC_API_URL may or may not include /api/v1, so we use the base URL
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
        console.log('[Landing] Fetching config from:', `${baseUrl}/api/v1/public/config`)
        const response = await fetch(`${baseUrl}/api/v1/public/config`)
        if (response.ok) {
          const data = await response.json()
          console.log('[Landing] Config loaded:', data)
          setPublicConfig(data)
        } else {
          console.error('[Landing] Failed to fetch config:', response.status)
        }
      } catch (err) {
        console.error('[Landing] Error fetching config:', err)
      }
    }
    fetchConfig()
  }, [])

  const benefits = [
    { icon: CheckCircle2, ...t('benefits.items.0', { returnObjects: true }) as { title: string; description: string } },
    { icon: RefreshCw, ...t('benefits.items.1', { returnObjects: true }) as { title: string; description: string } },
    { icon: Users, ...t('benefits.items.2', { returnObjects: true }) as { title: string; description: string } },
    { icon: Clock, ...t('benefits.items.3', { returnObjects: true }) as { title: string; description: string } },
    { icon: Calendar, ...t('benefits.items.4', { returnObjects: true }) as { title: string; description: string } },
    { icon: MessageSquare, ...t('benefits.items.5', { returnObjects: true }) as { title: string; description: string } },
  ]

  const steps = [
    t('howItWorks.steps.0', { returnObjects: true }) as { step: string; title: string; description: string },
    t('howItWorks.steps.1', { returnObjects: true }) as { step: string; title: string; description: string },
    t('howItWorks.steps.2', { returnObjects: true }) as { step: string; title: string; description: string },
    t('howItWorks.steps.3', { returnObjects: true }) as { step: string; title: string; description: string },
  ]

  const features = [
    { icon: Calendar, title: 'Agenda Online', description: 'Gerencie todos os agendamentos em uma interface intuitiva' },
    { icon: MessageSquare, title: 'WhatsApp Integrado', description: 'Confirmações e lembretes automáticos via WhatsApp' },
    { icon: RefreshCw, title: 'Reagendamento Fácil', description: 'Pacientes podem reagendar sem ligar para a clínica' },
    { icon: BarChart3, title: 'Relatórios', description: 'Acompanhe métricas importantes do seu consultório' },
    { icon: UserCog, title: 'Controle de Acesso', description: 'Permissões por função: admin, recepção e profissional' },
    { icon: FileText, title: 'Ficha do Paciente', description: 'Histórico básico de atendimentos do paciente' },
    { icon: Shield, title: 'Segurança', description: 'Dados protegidos e acesso seguro para sua equipe' },
    { icon: Smartphone, title: 'Mobile First', description: 'Acesse de qualquer dispositivo, a qualquer hora' },
  ]

  const stats = [
    { value: '50%', label: 'Redução de faltas' },
    { value: '3h', label: 'Economizadas por dia' },
    { value: '95%', label: 'Taxa de confirmação' },
    { value: '24/7', label: 'Disponibilidade' },
  ]

  const testimonials = [
    {
      text: "Desde que implementamos o Aseno, nossas faltas caíram drasticamente. A confirmação automática pelo WhatsApp é um divisor de águas para nossa recepção.",
      author: "Clínica Vitalitá"
    },
    {
      text: "Os relatórios de prejuízo abriram nossos olhos. Recuperamos muito dinheiro apenas ajustando os horários de maior risco identificados pelo sistema.",
      author: "OdontoPlus"
    },
    {
      text: "A lista de espera automática é mágica. Quando um paciente cancela, o sistema preenche a vaga sozinho em minutos. Incrível!",
      author: "Instituto Mente Sã"
    },
    {
      text: "A integração com o Google Calendar facilitou muito minha vida. Meus horários pessoais e profissionais finalmente estão em sintonia total.",
      author: "FisioCenter"
    },
    {
      text: "Saber o risco de falta do paciente antes de agendar mudou nossa estratégia. Agora confirmamos com mais rigor quem tem risco alto.",
      author: "DermatoEstética"
    },
    {
      text: "Nossa recepcionista economiza horas todos os dias. O Aseno faz o trabalho pesado de confirmar e reagendar os pacientes automaticamente.",
      author: "Clínica Bem Estar"
    },
    {
      text: "Interface limpa e muito fácil de usar. Treinei minha equipe em dez minutos e todos já estavam usando perfeitamente.",
      author: "NutriVida"
    },
    {
      text: "O sistema de encaixe automático pagou a mensalidade no primeiro dia. Nunca mais ficamos com buracos na agenda por cancelamentos.",
      author: "Psicologia Avançada"
    },
    {
      text: "O melhor investimento que fizemos este ano. A redução de no-shows foi imediata e o suporte é sempre muito atencioso.",
      author: "Clínica Sorriso"
    },
    {
      text: "Sincronização perfeita com minha agenda do Google. Não preciso mais abrir dois aplicativos para saber meu dia. Recomendo o plano profissional.",
      author: "Dr. Lucas Oftalmologia"
    },
    {
      text: "Eu não sabia quanto dinheiro perdia com faltas até ver o painel do Aseno. Agora temos controle total do nosso faturamento.",
      author: "Espaço Terapêutico"
    },
    {
      text: "A automação inteligente nas respostas do WhatsApp é impressionante. Ela entende o paciente e resolve a agenda sem intervenção humana.",
      author: "Clínica da Família"
    },
    {
      text: "O plano profissional vale cada centavo. As ferramentas de risco e lista de espera trouxeram um retorno financeiro gigante para nós.",
      author: "CardioMed"
    }
  ]

  // Get price for a plan - uses dynamic config if available, fallback to translations
  const getPlanPrice = (plan: 'basic' | 'professional' | 'advanced'): number => {
    if (publicConfig?.plans?.[plan]) {
      return publicConfig.plans[plan].price_monthly
    }
    // Fallback to static translations
    return parseInt(t(`pricing.plans.${plan}.price`) as string) || 0
  }

  // Get limit for a plan - uses dynamic config if available
  const getPlanLimit = (plan: 'basic' | 'professional' | 'advanced'): number => {
    if (publicConfig?.plans?.[plan]) {
      return publicConfig.plans[plan].limit_professionals
    }
    // Fallback defaults
    const defaults: Record<string, number> = { basic: 5, professional: 15, advanced: -1 }
    return defaults[plan] || 0
  }

  // Get limit text for display
  const getPlanLimitText = (plan: 'basic' | 'professional' | 'advanced'): string => {
    const limit = getPlanLimit(plan)
    if (limit === -1) {
      return params.lng === 'en' ? 'Unlimited professionals' : 'Profissionais ilimitados'
    }
    return params.lng === 'en' ? `Up to ${limit} professionals` : `Até ${limit} profissionais`
  }

  // Get features for a plan with dynamic limit
  const getPlanFeatures = (plan: 'basic' | 'professional' | 'advanced'): string[] => {
    const features = t(`pricing.plans.${plan}.features`, { returnObjects: true }) as string[]
    // Replace the first feature (limit text) with dynamic value
    return [getPlanLimitText(plan), ...features.slice(1)]
  }

  const calculateMonthlyPrice = (basePrice: number) => {
    if (billingCycle === 'monthly') return basePrice.toString()
    // Annual price is 10x monthly price, divided by 12 months for display
    return Math.round((basePrice * 10) / 12).toString()
  }

  // Get trial days from config or fallback
  const getTrialDays = (): number => {
    return publicConfig?.trial_days || 14
  }

  // Get trial text for display
  const getTrialText = (): string => {
    const days = getTrialDays()
    if (params.lng === 'en') {
      return `Start with ${days} days free on Professional plan. No credit card required.`
    }
    return `Comece com ${days} dias grátis no plano Profissional. Sem cartão de crédito.`
  }

  // Get CTA trial button text
  const getTrialCtaText = (): string => {
    const days = getTrialDays()
    if (params.lng === 'en') {
      return `Try free for ${days} days`
    }
    return `Testar grátis por ${days} dias`
  }

  // Get FAQ trial text
  const getFaqTrialText = (): string => {
    const days = getTrialDays()
    if (params.lng === 'en') {
      return `No. Free trial for ${days} days without a credit card.`
    }
    return `Não. Teste grátis por ${days} dias sem precisar de cartão de crédito.`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="relative h-10 w-10">
            <Image 
              src="/logo-icon.png" 
              alt="Aseno" 
              fill 
              className="object-contain" 
            />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-foreground/20 text-foreground hover:bg-foreground/10"
              onClick={() => router.push(`/${params.lng}/login`)}
            >
              Login
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const url = new URL(`/${params.lng}/register`, window.location.origin)
                url.searchParams.set('plan', 'trial')
                url.searchParams.set('billing', 'monthly')
                router.push(url.pathname + url.search)
              }}
            >
              {getTrialCtaText()}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/30 rounded-full blur-[120px] opacity-20" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Automatize seu consultório</span>
            </div>

            <h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-foreground text-white">
              {t('hero.headline')}
            </h1>

            <p className="mt-6 text-xl text-foreground/80 max-w-2xl mx-auto text-white/90">
              {t('hero.subheadline')}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 h-14"
                onClick={() => {
                  const url = new URL(`/${params.lng}/register`, window.location.origin)
                  url.searchParams.set('plan', 'trial')
                  url.searchParams.set('billing', 'monthly')
                  router.push(url.pathname + url.search)
                }}
              >
                {getTrialCtaText()}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-white/20 hover:bg-white/5 text-white">
                Ver demonstração
              </Button>
            </div>

            <p className="mt-4 text-sm text-foreground/60 text-white/60">
              {t('form.noCard')}
            </p>
          </div>

          {/* Product Mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass-card p-2 md:p-4 max-w-5xl mx-auto">
              <div className="bg-card rounded-xl overflow-hidden border border-white/10">
                {/* Mock Dashboard */}
                <div className="bg-muted/50 px-4 py-2 border-b border-white/10 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-background/50 rounded px-4 py-1 text-xs text-muted-foreground">
                      app.aseno.com.br/dashboard
                    </div>
                  </div>
                </div>
                <div className="p-6 min-h-[300px] md:min-h-[400px]">
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-background/50 rounded-lg p-4 border border-white/5">
                      <div className="text-sm text-muted-foreground mb-1">Agendamentos Hoje</div>
                      <div className="text-2xl font-bold text-primary text-white">12</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-white/5">
                      <div className="text-sm text-muted-foreground mb-1">Confirmados</div>
                      <div className="text-2xl font-bold text-green-500">10</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-white/5">
                      <div className="text-sm text-muted-foreground mb-1">Pendentes</div>
                      <div className="text-2xl font-bold text-yellow-500">2</div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-lg p-4 border border-white/5">
                      <div className="text-sm font-medium mb-3 text-white">Próximos Pacientes</div>
                      <div className="space-y-3">
                        {['Maria Silva - 09:00', 'João Santos - 09:30', 'Ana Costa - 10:00'].map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground text-white/70">{item}</span>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Confirmado</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-white/5">
                      <div className="text-sm font-medium mb-3 text-white">Mensagens WhatsApp</div>
                      <div className="space-y-3">
                        {['Lembrete enviado para Maria', 'João confirmou presença', 'Ana solicitou reagendamento'].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground text-white/70">
                            <MessageSquare className="h-3 w-3 text-green-500" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary font-poppins text-white">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1 text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/40 mt-6">
            *Resultados médios observados em clínicas ativas
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-4 text-foreground text-white">
              {t('benefits.title')}
            </h2>
            <p className="text-foreground/70 text-lg text-white/70">
              Todas as ferramentas que você precisa para gerenciar sua clínica de forma eficiente
            </p>
          </div>

          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 3000,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
            className="w-full max-w-6xl mx-auto cursor-grab active:cursor-grabbing"
          >
            <CarouselContent>
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-6">
                    <Card className="bg-card/50 border-white/10 hover:border-primary/50 transition-colors group h-full">
                      <CardHeader className="text-center">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors mx-auto">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-poppins text-white">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-foreground/70 text-white/70">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12 border-white/10 hover:bg-white/10 text-white" />
              <CarouselNext className="-right-12 border-white/10 hover:bg-white/10 text-white" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* Benefits Highlight Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-6 text-foreground text-white">
                Software que sua equipe vai adorar usar
              </h2>
              <p className="text-foreground/70 text-lg mb-8 text-white/70">
                Interface intuitiva, fácil de aprender e usar. Sua equipe estará produtiva em minutos, não em semanas.
              </p>
              <ul className="space-y-4">
                {[
                  'Confirmação automática via WhatsApp',
                  'Reagendamento em 1 clique pelo paciente',
                  'Relatórios de presença e faturamento',
                  'Integração com Google Calendar',
                  'Suporte técnico em português',
                  'Atualizações constantes gratuitas'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="glass-card p-6">
                <div className="bg-card rounded-xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">WhatsApp Automatizado</div>
                      <div className="text-xs text-white/70 font-medium italic">(Automação inteligente cuida da parte chata)</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-background/50 rounded-lg p-3 border border-white/5">
                      <div className="text-xs text-muted-foreground mb-1 text-white/50">08:00</div>
                      <div className="text-sm text-white/90">Olá Maria! Lembrete: consulta amanhã às 14h. Consegue comparecer amanhã?</div>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3 border border-primary/20 ml-8">
                      <div className="text-xs text-muted-foreground mb-1 text-primary/70">08:05</div>
                      <div className="text-sm text-white/90">Vou levar minha filha na escola e chego no máximo às 14 e 05</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border border-white/5">
                      <div className="text-xs text-muted-foreground mb-1 text-white/50">08:05</div>
                      <div className="text-sm text-white/90">Perfeito! Sem problemas! Sua consulta está confirmada. Até amanhã!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-4 text-foreground text-white">
              {t('howItWorks.title')}
            </h2>
            <p className="text-foreground/70 text-lg text-white/70">
              Comece a usar em menos de 5 minutos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 font-poppins">
                  {step.step}
                </div>
                <h3 className="font-poppins font-semibold text-lg mb-2 text-foreground text-white">{step.title}</h3>
                <p className="text-foreground/70 text-white/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para Quem É Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-4 text-foreground text-white">
              Para quem é o Aseno?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card/50 border border-white/10 rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-white mb-2">Clínicas pequenas e médias</h3>
              <p className="text-sm text-white/70">De 1 a 20 profissionais que buscam eficiência</p>
            </div>
            <div className="bg-card/50 border border-white/10 rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-white mb-2">Consultórios com agenda recorrente</h3>
              <p className="text-sm text-white/70">Sessões, retornos e tratamentos contínuos</p>
            </div>
            <div className="bg-card/50 border border-white/10 rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-white mb-2">Equipes que usam WhatsApp</h3>
              <p className="text-sm text-white/70">Para comunicação com pacientes no dia a dia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-background border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-4 text-foreground text-white">
              Quem usa, recomenda
            </h2>
            <p className="text-foreground/70 text-lg text-white/70">
              Junte-se a clínicas que transformaram sua gestão
            </p>
          </div>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
            className="w-full max-w-6xl mx-auto cursor-grab active:cursor-grabbing"
          >
            <CarouselContent>
              {testimonials.map((t, i) => (
                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3 pl-6">
                  <Card className="bg-card/50 border-white/10 h-full">
                    <CardContent className="pt-6 flex flex-col justify-between h-full">
                      <div>
                        <div className="mb-4 text-primary opacity-80">
                          <Quote className="h-6 w-6" />
                        </div>
                        <p className="text-white/80 italic mb-4 leading-relaxed">"{t.text}"</p>
                      </div>
                      <p className="text-sm font-semibold text-primary mt-auto">{t.author}</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12 border-white/10 hover:bg-white/10 text-white" />
              <CarouselNext className="-right-12 border-white/10 hover:bg-white/10 text-white" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-4 text-foreground text-white">
              {t('pricing.title')}
            </h2>
            <p className="text-foreground/70 text-lg text-white/70 mb-8">
              {getTrialText()}
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-bold' : 'text-white/60'}`}>
                {t('pricing.monthly')}
              </span>
              <Switch 
                checked={billingCycle === 'annually'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')}
              />
              <span className={`text-sm ${billingCycle === 'annually' ? 'text-white font-bold' : 'text-white/60'}`}>
                {t('pricing.annually')}
                <span className="ml-2 bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  {t('pricing.save')}
                </span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Trial Plan */}
            <Card className="bg-gradient-to-br from-primary/20 to-card border-primary/50 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <CardHeader>
                <CardTitle className="font-poppins text-white text-2xl">Teste Grátis</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground text-white">R$ 0</span>
                  <span className="text-muted-foreground text-white/60">/{getTrialDays()} dias</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-white/80 mb-6 min-h-[40px]">
                  {getTrialText()}
                </p>
                <ul className="space-y-3 mb-6 flex-1">
                  {(t('pricing.trial_features', { returnObjects: true }) as string[]).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-auto"
                  size="lg"
                  onClick={() => {
                    const url = new URL(`/${params.lng}/register`, window.location.origin)
                    url.searchParams.set('plan', 'trial')
                    url.searchParams.set('billing', 'monthly')
                    router.push(url.pathname + url.search)
                  }}
                >
                  {t('pricing.cta_trial')}
                </Button>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="bg-card/50 border-white/10 relative flex flex-col">
              {billingCycle === 'annually' && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-bold">
                    -17%
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-poppins text-white">{t('pricing.plans.basic.name')}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground text-white">
                    R$ {calculateMonthlyPrice(getPlanPrice('basic'))}
                  </span>
                  <span className="text-muted-foreground text-white/60">{t('pricing.month')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {getPlanFeatures('basic').map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    const url = new URL(`/${params.lng}/register`, window.location.origin)
                    url.searchParams.set('plan', 'basic')
                    url.searchParams.set('billing', billingCycle)
                    router.push(url.pathname + url.search)
                  }}
                >
                  {t('pricing.cta_subscribe')}
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="bg-card border-primary relative scale-105 shadow-xl shadow-primary/10 z-10 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-full text-center">
                <span className="bg-primary text-primary-foreground text-sm px-4 py-1 rounded-full font-medium shadow-lg">
                  Recomendado
                </span>
              </div>
              {billingCycle === 'annually' && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-bold">
                    -17%
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-poppins text-white">{t('pricing.plans.professional.name')}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground text-white">
                    R$ {calculateMonthlyPrice(getPlanPrice('professional'))}
                  </span>
                  <span className="text-muted-foreground text-white/60">{t('pricing.month')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {getPlanFeatures('professional').map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => {
                    const url = new URL(`/${params.lng}/register`, window.location.origin)
                    url.searchParams.set('plan', 'professional')
                    url.searchParams.set('billing', billingCycle)
                    router.push(url.pathname + url.search)
                  }}
                >
                  {t('pricing.cta_subscribe')}
                </Button>
              </CardContent>
            </Card>

            {/* Advanced Plan */}
            <Card className="bg-card/50 border-white/10 relative flex flex-col">
              {billingCycle === 'annually' && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-bold">
                    -17%
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-poppins text-white">{t('pricing.plans.advanced.name')}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground text-white">
                    R$ {calculateMonthlyPrice(getPlanPrice('advanced'))}
                  </span>
                  <span className="text-muted-foreground text-white/60">{t('pricing.month')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {getPlanFeatures('advanced').map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    const url = new URL(`/${params.lng}/register`, window.location.origin)
                    url.searchParams.set('plan', 'advanced')
                    url.searchParams.set('billing', billingCycle)
                    router.push(url.pathname + url.search)
                  }}
                >
                  {t('pricing.cta_subscribe')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Micro-FAQ Section */}
      <section className="py-16 md:py-24 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-poppins text-2xl md:text-3xl font-bold mb-4 text-foreground text-white">
              Dúvidas frequentes
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Preciso instalar algo?</h3>
              </div>
              <p className="text-white/70">Não. O Aseno funciona 100% no navegador, sem instalação.</p>
            </div>
            <div className="bg-card/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Funciona no celular?</h3>
              </div>
              <p className="text-white/70">Sim. Interface responsiva que funciona em qualquer dispositivo.</p>
            </div>
            <div className="bg-card/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Preciso de cartão para testar?</h3>
              </div>
              <p className="text-white/70">{getFaqTrialText()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="glass-card p-8 md:p-16 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-sm mb-6">
              <Zap className="h-4 w-4" />
              <span>Comece hoje mesmo</span>
            </div>
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-6 text-foreground text-white">
              {t('cta.title')}
            </h2>
            <p className="text-foreground/70 text-lg mb-8 max-w-2xl mx-auto text-white/70">
              Junte-se a centenas de profissionais que já transformaram a gestão de suas clínicas
            </p>
            <Button
              size="lg"
              className="text-lg px-8 h-14"
              onClick={() => {
                const url = new URL(`/${params.lng}/register`, window.location.origin)
                url.searchParams.set('plan', 'trial')
                url.searchParams.set('billing', 'monthly')
                router.push(url.pathname + url.search)
              }}
            >
              {getTrialCtaText()}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="mt-4 text-sm text-foreground/60 text-white/60">
              {t('cta.note')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="relative h-10 w-10 mb-4">
                <Image 
                  src="/logo-icon.png" 
                  alt="Aseno" 
                  fill 
                  className="object-contain" 
                />
              </div>
              <p className="text-sm text-muted-foreground text-white/70">
                Sistema de agendamento inteligente para clínicas e consultórios.
              </p>
            </div>
            <div>
              <h4 className="font-poppins font-semibold mb-4 text-white">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground text-white/60">
                <li><a href="#features" className="hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-poppins font-semibold mb-4 text-white">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground text-white/60">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-poppins font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground text-white/60">
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.terms')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.privacy')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-white/50">
              &copy; {new Date().getFullYear()} Aseno. {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}