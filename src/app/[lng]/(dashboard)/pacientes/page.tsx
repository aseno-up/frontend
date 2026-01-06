"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Search, Pencil, Trash2, Phone, Mail, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ReactSelect, SelectOption } from "@/components/ui/react-select"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { Patient, PaginatedResponse } from "@/types/api"

// Schema de validacao com Zod
const patientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  phone: z.string().min(1, "Telefone e obrigatorio"),
  whatsapp: z.string().optional(),
  document: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional().or(z.literal("")),
  notes: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

const genderOptions: SelectOption[] = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
  { value: "other", label: "Outro" },
]

interface PacientesPageProps {
  params: Promise<{ lng: string }>
}

export default function PacientesPage({ params }: PacientesPageProps) {
  const router = useRouter()
  const [lng, setLng] = useState("pt-BR")
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      whatsapp: "",
      document: "",
      birth_date: "",
      gender: "",
      notes: "",
    },
  })

  const genderValue = watch("gender")

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  const fetchPatients = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<Patient> = await api.getPatients(
        page,
        20,
        search || undefined
      )
      setPatients(response.data)
      setTotal(response.total)
    } catch (error) {
      console.error("Error fetching patients:", error)
      handleApiError(error, "Erro ao carregar pacientes")
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPatients()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchPatients])

  const handleOpenDialog = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient)
      reset({
        name: patient.name,
        email: patient.email || "",
        phone: patient.phone || "",
        whatsapp: patient.whatsapp || "",
        document: patient.document || "",
        birth_date: patient.birth_date ? patient.birth_date.split("T")[0] : "",
        gender: patient.gender || "",
        notes: patient.notes || "",
      })
    } else {
      setEditingPatient(null)
      reset({
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        document: "",
        birth_date: "",
        gender: "",
        notes: "",
      })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (data: PatientFormData) => {
    setIsSaving(true)
    try {
      const payload = {
        ...data,
        gender: data.gender || undefined,
        birth_date: data.birth_date || undefined,
        email: data.email || undefined,
      }

      if (editingPatient) {
        await api.updatePatient(editingPatient.id, payload)
        showToast.success("Paciente atualizado com sucesso!")
      } else {
        await api.createPatient(payload)
        showToast.success("Paciente criado com sucesso!")
      }

      setDialogOpen(false)
      fetchPatients()
    } catch (error) {
      handleApiError(error, "Erro ao salvar paciente")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (patient: Patient) => {
    if (!confirm(`Tem certeza que deseja excluir ${patient.name}?`)) return

    try {
      await api.deletePatient(patient.id)
      showToast.success("Paciente excluido com sucesso!")
      fetchPatients()
    } catch (error) {
      handleApiError(error, "Erro ao excluir paciente")
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Pacientes" />

      <div className="flex-1 p-4 md:p-6">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>

          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {search
                ? "Nenhum paciente encontrado"
                : "Nenhum paciente cadastrado"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <Card key={patient.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{patient.name}</h3>
                        {patient.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                        {(patient.phone || patient.whatsapp) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{patient.whatsapp || patient.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Ver Ficha"
                          onClick={() => router.push(`/${lng}/pacientes/${patient.id}`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar"
                          onClick={() => handleOpenDialog(patient)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Excluir"
                          onClick={() => handleDelete(patient)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Proximo
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Patient Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Editar Paciente" : "Novo Paciente"}
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
                  <Label htmlFor="phone">
                    Telefone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="(00) 00000-0000"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    {...register("whatsapp")}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document">CPF</Label>
                  <Input
                    id="document"
                    {...register("document")}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    {...register("birth_date")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Genero</Label>
                <ReactSelect
                  value={genderOptions.find((opt) => opt.value === genderValue) || null}
                  onChange={(option) =>
                    setValue("gender", (option?.value as "male" | "female" | "other") || "")
                  }
                  options={genderOptions}
                  placeholder="Selecione..."
                  isClearable
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observacoes</Label>
                <Input
                  id="notes"
                  {...register("notes")}
                  placeholder="Observacoes sobre o paciente..."
                />
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
