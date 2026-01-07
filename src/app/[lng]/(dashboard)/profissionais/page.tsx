"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Mail, Phone, User } from "lucide-react"
import { useForm } from "react-hook-form"
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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { Professional, PaginatedResponse } from "@/types/api"

// Schema de validacao com Zod
const professionalSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  registration_number: z.string().optional(),
  color: z.string().optional(),
  is_active: z.boolean().optional(),
})

type ProfessionalFormData = z.infer<typeof professionalSchema>

interface ProfissionaisPageProps {
  params: Promise<{ lng: string }>
}

const defaultColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
]

export default function ProfissionaisPage({ params }: ProfissionaisPageProps) {
  const [lng, setLng] = useState("pt-BR")
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedColor, setSelectedColor] = useState(defaultColors[0])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialty: "",
      registration_number: "",
      color: defaultColors[0],
      is_active: true,
    },
  })

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  const fetchProfessionals = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<Professional> = await api.getProfessionals(1, 100)
      setProfessionals(response.data)
    } catch (error) {
      handleApiError(error, "Erro ao carregar profissionais")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfessionals()
  }, [fetchProfessionals])

  const handleOpenDialog = (professional?: Professional) => {
    if (professional) {
      setEditingProfessional(professional)
      const color = professional.color || defaultColors[0]
      setSelectedColor(color)
      reset({
        name: professional.name,
        email: professional.email || "",
        phone: professional.phone || "",
        specialty: professional.specialty || "",
        registration_number: professional.registration_number || "",
        color: color,
        is_active: professional.is_active,
      })
    } else {
      setEditingProfessional(null)
      const colorIndex = professionals.length % defaultColors.length
      const color = defaultColors[colorIndex]
      setSelectedColor(color)
      reset({
        name: "",
        email: "",
        phone: "",
        specialty: "",
        registration_number: "",
        color: color,
        is_active: true,
      })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (data: ProfessionalFormData) => {
    setIsSaving(true)
    try {
      const payload = {
        ...data,
        color: selectedColor,
        email: data.email || undefined,
      }

      if (editingProfessional) {
        await api.updateProfessional(editingProfessional.id, payload)
        showToast.success("Profissional atualizado com sucesso!")
      } else {
        await api.createProfessional(payload)
        showToast.success("Profissional criado com sucesso!")
      }

      setDialogOpen(false)
      fetchProfessionals()
    } catch (error) {
      handleApiError(error, "Erro ao salvar profissional")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (professional: Professional) => {
    if (!confirm(`Tem certeza que deseja excluir ${professional.name}?`)) return

    try {
      await api.deleteProfessional(professional.id)
      showToast.success("Profissional excluido com sucesso!")
      fetchProfessionals()
    } catch (error) {
      handleApiError(error, "Erro ao excluir profissional")
    }
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    setValue("color", color)
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Profissionais" />

      <div className="flex-1 p-4 md:p-6">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {professionals.length} profissional(is) cadastrado(s)
          </p>

          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        </div>

        {/* Professional List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum profissional cadastrado
            </p>
          </div>
        ) : (
          <div className="rounded-md border bg-card shadow-sm">
            <Table className="text-base">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionals.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell>
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: professional.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] text-white"
                          style={{ backgroundColor: professional.color }}
                        >
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div>{professional.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {professional.registration_number || "Sem registro"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{professional.specialty || "-"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {professional.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {professional.email}
                          </div>
                        )}
                        {professional.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {professional.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {professional.is_active ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(professional)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(professional)}
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

      {/* Professional Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? "Editar Profissional" : "Novo Profissional"}
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
                  placeholder="Nome completo"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input
                    id="specialty"
                    {...register("specialty")}
                    placeholder="Ex: Fisioterapeuta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registro</Label>
                  <Input
                    id="registration_number"
                    {...register("registration_number")}
                    placeholder="Ex: CREFITO-00000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="email@exemplo.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor no Calendario</Label>
                <div className="flex gap-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full transition-transform ${
                        selectedColor === color
                          ? "ring-2 ring-offset-2 ring-primary scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register("is_active")}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="is_active" className="font-normal">
                  Profissional ativo
                </Label>
              </div>
            </div>

            <DialogFooter>
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
