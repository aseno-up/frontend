"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2, Pencil, Clock } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReactSelect, SelectOption } from "@/components/ui/react-select"
import { TimePickerInline } from "@/components/ui/time-picker"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { SessionPlanSlot, ProfessionalInfo } from "@/types/api"

interface SlotsManagerProps {
  sessionPlanId: string
  defaultCapacity?: number | null
}

const WEEK_DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
]
const WEEK_DAY_LABELS: Record<number, string> = WEEK_DAYS.reduce(
  (acc, d) => ({ ...acc, [d.value]: d.label }),
  {} as Record<number, string>
)

const slotSchema = z.object({
  weekday: z.string().min(1, "Selecione o dia"),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM"),
  capacity: z.string().regex(/^\d+$/, "Capacidade inválida"),
  professional_id: z.string().optional(),
})
type SlotFormData = z.infer<typeof slotSchema>

export function SlotsManager({ sessionPlanId, defaultCapacity }: SlotsManagerProps) {
  const fallbackCapacity =
    defaultCapacity && defaultCapacity > 0 ? String(defaultCapacity) : "1"
  const [slots, setSlots] = useState<SessionPlanSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [professionals, setProfessionals] = useState<ProfessionalInfo[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<SessionPlanSlot | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [slotToDelete, setSlotToDelete] = useState<SessionPlanSlot | null>(null)

  const form = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: { weekday: "", start_time: "", capacity: fallbackCapacity, professional_id: "" },
  })

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await api.getSessionPlanSlots(sessionPlanId)
      setSlots(res.data || [])
    } catch (e) {
      handleApiError(e, "Erro ao carregar horários")
    } finally {
      setLoading(false)
    }
  }, [sessionPlanId])

  const fetchProfessionals = useCallback(async () => {
    try {
      const res: any = await api.getProfessionals({ limit: 200 })
      setProfessionals(res.data || [])
    } catch {
      setProfessionals([])
    }
  }, [])

  useEffect(() => {
    fetchSlots()
    fetchProfessionals()
  }, [fetchSlots, fetchProfessionals])

  const professionalOptions: SelectOption[] = professionals.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  const openNew = () => {
    setEditingSlot(null)
    form.reset({
      weekday: "",
      start_time: "",
      capacity: fallbackCapacity,
      professional_id: "",
    })
    setDialogOpen(true)
  }

  const openEdit = (slot: SessionPlanSlot) => {
    setEditingSlot(slot)
    form.reset({
      weekday: String(slot.weekday),
      start_time: slot.start_time,
      capacity: String(slot.capacity),
      professional_id: slot.professional_id || "",
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: SlotFormData) => {
    setSaving(true)
    try {
      const payload = {
        weekday: Number(data.weekday),
        start_time: data.start_time,
        capacity: Number(data.capacity),
        professional_id: data.professional_id || null,
      }
      if (editingSlot) {
        await api.updateSessionPlanSlot(sessionPlanId, editingSlot.id, payload)
        showToast.success("Horário atualizado!")
      } else {
        await api.createSessionPlanSlot(sessionPlanId, payload)
        showToast.success("Horário criado!")
      }
      setDialogOpen(false)
      fetchSlots()
    } catch (e) {
      handleApiError(e, "Erro ao salvar horário")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (slot: SessionPlanSlot) => {
    setSlotToDelete(slot)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!slotToDelete) return
    try {
      await api.deleteSessionPlanSlot(sessionPlanId, slotToDelete.id)
      showToast.success("Horário removido!")
      fetchSlots()
    } catch (e) {
      handleApiError(e, "Erro ao remover horário")
    } finally {
      setDeleteOpen(false)
      setSlotToDelete(null)
    }
  }

  const professionalNameById = professionals.reduce<Record<string, string>>((acc, p) => {
    acc[p.id] = p.name
    return acc
  }, {})

  // Group slots by weekday
  const slotsByDay: Record<number, SessionPlanSlot[]> = {}
  slots.forEach((s) => {
    if (!slotsByDay[s.weekday]) slotsByDay[s.weekday] = []
    slotsByDay[s.weekday].push(s)
  })
  Object.values(slotsByDay).forEach((arr) =>
    arr.sort((a, b) => a.start_time.localeCompare(b.start_time))
  )
  const orderedDays = Object.keys(slotsByDay)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 rounded-lg border border-border/80 bg-muted/30 p-3">
        <div className="text-xs text-muted-foreground">
          Cada horário (dia + hora) é um <strong>slot</strong> independente, com capacidade própria
          e profissional opcional. Use múltiplos slots no mesmo dia para aulas em horários
          diferentes (ex: Pilates 8h, 9h, 10:10).
        </div>
        <Button
          size="sm"
          className="h-9 shrink-0 rounded-lg bg-primary px-4 font-semibold hover:bg-primary/90"
          onClick={openNew}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo horário
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <Clock className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhum horário cadastrado para este plano.
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground/70">
            Adicione pelo menos um horário (dia + hora) para que alunos possam se inscrever neste
            plano. Os limites de capacidade serão por horário.
          </p>
          <Button variant="outline" size="sm" className="mt-4 rounded-lg" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar primeiro horário
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orderedDays.map((wd) => (
            <div key={wd} className="overflow-hidden rounded-lg border border-border/80 bg-card">
              <div className="border-b border-border/60 bg-muted/30 px-4 py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {WEEK_DAY_LABELS[wd]}
                </span>
                <span className="ml-2 text-[11px] text-muted-foreground/70">
                  {slotsByDay[wd].length} {slotsByDay[wd].length === 1 ? "horário" : "horários"}
                </span>
              </div>
              <ul className="divide-y divide-border/60">
                {slotsByDay[wd].map((slot) => (
                  <li
                    key={slot.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      !slot.is_active ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground tabular-nums">
                          {slot.start_time}
                        </span>
                        {!slot.is_active && (
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Capacidade {slot.capacity}
                        {slot.professional_id && professionalNameById[slot.professional_id]
                          ? ` · ${professionalNameById[slot.professional_id]}`
                          : " · qualquer profissional"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md border-border bg-transparent text-muted-foreground hover:text-foreground"
                        title="Editar"
                        onClick={() => openEdit(slot)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md border-border bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Remover"
                        onClick={() => confirmDelete(slot)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Editar horário" : "Novo horário"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="slot-weekday">Dia da semana</Label>
                <Select
                  value={form.watch("weekday")}
                  onValueChange={(v) => form.setValue("weekday", v)}
                >
                  <SelectTrigger id="slot-weekday">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEK_DAYS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.weekday && (
                  <p className="text-xs text-destructive">{form.formState.errors.weekday.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <TimePickerInline
                  value={form.watch("start_time")}
                  onChange={(v) => form.setValue("start_time", v)}
                  interval={10}
                  placeholder="HH:MM"
                  className="h-10 w-full px-3"
                />
                {form.formState.errors.start_time && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.start_time.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-capacity">Capacidade (vagas neste horário)</Label>
              <Input
                id="slot-capacity"
                type="number"
                min={1}
                max={200}
                {...form.register("capacity")}
              />
              {form.formState.errors.capacity && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.capacity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Profissional <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <ReactSelect
                options={[
                  { value: "", label: "Qualquer profissional" },
                  ...professionalOptions,
                ]}
                value={
                  form.watch("professional_id")
                    ? professionalOptions.find((o) => o.value === form.watch("professional_id")) ||
                      null
                    : { value: "", label: "Qualquer profissional" }
                }
                onChange={(option) => form.setValue("professional_id", option ? option.value : "")}
                isSearchable
                isClearable={false}
              />
              <span className="text-[11px] text-muted-foreground">
                Quando setado, sobrescreve o profissional padrão da turma só neste horário.
              </span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remover horário"
        description={
          slotToDelete
            ? `Remover ${WEEK_DAY_LABELS[slotToDelete.weekday]} às ${slotToDelete.start_time}? Inscrições neste horário podem ser afetadas.`
            : ""
        }
        confirmText="Remover"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
