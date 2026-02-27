"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Activity } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { Procedure, PaginatedResponse } from "@/types/api"

// Schema de validação com Zod
const procedureSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  duration_minutes: z.number().min(1, "Duração deve ser maior que 0"),
  price: z.number().min(0, "Preço base predefinido deve ser maior ou igual a 0"),
})

type ProcedureFormData = z.infer<typeof procedureSchema>

interface ProcedimentosPageProps {
  params: Promise<{ lng: string }>
}

export default function ProcedimentosPage({ params }: ProcedimentosPageProps) {
  const [lng, setLng] = useState("pt-BR")
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_minutes: 30,
      price: 0,
    },
  })

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  const fetchProcedures = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.getProcedures(1, 100)
      setProcedures(response.data || [])
    } catch (error) {
      handleApiError(error, "Erro ao carregar procedimentos")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProcedures()
  }, [fetchProcedures])

  const handleOpenDialog = (procedure?: Procedure) => {
    if (procedure) {
      setEditingProcedure(procedure)
      reset({
        name: procedure.name,
        description: procedure.description || "",
        duration_minutes: procedure.duration_minutes,
        price: procedure.price,
      })
    } else {
      setEditingProcedure(null)
      reset({
        name: "",
        description: "",
        duration_minutes: 30,
        price: 0,
      })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (data: ProcedureFormData) => {
    setIsSaving(true)
    try {
      if (editingProcedure) {
        await api.updateProcedure(editingProcedure.id, data)
        showToast.success("Procedimento atualizado com sucesso!")
      } else {
        await api.createProcedure(data)
        showToast.success("Procedimento criado com sucesso!")
      }

      setDialogOpen(false)
      fetchProcedures()
    } catch (error) {
      handleApiError(error, "Erro ao salvar procedimento")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (procedure: Procedure) => {
    if (!confirm(`Tem certeza que deseja excluir ${procedure.name}?`)) return

    try {
      await api.deleteProcedure(procedure.id)
      showToast.success("Procedimento excluído com sucesso!")
      fetchProcedures()
    } catch (error) {
      handleApiError(error, "Erro ao excluir procedimento")
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Procedimentos" tutorialPage="procedimentos" />

      <div className="flex-1 p-4 md:p-6">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {procedures.length} procedimento(s) cadastrado(s)
          </p>

          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Procedimento
          </Button>
        </div>

        {/* Procedures List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : procedures.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum procedimento cadastrado
            </p>
          </div>
        ) : (
          <div className="rounded-md border bg-card shadow-sm">
            <Table className="text-base">
              <TableHeader>
                <TableRow>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço Base</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedures.map((procedure) => (
                  <TableRow key={procedure.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <div>{procedure.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{procedure.description || "-"}</TableCell>
                    <TableCell>{procedure.duration_minutes} min</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(procedure.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(procedure)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(procedure)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Procedure Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingProcedure ? "Editar Procedimento" : "Novo Procedimento"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Nome do procedimento"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Descrição breve"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">
                    Duração (minutos) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    {...register("duration_minutes", { valueAsNumber: true })}
                    className={errors.duration_minutes ? "border-destructive" : ""}
                  />
                  {errors.duration_minutes && (
                    <p className="text-sm text-destructive">
                      {errors.duration_minutes.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Preço Base (R$) <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="price"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
