'use client'

import { use, useState } from 'react'
import { useTranslation } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Shield,
  Zap,
  Check
} from 'lucide-react'

interface PageProps {
  params: Promise<{ lng: string }>
}

export default function LandingPage(props: PageProps) {
  const params = use(props.params)
  const { t } = useTranslation(params.lng, 'landing')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
  ]

  const features = [
    { icon: Calendar, title: 'Agenda Online', description: 'Gerencie todos os agendamentos em uma interface intuitiva' },
    { icon: MessageSquare, title: 'WhatsApp Integrado', description: 'Confirmações e lembretes automáticos via WhatsApp' },
    { icon: RefreshCw, title: 'Reagendamento Fácil', description: 'Pacientes podem reagendar sem ligar para a clínica' },
    { icon: BarChart3, title: 'Relatórios', description: 'Acompanhe métricas importantes do seu consultório' },
    { icon: Bell, title: 'Notificações', description: 'Alertas em tempo real sobre novos agendamentos' },
    { icon: Smartphone, title: 'Mobile First', description: 'Acesse de qualquer dispositivo, a qualquer hora' },
  ]

  const stats = [
    { value: '50%', label: 'Redução de faltas' },
    { value: '3h', label: 'Economizadas por dia' },
    { value: '95%', label: 'Taxa de confirmação' },
    { value: '24/7', label: 'Disponibilidade' },
  ]

  const SignupForm = () => (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">{t('form.name')}</Label>
          <Input id="name" placeholder="Dr. João Silva" className="bg-background" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t('form.email')}</Label>
          <Input id="email" type="email" placeholder="joao@clinica.com" className="bg-background" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">{t('form.phone')}</Label>
          <Input id="phone" type="tel" placeholder="(11) 99999-9999" className="bg-background" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="clinic">{t('form.clinic')}</Label>
          <Input id="clinic" placeholder="Clínica Saúde Total" className="bg-background" />
        </div>
      </div>
      <Button type="submit" className="w-full" size="lg">
        {t('form.submit')}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        {t('form.noCard')}
      </p>
    </form>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-poppins font-bold text-xl">AgendaClinic</span>
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
            <Button variant="outline" size="sm" className="border-foreground/20 text-foreground hover:bg-foreground/10">
              Login
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  {t('hero.cta')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-poppins">{t('form.title')}</DialogTitle>
                  <DialogDescription>
                    {t('form.subtitle')}
                  </DialogDescription>
                </DialogHeader>
                <SignupForm />
              </DialogContent>
            </Dialog>
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

            <h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-foreground">
              {t('hero.headline')}
            </h1>

            <p className="mt-6 text-xl text-foreground/80 max-w-2xl mx-auto">
              {t('hero.subheadline')}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="text-lg px-8 h-14">
                    {t('hero.cta')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-poppins">{t('form.title')}</DialogTitle>
                    <DialogDescription>
                      {t('form.subtitle')}
                    </DialogDescription>
                  </DialogHeader>
                  <SignupForm />
                </DialogContent>
              </Dialog>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-white/20 hover:bg-white/5">
                Ver demonstração
              </Button>
            </div>

            <p className="mt-4 text-sm text-foreground/60">
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
                      app.agendaclinic.com/dashboard
                    </div>
                  </div>
                </div>
                <div className="p-6 min-h-[300px] md:min-h-[400px]">
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-background/50 rounded-lg p-4 border border-white/5">
                      <div className="text-sm text-muted-foreground mb-1">Agendamentos Hoje</div>
                      <div className="text-2xl font-bold text-primary">12</div>
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
                      <div className="text-sm font-medium mb-3">Próximos Pacientes</div>
                      <div className="space-y-3">
                        {['Maria Silva - 09:00', 'João Santos - 09:30', 'Ana Costa - 10:00'].map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item}</span>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Confirmado</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-white/5">
                      <div className="text-sm font-medium mb-3">Mensagens WhatsApp</div>
                      <div className="space-y-3">
                        {['Lembrete enviado para Maria', 'João confirmou presença', 'Ana solicitou reagendamento'].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <div className="text-3xl md:text-4xl font-bold text-primary font-poppins">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {t('benefits.title')}
            </h2>
            <p className="text-foreground/70 text-lg">
              Todas as ferramentas que você precisa para gerenciar sua clínica de forma eficiente
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="bg-card/50 border-white/10 hover:border-primary/50 transition-colors group">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-poppins">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/70">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Highlight Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Software que sua equipe vai adorar usar
              </h2>
              <p className="text-foreground/70 text-lg mb-8">
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
                    <span className="text-foreground">{item}</span>
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
                      <div className="font-medium">WhatsApp Automatizado</div>
                      <div className="text-sm text-muted-foreground">3 mensagens enviadas hoje</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-background/50 rounded-lg p-3 border border-white/5">
                      <div className="text-xs text-muted-foreground mb-1">08:00</div>
                      <div className="text-sm">Olá Maria! Lembrete: consulta amanhã às 14h. Confirme respondendo SIM</div>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3 border border-primary/20 ml-8">
                      <div className="text-xs text-muted-foreground mb-1">08:05</div>
                      <div className="text-sm">SIM</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border border-white/5">
                      <div className="text-xs text-muted-foreground mb-1">08:05</div>
                      <div className="text-sm">Perfeito! Sua consulta está confirmada. Até amanhã!</div>
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
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {t('howItWorks.title')}
            </h2>
            <p className="text-foreground/70 text-lg">
              Comece a usar em menos de 5 minutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 font-poppins">
                  {step.step}
                </div>
                <h3 className="font-poppins font-semibold text-lg mb-2 text-foreground">{step.title}</h3>
                <p className="text-foreground/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {t('pricing.title')}
            </h2>
            <p className="text-foreground/70 text-lg">
              {t('pricing.trial')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="font-poppins">{t('pricing.plans.basic.name')}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">R$ {t('pricing.plans.basic.price')}</span>
                  <span className="text-muted-foreground">{t('pricing.month')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(t('pricing.plans.basic.features', { returnObjects: true }) as string[]).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-6" variant="outline">
                      {t('hero.cta')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-poppins">{t('form.title')}</DialogTitle>
                      <DialogDescription>
                        {t('form.subtitle')}
                      </DialogDescription>
                    </DialogHeader>
                    <SignupForm />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="bg-card border-primary relative scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm px-4 py-1 rounded-full font-medium">
                  Recomendado
                </span>
              </div>
              <CardHeader>
                <CardTitle className="font-poppins">{t('pricing.plans.professional.name')}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">R$ {t('pricing.plans.professional.price')}</span>
                  <span className="text-muted-foreground">{t('pricing.month')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(t('pricing.plans.professional.features', { returnObjects: true }) as string[]).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-6">
                      {t('hero.cta')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-poppins">{t('form.title')}</DialogTitle>
                      <DialogDescription>
                        {t('form.subtitle')}
                      </DialogDescription>
                    </DialogHeader>
                    <SignupForm />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Advanced Plan */}
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="font-poppins">{t('pricing.plans.advanced.name')}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">R$ {t('pricing.plans.advanced.price')}</span>
                  <span className="text-muted-foreground">{t('pricing.month')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(t('pricing.plans.advanced.features', { returnObjects: true }) as string[]).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-6" variant="outline">
                      {t('hero.cta')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-poppins">{t('form.title')}</DialogTitle>
                      <DialogDescription>
                        {t('form.subtitle')}
                      </DialogDescription>
                    </DialogHeader>
                    <SignupForm />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
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
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-6 text-foreground">
              {t('cta.title')}
            </h2>
            <p className="text-foreground/70 text-lg mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de profissionais que já transformaram a gestão de suas clínicas
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="text-lg px-8 h-14">
                  {t('cta.button')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-poppins">{t('form.title')}</DialogTitle>
                  <DialogDescription>
                    {t('form.subtitle')}
                  </DialogDescription>
                </DialogHeader>
                <SignupForm />
              </DialogContent>
            </Dialog>
            <p className="mt-4 text-sm text-foreground/60">
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
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-poppins font-bold text-xl">AgendaClinic</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema de agendamento inteligente para clínicas e consultórios.
              </p>
            </div>
            <div>
              <h4 className="font-poppins font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-poppins font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-poppins font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.terms')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.privacy')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} AgendaClinic. {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
