'use client'

import { useOnboarding } from '@/hooks/use-onboarding'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Building2,
  Users,
  Clock,
  MessageSquare,
  CalendarCheck
} from 'lucide-react'
import Link from 'next/link'

const iconMap: Record<string, React.ElementType> = {
  Building2,
  Users,
  Clock,
  MessageSquare,
  CalendarCheck,
}

interface OnboardingChecklistProps {
  lng?: string
}

export function OnboardingChecklist({ lng = 'pt-BR' }: OnboardingChecklistProps) {
  const { steps, progress, isComplete, isLoading } = useOnboarding()

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="h-2 w-full bg-muted rounded mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (isComplete) {
    return null
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Configure sua clinica</CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {progress}% completo
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const Icon = iconMap[step.icon] || Circle

          return (
            <Link
              key={step.id}
              href={`/${lng}${step.href}`}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors
                ${step.completed
                  ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                  : 'bg-muted/50 hover:bg-muted'}`}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${step.completed ? '' : 'text-foreground'}`}>
                  {step.title}
                </p>
                <p className={`text-sm ${step.completed ? 'text-green-600/80 dark:text-green-400/80' : 'text-muted-foreground'}`}>
                  {step.description}
                </p>
              </div>
              {!step.completed && (
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
