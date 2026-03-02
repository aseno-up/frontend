"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Search, Pencil, Trash2, Mail, Phone, User, Clock, CheckCircle2, MoreHorizontal, Users, Briefcase } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReactSelect, SelectOption } from "@/components/ui/react-select"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import { WorkingHoursEditor } from "@/components/professionals/working-hours-editor"
import type { Professional, PaginatedResponse, WorkingHours } from "@/types/api"

// Schema
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
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
]

const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: [{ start: '08:00', end: '18:00' }],
  tuesday: [{ start: '08:00', end: '18:00' }],
  wednesday: [{ start: '08:00', end: '18:00' }],
  thursday: [{ start: '08:00', end: '18:00' }],
  friday: [{ start: '08:00', end: '18:00' }],
  saturday: [],
  sunday: [],
}

function getInitials(name: string) {
  return name.split(' ').filter(n => n.length > 0).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function ProfissionaisPage({ params }: ProfissionaisPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [lng, setLng] = useState("pt-BR")
  const [professionals, setProfessionals] = useState<Professional[]>([])
  
  // Pagination / Meta
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [inactiveCount, setInactiveCount] = useState(0)
  const [specialtyCount, setSpecialtyCount] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  
  // URL Params read
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)
  const search = searchParams.get("search") || ""
  const statusParam = searchParams.get("status") || "all"
  const sortBy = searchParams.get("sort_by") || "name_asc"

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedColor, setSelectedColor] = useState(defaultColors[0])
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS)
  const [activeTab, setActiveTab] = useState("info")

  const [searchInput, setSearchInput] = useState(search)

  // Bulk Actions & Delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [professionalToDelete, setProfessionalToDelete] = useState<Professional | null>(null)
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(professionals.map(p => p.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (checked: boolean, id: string) => {
    const newSet = new Set(selectedIds)
    if (checked) newSet.add(id)
    else newSet.delete(id)
    setSelectedIds(newSet)
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: "", email: "", phone: "", specialty: "", registration_number: "", color: defaultColors[0], is_active: true }
  })

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

  const fetchProfessionals = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: any = await api.getProfessionals({
        page,
        limit,
        search: search || undefined,
        status: statusParam !== "all" ? statusParam : undefined,
        sort_by: sortBy
      })
      
      setProfessionals(response.data || [])
      setTotal(response.meta?.total || 0)
      setTotalPages(response.meta?.total_pages || 1)
      setSelectedIds(new Set()) // Reset selection on page change/fetch
      
      // Calculate local actives/inactives and specialties as mock 
      const activeList = (response.data || []).filter((p: Professional) => p.is_active)
      setActiveCount(activeList.length)
      setInactiveCount((response.data || []).length - activeList.length)

      const specs = new Set((response.data || []).filter((p: Professional) => p.specialty).map((p: Professional) => p.specialty))
      setSpecialtyCount(specs.size)

    } catch (error) {
      console.error("Error fetching professionals:", error)
      handleApiError(error, "Erro ao carregar profissionais")
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, statusParam, sortBy])

  useEffect(() => {
    fetchProfessionals()
  }, [fetchProfessionals])

  const handleOpenDialog = (professional?: Professional) => {
    setActiveTab("info")
    if (professional) {
      setEditingProfessional(professional)
      const color = professional.color || defaultColors[0]
      setSelectedColor(color)
      setWorkingHours(professional.working_hours || DEFAULT_WORKING_HOURS)
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
      setWorkingHours(DEFAULT_WORKING_HOURS)
      reset({
        name: "", email: "", phone: "", specialty: "", registration_number: "", color: color, is_active: true
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
        working_hours: workingHours,
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

  const confirmDelete = async () => {
    if (!professionalToDelete) return
    try {
      await api.deleteProfessional(professionalToDelete.id)
      showToast.success("Profissional excluído com sucesso!")
      fetchProfessionals()
    } catch (error) {
      handleApiError(error, "Erro ao excluir profissional")
    }
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return
    try {
      await api.bulkDeleteProfessionals(Array.from(selectedIds))
      showToast.success(`${selectedIds.size} profissionais excluídos com sucesso!`)
      setSelectedIds(new Set())
      fetchProfessionals()
    } catch (error) {
      handleApiError(error, "Erro ao excluir profissionais em massa")
    }
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    setValue("color", color)
  }

  const sortOptions: SelectOption[] = [
    { value: "name_asc", label: "Ordenar: Nome A-Z" },
    { value: "name_desc", label: "Ordenar: Nome Z-A" },
    { value: "created_desc", label: "Ordenar: Mais recentes" },
    { value: "created_asc", label: "Ordenar: Mais antigos" },
  ]

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Profissionais" tutorialPage="profissionais" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
        {/* Status Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
               <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Total de profissionais</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{statusParam === "all" ? activeCount : (statusParam === "active" ? total : 0)}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Profissionais ativos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
               <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{statusParam === "all" ? inactiveCount : (statusParam === "inactive" ? total : 0)}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Profissionais inativos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
               <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{specialtyCount}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Especialidades ativas</div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 min-w-[300px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou especialidade..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-10 border-none shadow-none bg-muted/50 rounded-lg focus-visible:ring-1"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                className="h-9 px-4 font-semibold mr-2 animate-in fade-in"
                onClick={() => setBulkDeleteModalOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir ({selectedIds.size})
              </Button>
            )}
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
                className={`rounded-full h-8 px-4 text-xs font-semibold ${statusParam === "active" ? "border-emerald-500 text-emerald-500" : "border-border text-muted-foreground"}`}
                onClick={() => updateQueryParams({ status: "active" })}
              >
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${statusParam === "active" ? "bg-emerald-500" : "bg-emerald-500/50"}`} />
                Ativos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`rounded-full h-8 px-4 text-xs font-semibold ${statusParam === "inactive" ? "border-rose-500 text-rose-500" : "border-border text-muted-foreground"}`}
                onClick={() => updateQueryParams({ status: "inactive" })}
              >
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${statusParam === "inactive" ? "bg-rose-500" : "bg-rose-500/50"}`} />
                Inativos
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

            <Button className="h-10 px-5 font-semibold bg-primary hover:bg-primary/90 rounded-lg ml-2" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Profissional
            </Button>
          </div>
        </div>

        {/* Professional List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : professionals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              {search || statusParam !== "all"
                ? "Nenhum profissional encontrado para esses filtros"
                : "Nenhum profissional cadastrado ainda"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col flex-1">
            <Table className="text-sm" wrapperClassName="flex-1 overflow-auto">
              <TableHeader className="sticky top-0 bg-slate-50 z-20 shadow-sm dark:bg-slate-900 border-b">
                  <TableRow>
                    <TableHead className="w-[40px] px-4">
                      <Checkbox 
                        checked={professionals.length > 0 && selectedIds.size === professionals.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                     <SortableTableHead sortKey="name" title="PROFISSIONAL" className="w-[350px]" />
                     <SortableTableHead sortKey="specialty" title="ESPECIALIDADE" />
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">CONTATO</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">STATUS</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/70">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionals.map((professional) => {
                    const isSelected = selectedIds.has(professional.id)
                    return (
                    <TableRow key={professional.id} className="group" data-state={isSelected ? "selected" : undefined}>
                      <TableCell className="px-4">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(!!checked, professional.id)}
                          aria-label={`Selecionar ${professional.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex items-center justify-center w-10 h-10 shrink-0 text-white font-bold rounded-full text-xs shadow-sm"
                            style={{ backgroundColor: professional.color || defaultColors[0] }}
                          >
                            {getInitials(professional.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate">{professional.name}</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
                              <span className="truncate">{professional.registration_number || "Sem registro (vazio)"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {professional.specialty ? (
                           <span className="text-muted-foreground font-medium">{professional.specialty}</span>
                        ) : (
                           <span className="text-muted-foreground/50 italic">Não informada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {professional.phone ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs">
                              <Phone className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                              <span>{professional.phone}</span>
                            </div>
                          ) : null}
                          {professional.email ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <Mail className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                              <span className="truncate max-w-[150px]">{professional.email}</span>
                            </div>
                          ) : null}
                          {!professional.phone && !professional.email && (
                             <span className="text-muted-foreground/50 italic text-xs">Sem contato</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {professional.is_active ? (
                          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold w-fit border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                             Ativo
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-xs font-bold w-fit border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-500">
                             <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                             Inativo
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md bg-transparent border-border text-muted-foreground hover:text-foreground"
                            title="Editar"
                            onClick={() => handleOpenDialog(professional)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md bg-transparent border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Excluir"
                            onClick={() => {
                              setProfessionalToDelete(professional)
                              setDeleteModalOpen(true)
                            }}
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
            
            <div className="border-t p-4 shrink-0 bg-card">
              <DataTablePagination meta={{ page, limit, total, total_pages: totalPages }} entityName="profissionais" />
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? "Editar Profissional" : "Novo Profissional"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações
                </TabsTrigger>
                <TabsTrigger value="hours" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horários
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 py-4">
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
                  <Label>Cor no Calendário</Label>
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
                  <Label htmlFor="is_active" className="font-normal cursor-pointer">
                    Profissional ativo
                  </Label>
                </div>
              </TabsContent>

              <TabsContent value="hours" className="py-4">
                <WorkingHoursEditor
                  value={workingHours}
                  onChange={setWorkingHours}
                />
              </TabsContent>
            </Tabs>

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
      
      <ConfirmDialog 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Excluir Profissional"
        description={`Tem certeza que deseja excluir o profissional ${professionalToDelete?.name}? Esta ação não pode ser desfeita.`}
      />

      <ConfirmDialog 
        open={bulkDeleteModalOpen}
        onOpenChange={setBulkDeleteModalOpen}
        onConfirm={confirmBulkDelete}
        title="Excluir Profissionais"
        description={`Tem certeza que deseja excluir ${selectedIds.size} profissionais selecionados? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.`}
      />
    </div>
  )
}
