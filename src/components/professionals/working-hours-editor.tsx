'use client'

import { useState } from 'react'
import { Plus, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { WorkingHours, TimeSlot } from '@/types/api'

interface WorkingHoursEditorProps {
  value: WorkingHours
  onChange: (hours: WorkingHours) => void
}

type DayKey = keyof WorkingHours

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: 'monday', label: 'Segunda-feira', short: 'Seg' },
  { key: 'tuesday', label: 'Terca-feira', short: 'Ter' },
  { key: 'wednesday', label: 'Quarta-feira', short: 'Qua' },
  { key: 'thursday', label: 'Quinta-feira', short: 'Qui' },
  { key: 'friday', label: 'Sexta-feira', short: 'Sex' },
  { key: 'saturday', label: 'Sabado', short: 'Sab' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' },
]

const DEFAULT_SLOT: TimeSlot = { start: '08:00', end: '18:00' }

export function WorkingHoursEditor({ value, onChange }: WorkingHoursEditorProps) {
  const [expandedDays, setExpandedDays] = useState<Set<DayKey>>(new Set())

  const toggleDay = (day: DayKey) => {
    const currentSlots = value[day] || []
    if (currentSlots.length > 0) {
      // Disable day - remove all slots
      onChange({ ...value, [day]: [] })
    } else {
      // Enable day - add default slot
      onChange({ ...value, [day]: [{ ...DEFAULT_SLOT }] })
    }
  }

  const isDayEnabled = (day: DayKey) => {
    const slots = value[day]
    return slots && slots.length > 0
  }

  const addSlot = (day: DayKey) => {
    const currentSlots = value[day] || []
    const lastSlot = currentSlots[currentSlots.length - 1]
    const newSlot: TimeSlot = lastSlot
      ? { start: lastSlot.end, end: '18:00' }
      : { ...DEFAULT_SLOT }
    onChange({ ...value, [day]: [...currentSlots, newSlot] })
  }

  const removeSlot = (day: DayKey, index: number) => {
    const currentSlots = value[day] || []
    const newSlots = currentSlots.filter((_, i) => i !== index)
    onChange({ ...value, [day]: newSlots })
  }

  const updateSlot = (day: DayKey, index: number, field: 'start' | 'end', newValue: string) => {
    const currentSlots = value[day] || []
    const newSlots = currentSlots.map((slot, i) =>
      i === index ? { ...slot, [field]: newValue } : slot
    )
    onChange({ ...value, [day]: newSlots })
  }

  const toggleExpanded = (day: DayKey) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(day)) {
      newExpanded.delete(day)
    } else {
      newExpanded.add(day)
    }
    setExpandedDays(newExpanded)
  }

  const copyToAllDays = (sourceDay: DayKey) => {
    const sourceSlots = value[sourceDay] || []
    const newValue: WorkingHours = { ...value }
    DAYS.forEach(({ key }) => {
      if (key !== sourceDay && key !== 'saturday' && key !== 'sunday') {
        newValue[key] = sourceSlots.map(s => ({ ...s }))
      }
    })
    onChange(newValue)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Horarios de Trabalho
        </Label>
      </div>

      <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
        {DAYS.map(({ key, label, short }) => {
          const enabled = isDayEnabled(key)
          const slots = value[key] || []
          const isExpanded = expandedDays.has(key) || slots.length > 1

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-3">
                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggleDay(key)}
                  className="data-[state=checked]:bg-primary"
                />
                <button
                  type="button"
                  onClick={() => enabled && toggleExpanded(key)}
                  className={`flex-1 text-left text-sm font-medium ${
                    enabled ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <span className="md:hidden">{short}</span>
                  <span className="hidden md:inline">{label}</span>
                </button>

                {enabled && slots.length > 0 && (
                  <div className="flex items-center gap-2">
                    {!isExpanded && (
                      <span className="text-xs text-muted-foreground">
                        {slots[0].start} - {slots[0].end}
                        {slots.length > 1 && ` (+${slots.length - 1})`}
                      </span>
                    )}
                    {key === 'monday' && slots.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => copyToAllDays(key)}
                      >
                        Copiar para dias uteis
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {enabled && isExpanded && (
                <div className="ml-10 space-y-2">
                  {slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                        className="w-28 h-8 text-sm"
                      />
                      <span className="text-muted-foreground">ate</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                        className="w-28 h-8 text-sm"
                      />
                      {slots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeSlot(key, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addSlot(key)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar intervalo
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Configure os horarios em que o profissional atende. Voce pode adicionar multiplos intervalos por dia (ex: manha e tarde).
      </p>
    </div>
  )
}
