"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Search, Pencil, Trash2, Phone, Mail, FileText, CheckCircle2, Clock, Calendar, Users, MoreHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
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

// Schema
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 
    'bg-amber-500', 'bg-blue-500', 'bg-indigo-500', 
    'bg-cyan-500', 'bg-pink-500', 'bg-teal-500'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function PacientesPage({ params }: PacientesPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [lng, setLng] = useState("pt-BR")
  const [patients, setPatients] = useState<Patient[]>([])
  
  // Standard Meta format matching backend now
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [completeCount, setCompleteCount] = useState(0)
  const [incompleteCount, setIncompleteCount] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  
  // URL Params read
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)
  const search = searchParams.get("search") || ""
  const statusParam = searchParams.get("status") || "all"
  const sortBy = searchParams.get("sort_by") || "name_asc"

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [searchInput, setSearchInput] = useState(search)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: "", email: "", phone: "", whatsapp: "", document: "", birth_date: "", gender: "", notes: "" }
  })

  const genderValue = watch("gender")

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  const updateQueryParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    if (!updates.page) params.set("page", "1")
    router.push(pathname + "?" + params.toString(), { scroll: false })
  }, [searchParams, pathname, router])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        updateQueryParams({ search: searchInput })
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [searchInput, search, updateQueryParams])

  const fetchPatients = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: any = await api.getPatients({
        page,
        limit,
        search: search || undefined,
        status: statusParam !== "all" ? statusParam : undefined,
        sort_by: sortBy
      })
      
      setPatients(response.data || [])
      setTotal(response.meta?.total || 0)
      setTotalPages(response.meta?.total_pages || 1)
      
      // Calculate local completes / incompletes as mock for now, 
      // ideally backend would return this in meta!
      const completeList = (response.data || []).filter((p: Patient) => p.email && p.phone && p.document)
      setCompleteCount(completeList.length)
      setIncompleteCount((response.data || []).length - completeList.length)

    } catch (error) {
      console.error("Error fetching patients:", error)
      handleApiError(error, "Erro ao carregar pacientes")
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, statusParam, sortBy])

  useEffect(() => {
    fetchPatients()
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
      reset({ name: "", email: "", phone: "", whatsapp: "", document: "", birth_date: "", gender: "", notes: "" })
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
  
  const sortOptions: SelectOption[] = [
    { value: "name_asc", label: "Ordenar: Nome A-Z" },
    { value: "name_desc", label: "Ordenar: Nome Z-A" },
    { value: "created_desc", label: "Ordenar: Mais recentes" },
    { value: "created_asc", label: "Ordenar: Mais antigos" },
  ]

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Pacientes" tutorialPage="pacientes" />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Status Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
               <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Total de pacientes</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{statusParam === "all" ? completeCount : (statusParam === "complete" ? total : 0)}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Cadastros completos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
               <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{statusParam === "all" ? incompleteCount : (statusParam === "incomplete" ? total : 0)}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Cadastros incompletos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
               <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Agendamentos hoje</div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[300px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-10 border-none shadow-none bg-muted/50 rounded-lg focus-visible:ring-1"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex p-1 gap-1 items-center">
              <Button 
                variant="outline" 
                size="sm" 
                className={`rounded-full h-8 px-4 text-xs font-semibold ${statusParam === "all" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                onClick={() => updateQueryParams({ status: "all" })}
              >
                Todos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`rounded-full h-8 px-4 text-xs font-semibold ${statusParam === "complete" ? "border-emerald-500 text-emerald-500" : "border-border text-muted-foreground"}`}
                onClick={() => updateQueryParams({ status: "complete" })}
              >
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${statusParam === "complete" ? "bg-emerald-500" : "bg-emerald-500/50"}`} />
                Completos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`rounded-full h-8 px-4 text-xs font-semibold ${statusParam === "incomplete" ? "border-amber-500 text-amber-500" : "border-border text-muted-foreground"}`}
                onClick={() => updateQueryParams({ status: "incomplete" })}
              >
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${statusParam === "incomplete" ? "bg-amber-500" : "bg-amber-500/50"}`} />
                Incompletos
              </Button>
            </div>

            <div className="w-[200px] border-l border-border/50 pl-2">
              <ReactSelect
                value={sortOptions.find((opt) => opt.value === sortBy) || sortOptions[0]}
                onChange={(option) => updateQueryParams({ sort_by: option?.value || "name_asc" })}
                options={sortOptions}
                isSearchable={false}
                placeholder="Ordenar..."
              />
            </div>

            <Button className="h-10 px-5 font-semibold bg-emerald-500 hover:bg-emerald-600 rounded-lg ml-2" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </div>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              {search || statusParam !== "all"
                ? "Nenhum paciente encontrado para esses filtros"
                : "Nenhum paciente cadastrado ainda"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col pt-2 pb-6">
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead sortKey="name" title="PACIENTE" className="w-[350px]" />
                    <SortableTableHead sortKey="contact" title="CONTATO" />
                    <SortableTableHead sortKey="document" title="DOCUMENTO" />
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">STATUS</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/70">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => {
                    const isComplete = patient.email && patient.phone && patient.document
                    
                    return (
                      <TableRow key={patient.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-10 h-10 shrink-0 text-white font-bold rounded-full text-xs shadow-sm ${getAvatarColor(patient.name)}`}>
                              {getInitials(patient.name)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-foreground truncate">{patient.name}</span>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
                                {patient.email ? (
                                  <>
                                    <Mail className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{patient.email}</span>
                                  </>
                                ) : (
                                  <span className="text-amber-600/70 dark:text-amber-500/70 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Sem email
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(patient.phone || patient.whatsapp) && (
                            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                              <Phone className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                              <span>{patient.whatsapp || patient.phone}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {patient.document ? (
                            <span className="text-muted-foreground font-medium">{patient.document}</span>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-600 px-2 py-0.5 rounded-md text-xs font-semibold w-fit dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-500">
                              <MoreHorizontal className="w-3 h-3" /> Não informado
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isComplete ? (
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold w-fit border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500">
                               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                               Completo
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-xs font-bold w-fit border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-500">
                               <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                               Incompleto
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md bg-transparent border-border text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              title="Ver Ficha"
                              onClick={() => router.push(`/${lng}/pacientes/${patient.id}`)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md bg-transparent border-border text-muted-foreground hover:text-foreground"
                              title="Editar"
                              onClick={() => handleOpenDialog(patient)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md bg-transparent border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Excluir"
                              onClick={() => handleDelete(patient)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            
            <DataTablePagination meta={{ page, limit, total, total_pages: totalPages }} entityName="pacientes" />
          </div>
        )}
      </div>

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
