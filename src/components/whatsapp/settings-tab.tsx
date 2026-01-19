'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ReactSelect, SelectOption } from '@/components/ui/react-select'
import { api } from '@/lib/api/client'
import { showToast, handleApiError } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Clock, Calendar, Save } from 'lucide-react'

// Gerar opções de horário de 00:00 até 23:30 em intervalos de 30min
const timeOptions: SelectOption[] = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  const value = `${hour.toString().padStart(2, '0')}:${minute}`
  return { value, label: value }
})

const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
}).refine((data) => {
  if (!data.enabled) return true
  return data.start_time && data.end_time && data.start_time < data.end_time
}, {
  message: 'Horário de início deve ser menor que horário de término',
  path: ['start_time'],
})

const settingsSchema = z.object({
  ai_min_delay_between_messages: z.number().min(1).max(30).nullable(),
  ai_min_delay_between_patients: z.number().min(1).max(300).nullable(),
  ai_business_hours: z.object({
    monday: dayScheduleSchema,
    tuesday: dayScheduleSchema,
    wednesday: dayScheduleSchema,
    thursday: dayScheduleSchema,
    friday: dayScheduleSchema,
    saturday: dayScheduleSchema,
    sunday: dayScheduleSchema,
  }).nullable(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

interface DayScheduleFormProps {
  label: string
  enabled: boolean
  startTime?: string
  endTime?: string
  onEnabledChange: (enabled: boolean) => void
  onStartTimeChange: (time: string | undefined) => void
  onEndTimeChange: (time: string | undefined) => void
}

function DayScheduleForm({
  label,
  enabled,
  startTime,
  endTime,
  onEnabledChange,
  onStartTimeChange,
  onEndTimeChange,
}: DayScheduleFormProps) {
  return (
    <div className="flex items-center py-2.5 border-b last:border-b-0">
      <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
        <div className="w-28 flex-shrink-0">
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {enabled ? (
          <>
            <div className="w-24 sm:w-28 flex-shrink-0">
              <ReactSelect
                value={startTime ? { value: startTime, label: startTime } : null}
                onChange={(option) => onStartTimeChange(option?.value)}
                options={timeOptions}
                placeholder="Início"
              />
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">até</span>
            <div className="w-24 sm:w-28 flex-shrink-0">
              <ReactSelect
                value={endTime ? { value: endTime, label: endTime } : null}
                onChange={(option) => onEndTimeChange(option?.value)}
                options={timeOptions}
                placeholder="Término"
              />
            </div>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Desabilitado</span>
        )}
      </div>
    </div>
  )
}

export function WhatsAppSettingsTab() {
  const { clinic, setClinic } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ai_min_delay_between_messages: null,
      ai_min_delay_between_patients: null,
      ai_business_hours: {
        monday: { enabled: true, start_time: '08:00', end_time: '18:00' },
        tuesday: { enabled: true, start_time: '08:00', end_time: '18:00' },
        wednesday: { enabled: true, start_time: '08:00', end_time: '18:00' },
        thursday: { enabled: true, start_time: '08:00', end_time: '18:00' },
        friday: { enabled: true, start_time: '08:00', end_time: '18:00' },
        saturday: { enabled: true, start_time: '08:00', end_time: '18:00' },
        sunday: { enabled: false, start_time: undefined, end_time: undefined },
      },
    },
  })

  useEffect(() => {
    if (clinic?.settings) {
      if (clinic.settings.ai_min_delay_between_messages !== undefined) {
        setValue('ai_min_delay_between_messages', clinic.settings.ai_min_delay_between_messages)
      }

      if (clinic.settings.ai_min_delay_between_patients !== undefined) {
        setValue('ai_min_delay_between_patients', clinic.settings.ai_min_delay_between_patients)
      }

      if (clinic.settings.ai_business_hours) {
        setValue('ai_business_hours', clinic.settings.ai_business_hours)
      }
    }
  }, [clinic, setValue])

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setIsSaving(true)

      const updatedClinic = await api.updateClinic({
        settings: {
          ai_min_delay_between_messages: data.ai_min_delay_between_messages,
          ai_min_delay_between_patients: data.ai_min_delay_between_patients,
          ai_business_hours: data.ai_business_hours,
        },
      })

      setClinic(updatedClinic)
      showToast.success('Configurações atualizadas com sucesso!')
    } catch (err) {
      handleApiError(err, 'Erro ao atualizar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const businessHours = watch('ai_business_hours')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Card de Delay Entre Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Delay Entre Mensagens
          </CardTitle>
          <CardDescription>
            Defina o delay mínimo entre mensagens da IA para o mesmo paciente (em segundos). Valor padrão: 3 segundos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="ai_min_delay_between_messages">
              Delay em segundos (1-30)
            </Label>
            <Input
              id="ai_min_delay_between_messages"
              type="number"
              min={1}
              max={30}
              placeholder="3"
              {...register('ai_min_delay_between_messages', {
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? null : Number(v),
              })}
              className={errors.ai_min_delay_between_messages ? 'border-destructive' : ''}
            />
            {errors.ai_min_delay_between_messages && (
              <p className="text-sm text-destructive">{errors.ai_min_delay_between_messages.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Controla o intervalo entre mensagens segmentadas para o mesmo paciente. Deixe vazio para usar o padrão (3 segundos).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card de Delay Entre Pacientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Delay Entre Pacientes
          </CardTitle>
          <CardDescription>
            Defina o delay mínimo entre mensagens para pacientes diferentes (em segundos). Valor padrão: 60 segundos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="ai_min_delay_between_patients">
              Delay em segundos (1-300)
            </Label>
            <Input
              id="ai_min_delay_between_patients"
              type="number"
              min={1}
              max={300}
              placeholder="60"
              {...register('ai_min_delay_between_patients', {
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? null : Number(v),
              })}
              className={errors.ai_min_delay_between_patients ? 'border-destructive' : ''}
            />
            {errors.ai_min_delay_between_patients && (
              <p className="text-sm text-destructive">{errors.ai_min_delay_between_patients.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Controla o intervalo de rate limiting entre conversas de pacientes diferentes. Deixe vazio para usar o padrão (60 segundos).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card de Horário de Atendimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Horário de Atendimento da IA
          </CardTitle>
          <CardDescription>
            Configure o horário em que a IA responderá automaticamente. Mensagens fora do horário serão ignoradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Controller
              name="ai_business_hours.monday"
              control={control}
              render={({ field }) => (
                <DayScheduleForm
                  label="Segunda-feira"
                  enabled={field.value?.enabled ?? false}
                  startTime={field.value?.start_time}
                  endTime={field.value?.end_time}
                  onEnabledChange={(enabled) =>
                    field.onChange({
                      ...field.value,
                      enabled,
                      start_time: enabled ? field.value?.start_time || '08:00' : undefined,
                      end_time: enabled ? field.value?.end_time || '18:00' : undefined,
                    })
                  }
                  onStartTimeChange={(time) =>
                    field.onChange({ ...field.value, start_time: time })
                  }
                  onEndTimeChange={(time) =>
                    field.onChange({ ...field.value, end_time: time })
                  }
                />
              )}
            />

            <Controller
              name="ai_business_hours.tuesday"
              control={control}
              render={({ field }) => (
                <DayScheduleForm
                  label="Terça-feira"
                  enabled={field.value?.enabled ?? false}
                  startTime={field.value?.start_time}
                  endTime={field.value?.end_time}
                  onEnabledChange={(enabled) =>
                    field.onChange({
                      ...field.value,
                      enabled,
                      start_time: enabled ? field.value?.start_time || '08:00' : undefined,
                      end_time: enabled ? field.value?.end_time || '18:00' : undefined,
                    })
                  }
                  onStartTimeChange={(time) =>
                    field.onChange({ ...field.value, start_time: time })
                  }
                  onEndTimeChange={(time) =>
                    field.onChange({ ...field.value, end_time: time })
                  }
                />
              )}
            />

            <Controller
              name="ai_business_hours.wednesday"
              control={control}
              render={({ field }) => (
                <DayScheduleForm
                  label="Quarta-feira"
                  enabled={field.value?.enabled ?? false}
                  startTime={field.value?.start_time}
                  endTime={field.value?.end_time}
                  onEnabledChange={(enabled) =>
                    field.onChange({
                      ...field.value,
                      enabled,
                      start_time: enabled ? field.value?.start_time || '08:00' : undefined,
                      end_time: enabled ? field.value?.end_time || '18:00' : undefined,
                    })
                  }
                  onStartTimeChange={(time) =>
                    field.onChange({ ...field.value, start_time: time })
                  }
                  onEndTimeChange={(time) =>
                    field.onChange({ ...field.value, end_time: time })
                  }
                />
              )}
            />

            <Controller
              name="ai_business_hours.thursday"
              control={control}
              render={({ field }) => (
                <DayScheduleForm
                  label="Quinta-feira"
                  enabled={field.value?.enabled ?? false}
                  startTime={field.value?.start_time}
                  endTime={field.value?.end_time}
                  onEnabledChange={(enabled) =>
                    field.onChange({
                      ...field.value,
                      enabled,
                      start_time: enabled ? field.value?.start_time || '08:00' : undefined,
                      end_time: enabled ? field.value?.end_time || '18:00' : undefined,
                    })
                  }
                  onStartTimeChange={(time) =>
                    field.onChange({ ...field.value, start_time: time })
                  }
                  onEndTimeChange={(time) =>
                    field.onChange({ ...field.value, end_time: time })
                  }
                />
              )}
            />

            <Controller
              name="ai_business_hours.friday"
              control={control}
              render={({ field }) => (
                <DayScheduleForm
                  label="Sexta-feira"
                  enabled={field.value?.enabled ?? false}
                  startTime={field.value?.start_time}
                  endTime={field.value?.end_time}
                  onEnabledChange={(enabled) =>
                    field.onChange({
                      ...field.value,
                      enabled,
                      start_time: enabled ? field.value?.start_time || '08:00' : undefined,
                      end_time: enabled ? field.value?.end_time || '18:00' : undefined,
                    })
                  }
                  onStartTimeChange={(time) =>
                    field.onChange({ ...field.value, start_time: time })
                  }
                  onEndTimeChange={(time) =>
                    field.onChange({ ...field.value, end_time: time })
                  }
                />
              )}
            />

            <Controller
              name="ai_business_hours.saturday"
              control={control}
              render={({ field }) => (
                <DayScheduleForm
                  label="Sábado"
                  enabled={field.value?.enabled ?? false}
                  startTime={field.value?.start_time}
                  endTime={field.value?.end_time}
                  onEnabledChange={(enabled) =>
                    field.onChange({
                      ...field.value,
                      enabled,
                      start_time: enabled ? field.value?.start_time || '08:00' : undefined,
                      end_time: enabled ? field.value?.end_time || '18:00' : undefined,
                    })
                  }
                  onStartTimeChange={(time) =>
                    field.onChange({ ...field.value, start_time: time })
                  }
                  onEndTimeChange={(time) =>
                    field.onChange({ ...field.value, end_time: time })
                  }
                />
              )}
            />

            <Controller
              name="ai_business_hours.sunday"
              control={control}
              render={({ field }) => (
                <DayScheduleForm
                  label="Domingo"
                  enabled={field.value?.enabled ?? false}
                  startTime={field.value?.start_time}
                  endTime={field.value?.end_time}
                  onEnabledChange={(enabled) =>
                    field.onChange({
                      ...field.value,
                      enabled,
                      start_time: enabled ? field.value?.start_time || '08:00' : undefined,
                      end_time: enabled ? field.value?.end_time || '18:00' : undefined,
                    })
                  }
                  onStartTimeChange={(time) =>
                    field.onChange({ ...field.value, start_time: time })
                  }
                  onEndTimeChange={(time) =>
                    field.onChange({ ...field.value, end_time: time })
                  }
                />
              )}
            />
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Horário padrão quando não configurado: Segunda a Sábado das 08:00 às 18:00, Domingo desabilitado.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </form>
  )
}
