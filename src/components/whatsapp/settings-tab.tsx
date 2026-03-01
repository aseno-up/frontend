'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ReactSelect, SelectOption } from '@/components/ui/react-select'
import { api } from '@/lib/api/client'
import { showToast, handleApiError } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Clock, Calendar, Save, AlertCircle, Copy, CheckCircle2 } from 'lucide-react'

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
  onCopy?: () => void
  isWeekend?: boolean
}

function DayScheduleForm({
  label,
  enabled,
  startTime,
  endTime,
  onEnabledChange,
  onStartTimeChange,
  onEndTimeChange,
  onCopy,
  isWeekend,
}: DayScheduleFormProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (onCopy) onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 py-4 border-b border-border/40 last:border-b-0">
      <div className="flex items-center gap-4 min-w-0 flex-shrink-0 w-[200px]">
        <div className="w-28 flex-shrink-0">
          <Label className={`text-sm font-medium ${isWeekend && !enabled ? 'text-muted-foreground' : ''}`}>{label}</Label>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          className={enabled ? 'data-[state=checked]:bg-primary' : ''}
        />
      </div>

      <div className="flex items-center justify-between flex-1 gap-2 sm:ml-auto pl-0 sm:pl-0">
        <div className="flex items-center gap-2">
          {enabled ? (
            <>
              <div className="w-24 sm:w-[110px] flex-shrink-0">
                <ReactSelect
                  value={startTime ? { value: startTime, label: startTime } : null}
                  onChange={(option) => onStartTimeChange(option?.value)}
                  options={timeOptions}
                  placeholder="Início"
                />
              </div>
              <span className="text-sm text-muted-foreground flex-shrink-0">até</span>
              <div className="w-24 sm:w-[110px] flex-shrink-0">
                <ReactSelect
                  value={endTime ? { value: endTime, label: endTime } : null}
                  onChange={(option) => onEndTimeChange(option?.value)}
                  options={timeOptions}
                  placeholder="Término"
                />
              </div>
            </>
          ) : (
            <span className="text-sm italic text-muted-foreground">Desabilitado</span>
          )}
        </div>
        
        {enabled && !isWeekend && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 bg-transparent"
            onClick={handleCopy}
            type="button"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-primary mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
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
    reset,
    formState,
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
        setValue('ai_business_hours', clinic.settings.ai_business_hours as any)
      }
    }
  }, [clinic, setValue])

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setIsSaving(true)

      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          ai_min_delay_between_messages: data.ai_min_delay_between_messages,
          ai_min_delay_between_patients: data.ai_min_delay_between_patients,
          ai_business_hours: data.ai_business_hours,
        },
      })

      setClinic(updatedClinic)
      showToast.success('Configurações atualizadas com sucesso!')
      reset(updatedClinic.settings as any) // Reset dirty state
    } catch (err) {
      handleApiError(err, 'Erro ao atualizar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const businessHours = watch('ai_business_hours')
  const delayPatients = watch('ai_min_delay_between_patients') || 60
  const isDirty = Object.keys(formState.errors).length > 0 || formState.isDirty

  const handleShortcut = (seconds: number) => {
    setValue('ai_min_delay_between_patients', seconds, { shouldDirty: true })
  }

  const copyToAllWeekdays = (sourceDay: keyof NonNullable<SettingsFormData['ai_business_hours']>) => {
    if (!businessHours) return
    const sourceData = businessHours[sourceDay]
    const weekdays: (keyof NonNullable<SettingsFormData['ai_business_hours']>)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    
    weekdays.forEach(day => {
      if (day !== sourceDay) {
        setValue(`ai_business_hours.${day}`, { ...sourceData }, { shouldDirty: true })
      }
    })
    showToast.success('Horário copiado para todos os dias úteis!')
  }

  const applyOnlyWeekdays = () => {
    setValue('ai_business_hours.saturday', { enabled: false, start_time: undefined, end_time: undefined }, { shouldDirty: true })
    setValue('ai_business_hours.sunday', { enabled: false, start_time: undefined, end_time: undefined }, { shouldDirty: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-28 min-h-[calc(100vh-12rem)]">
      {/* Card de Delay Entre Mensagens (Unificado) */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Intervalo entre mensagens</h2>
              <p className="text-muted-foreground text-sm">Tempo de espera entre envios para pacientes diferentes</p>
            </div>
          </div>

          <div className="space-y-8 mt-6">
            {/* Custom Slider area */}
            <div className="relative pt-4 pb-2 flex items-center gap-4">
              <div className="relative flex-1 group">
                {/* Track wrapper */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
                  {/* Active track */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 pointer-events-none" 
                    style={{ width: `${(Math.min(delayPatients, 300) / 300) * 100}%` }}
                  />
                </div>
                {/* Native input layered on top */}
                <input
                  type="range"
                  min={1}
                  max={300}
                  step={1}
                  className="absolute top-0 w-full h-full opacity-0 cursor-pointer z-10"
                  value={delayPatients}
                  onChange={(e) => setValue('ai_min_delay_between_patients', Number(e.target.value), { shouldDirty: true })}
                />
                {/* Thumb simulator */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md z-0 pointer-events-none border-2 border-primary-foreground group-active:scale-125 transition-transform"
                  style={{ left: `calc(${(Math.min(delayPatients, 300) / 300) * 100}% - 8px)` }}
                />
              </div>

              {/* Value display tag */}
              <div className="shrink-0 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium border border-primary/20 min-w-[80px] text-center">
                {delayPatients < 60 ? `${delayPatients}s` : `${Number((delayPatients / 60).toFixed(1))} min`}
              </div>
            </div>

            {/* Scale min/max labels */}
            <div className="flex justify-between text-xs text-muted-foreground -mt-6">
              <span>1s</span>
              <span>5 min</span>
            </div>

            {/* Shortcuts */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Atalhos:</span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-full bg-transparent hover:bg-muted/50" onClick={() => handleShortcut(10)}>10s</Button>
                <Button type="button" variant="outline" size="sm" className="rounded-full bg-transparent hover:bg-muted/50" onClick={() => handleShortcut(60)}>1 min</Button>
                <Button type="button" variant="outline" size="sm" className="rounded-full bg-transparent hover:bg-muted/50" onClick={() => handleShortcut(120)}>2 min</Button>
                <Button type="button" variant="outline" size="sm" className="rounded-full bg-transparent hover:bg-muted/50" onClick={() => handleShortcut(300)}>5 min</Button>
              </div>
            </div>

            {/* Warning Box */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-500/90 mt-4 text-sm font-medium">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Com {delayPatients}s de intervalo, 60 mensagens levam cerca de {Number(((delayPatients * 60) / 3600).toFixed(1))} horas para serem enviadas.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Horário de Atendimento */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Horário de Atendimento da IA</h2>
              <p className="text-muted-foreground text-sm">Fora desse horário, mensagens serão ignoradas automaticamente</p>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <Button type="button" variant="outline" size="sm" onClick={() => copyToAllWeekdays('monday')} className="bg-transparent hover:bg-muted/50">
              <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
              Aplicar a todos
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={applyOnlyWeekdays} className="bg-transparent hover:bg-muted/50">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              Só dias úteis
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-4 mb-2">
              Dias Úteis
              <div className="h-px bg-border/40 flex-1" />
            </div>
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
                  onCopy={() => copyToAllWeekdays('monday')}
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
                  onCopy={() => copyToAllWeekdays('tuesday')}
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
                  onCopy={() => copyToAllWeekdays('wednesday')}
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
                  onCopy={() => copyToAllWeekdays('thursday')}
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
                  onCopy={() => copyToAllWeekdays('friday')}
                />
              )}
            />

            <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-4 mt-8 mb-2">
              Fim de Semana
              <div className="h-px bg-border/40 flex-1" />
            </div>

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
                  isWeekend
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
                  isWeekend
                />
              )}
            />
          </div>

          <p className="text-sm text-muted-foreground mt-6 italic">
            <Clock className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
            Padrão: Segunda a Sábado das 08:00 às 18:00. Domingo desabilitado.
          </p>
        </CardContent>
      </Card>

      {/* Sticky Save Bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 sm:left-[280px] right-0 bg-background/95 backdrop-blur-md border-t border-border/50 p-4 px-6 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] z-50 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full text-sm font-semibold border border-amber-500/20 w-full md:w-auto justify-center md:justify-start">
            <AlertCircle className="h-4 w-4" />
            Você tem alterações não salvas
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => reset()} 
              disabled={isSaving}
              className="flex-1 md:flex-none border-border hover:bg-muted"
            >
              Descartar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all" 
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar configurações
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
