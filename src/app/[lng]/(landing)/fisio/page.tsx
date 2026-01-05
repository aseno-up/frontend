'use client'

import { use } from 'react'
import { useTranslation } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  MessageSquare,
  RefreshCw,
  Clock,
  CheckCircle2,
  Activity,
  ArrowRight
} from 'lucide-react'

interface PageProps {
  params: Promise<{ lng: string }>
}

export default function FisioLandingPage(props: PageProps) {
  const params = use(props.params)
  const { t } = useTranslation(params.lng, 'fisio')
  const { t: tLanding } = useTranslation(params.lng, 'landing')

  const benefits = [
    { icon: Calendar, ...t('benefits.items.0', { returnObjects: true }) as { title: string; description: string } },
    { icon: RefreshCw, ...t('benefits.items.1', { returnObjects: true }) as { title: string; description: string } },
    { icon: CheckCircle2, ...t('benefits.items.2', { returnObjects: true }) as { title: string; description: string } },
    { icon: Activity, ...t('benefits.items.3', { returnObjects: true }) as { title: string; description: string } },
    { icon: Clock, ...t('benefits.items.4', { returnObjects: true }) as { title: string; description: string } },
    { icon: MessageSquare, ...t('benefits.items.5', { returnObjects: true }) as { title: string; description: string } },
  ]

  const steps = [
    tLanding('howItWorks.steps.0', { returnObjects: true }) as { step: string; title: string; description: string },
    tLanding('howItWorks.steps.1', { returnObjects: true }) as { step: string; title: string; description: string },
    tLanding('howItWorks.steps.2', { returnObjects: true }) as { step: string; title: string; description: string },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">AgendaClinic</span>
            <span className="text-sm text-muted-foreground ml-2">para Fisioterapia</span>
          </div>
          <Button variant="outline" size="sm">
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-green-50 to-background dark:from-green-950/20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm mb-6">
            <Activity className="h-4 w-4" />
            Especializado para clínicas de fisioterapia
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
            {t('hero.headline')}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('hero.subheadline')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              {tLanding('hero.cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {tLanding('form.noCard')}
          </p>
        </div>
      </section>

      {/* Niche Section */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t('niche.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('niche.description')}
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {tLanding('benefits.title')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <Card key={index} className="bg-background">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {tLanding('howItWorks.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            {tLanding('cta.title')}
          </h2>
          <Button size="lg" variant="secondary" className="text-lg px-8">
            {tLanding('cta.button')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-4 text-primary-foreground/80">
            {tLanding('cta.note')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-semibold">AgendaClinic</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AgendaClinic. {tLanding('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  )
}
