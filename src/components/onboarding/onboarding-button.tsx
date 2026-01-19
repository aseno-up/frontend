'use client'

import { useState } from 'react'
import { useOnboarding } from '@/hooks/use-onboarding'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Building2,
  Users,
  Clock,
  MessageSquare,
  CalendarCheck,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const iconMap: Record<string, React.ElementType> = {
  Building2,
  Users,
  Clock,
  MessageSquare,
  CalendarCheck,
}

interface OnboardingButtonProps {
  lng?: string
}

export function OnboardingButton({ lng = 'pt-BR' }: OnboardingButtonProps) {
  const { steps, progress, isComplete, isLoading } = useOnboarding()
  const [open, setOpen] = useState(false)

  if (isLoading || isComplete) {
    return null
  }

  const completedSteps = steps.filter(s => s.completed).length
  const totalSteps = steps.length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="relative border-primary/30 bg-primary/5 hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4 mr-2 text-primary" />
          Configurar Clínica
          <Badge
            variant="secondary"
            className="ml-2 bg-primary/20 text-primary hover:bg-primary/30"
          >
            {completedSteps}/{totalSteps}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configure sua Clínica
          </SheetTitle>
          <SheetDescription>
            Complete as etapas abaixo para começar a usar o sistema
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso</span>
              <span className="text-muted-foreground">{progress}% completo</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = iconMap[step.icon] || Circle

              return (
                <Link
                  key={step.id}
                  href={`/${lng}${step.href}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all hover:scale-[1.02]
                    ${
                      step.completed
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : 'bg-muted/50 border-muted hover:bg-muted hover:border-primary/30'
                    }`}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <div className="relative">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary text-[8px] font-bold text-white flex items-center justify-center">
                          {index + 1}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium mb-1 ${
                        step.completed
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-sm ${
                        step.completed
                          ? 'text-green-600/80 dark:text-green-400/80'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                  {!step.completed && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Motivational Message */}
          {progress > 0 && progress < 100 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Ótimo trabalho!</span> Você
                já completou {completedSteps} de {totalSteps} etapas. Continue assim!
              </p>
            </div>
          )}

          {progress === 100 && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="font-semibold text-green-700 dark:text-green-400">
                  Parabéns! Configuração completa
                </p>
              </div>
              <p className="text-sm text-green-600/80 dark:text-green-400/80">
                Sua clínica está pronta para uso. Comece a agendar consultas e aproveite
                todos os recursos!
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
