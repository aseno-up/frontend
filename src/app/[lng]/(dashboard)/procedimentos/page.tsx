"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Search, Pencil, Trash2, Activity, CheckCircle2, Clock, Calendar, Briefcase, MoreHorizontal, RotateCcw } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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
import { CurrencyInput } from "@/components/ui/currency-input"
import { ReactSelect, ReactCreatableSelect, SelectOption } from "@/components/ui/react-select"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { Procedure, PaginatedResponse, SpecialtyInfo } from "@/types/api"

// Schema
const procedureSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  duration_minutes: z.number().min(1, "Duração deve ser maior ou igual a 1"),
  price: z.number().min(0, "Preço base predefinido deve ser maior ou igual a 0"),
  specialty_id: z.string().optional().nullable(),
})

type ProcedureFormData = z.infer<typeof procedureSchema>

interface ProcedimentosPageProps {
  params: Promise<{ lng: string }>
}

export default function ProcedimentosPage({ params }: ProcedimentosPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [lng, setLng] = useState("pt-BR")
  const [procedures, setProcedures] = useState<Procedure[]>([])
  
  // Pagination & Meta
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  // Custom mock analytics
  const [activeCount, setActiveCount] = useState(0)
  const [inactiveCount, setInactiveCount] = useState(0)
  
  // URL Params read
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)
  const search = searchParams.get("search") || ""
  const statusParam = searchParams.get("status") || "active"
  const sortBy = searchParams.get("sort_by") || "name_asc"

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [searchInput, setSearchInput] = useState(search)

  // Bulk Actions & Delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null)
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(procedures.map(p => p.id))
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
    control,
    formState: { errors },
    reset,
  } = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: { name: "", description: "", duration_minutes: 30, price: 0, specialty_id: null }
  })

  // Specialties for the select in the dialog
  const [specialtyOptions, setSpecialtyOptions] = useState<SelectOption[]>([])
  const specialtyNameById = specialtyOptions.reduce<Record<string, string>>((acc, o) => {
    acc[o.value] = o.label
    return acc
  }, {})

  const loadSpecialtyOptions = useCallback(async () => {
    try {
      const res: any = await api.getSpecialtiesActive()
      const list: SpecialtyInfo[] = res.data ?? res ?? []
      setSpecialtyOptions(list.map((s) => ({ value: s.id, label: s.name })))
    } catch (e) {
      console.error("Error loading specialties", e)
    }
  }, [])

  useEffect(() => {
    loadSpecialtyOptions()
  }, [loadSpecialtyOptions])

  const handleCreateSpecialty = async (name: string): Promise<SelectOption | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null
    try {
      const created = await api.createSpecialty({ name: trimmed })
      const option: SelectOption = { value: created.id, label: created.name }
      setSpecialtyOptions((prev) => [...prev, option])
      return option
    } catch (e) {
      handleApiError(e, "Erro ao criar especialidade")
      return null
    }
  }

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

  const fetchProcedures = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: any = await api.getProcedures({
        page,
        limit,
        search: search || undefined,
        status: statusParam !== "all" ? statusParam : undefined,
        sort_by: sortBy
      })
      
      setProcedures(response.data || [])
      setTotal(response.meta?.total || 0)
      setTotalPages(response.meta?.total_pages || 1)
      setSelectedIds(new Set()) // Reset selection on page change/fetch
      
      // Calculate local actives/inactives (Mock para fins de UI ja que na lista tudo e ativo, exceto talvez uns excluidos logicos)
      // Assuming `is_active` might exist, otherwise pretend it is 100% active.
      const activeList = (response.data || []).filter((p: any) => p.is_active !== false)
      setActiveCount(activeList.length)
      setInactiveCount((response.data || []).length - activeList.length)

    } catch (error) {
      handleApiError(error, "Erro ao carregar procedimentos")
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, statusParam, sortBy])

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
        specialty_id: procedure.specialty_id ?? null,
      })
    } else {
      setEditingProcedure(null)
      reset({ name: "", description: "", duration_minutes: 30, price: 0, specialty_id: null })
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

  const confirmDelete = async () => {
    if (!procedureToDelete) return
    try {
      await api.deleteProcedure(procedureToDelete.id)
      showToast.success("Procedimento excluído com sucesso!")
      fetchProcedures()
    } catch (error) {
      handleApiError(error, "Erro ao excluir procedimento")
    }
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return
    try {
      await api.bulkDeleteProcedures(Array.from(selectedIds))
      showToast.success(`${selectedIds.size} procedimentos excluídos com sucesso!`)
      setSelectedIds(new Set())
      fetchProcedures()
    } catch (error) {
      handleApiError(error, "Erro ao excluir procedimentos em massa")
    }
  }

  const sortOptions: SelectOption[] = [
    { value: "name_asc", label: "Ordenar: Nome A-Z" },
    { value: "name_desc", label: "Ordenar: Nome Z-A" },
    { value: "price_desc", label: "Ordenar: Maior Valor" },
    { value: "price_asc", label: "Ordenar: Menor Valor" },
  ]

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Procedimentos" tutorialPage="procedimentos" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
        {/* Status Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
               <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Total de procedimentos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{statusParam === "all" ? activeCount : (statusParam === "active" ? total : 0)}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Procedimentos ativos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
               <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{statusParam === "all" ? inactiveCount : (statusParam === "inactive" ? total : 0)}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Procedimentos inativos</div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 min-w-[300px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do procedimento..."
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
              Novo Procedimento
            </Button>
          </div>
        </div>

        {/* Procedures List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : procedures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              {search || statusParam !== "all"
                ? "Nenhum procedimento encontrado para esses filtros"
                : "Nenhum procedimento cadastrado ainda"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col flex-1">
            <Table className="text-sm" wrapperClassName="flex-1 overflow-auto">
              <TableHeader className="sticky top-0 bg-slate-50 z-20 shadow-sm dark:bg-slate-900 border-b">
                  <TableRow>
                    <TableHead className="w-[40px] px-4">
                      <Checkbox 
                        checked={procedures.length > 0 && selectedIds.size === procedures.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                     <SortableTableHead sortKey="name" title="PROCEDIMENTO" className="w-[350px]" />
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">ESPECIALIDADE</TableHead>
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">DESCRIÇÃO</TableHead>
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">DURAÇÃO</TableHead>
                     <SortableTableHead sortKey="price" title="PREÇO BASE" />
                     <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/70">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedures.map((procedure) => {
                    const isSelected = selectedIds.has(procedure.id)
                    return (
                    <TableRow key={procedure.id} className="group" data-state={isSelected ? "selected" : undefined}>
                      <TableCell className="px-4">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(!!checked, procedure.id)}
                          aria-label={`Selecionar ${procedure.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 transition-transform group-hover:scale-105">
                            <Activity className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate text-base">{procedure.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {procedure.specialty_id && specialtyNameById[procedure.specialty_id] ? (
                          <span className="text-muted-foreground font-medium">
                            {specialtyNameById[procedure.specialty_id]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 italic">Não informada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground truncate max-w-[200px] inline-block">{procedure.description || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                           <Clock className="w-4 h-4 text-muted-foreground/50" />
                           {procedure.duration_minutes} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(procedure.price || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {statusParam === "inactive" ? (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md bg-transparent border-border text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                              title="Reativar"
                              onClick={async () => {
                                try {
                                  await api.restoreProcedure(procedure.id)
                                  showToast.success("Procedimento reativado")
                                  fetchProcedures()
                                } catch (err) {
                                  handleApiError(err, "Erro ao reativar procedimento")
                                }
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-md bg-transparent border-border text-muted-foreground hover:text-foreground"
                                title="Editar"
                                onClick={() => handleOpenDialog(procedure)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-md bg-transparent border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Excluir"
                                onClick={() => {
                                  setProcedureToDelete(procedure)
                                  setDeleteModalOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            
            <div className="border-t p-4 shrink-0 bg-card">
              <DataTablePagination meta={{ page, limit, total, total_pages: totalPages }} entityName="procedimentos" />
            </div>
          </div>
        )}
      </div>

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

              <div className="space-y-2">
                <Label htmlFor="specialty_id">Especialidade</Label>
                <Controller
                  name="specialty_id"
                  control={control}
                  render={({ field }) => {
                    const selected = field.value
                      ? specialtyOptions.find((o) => o.value === field.value) ?? null
                      : null
                    return (
                      <ReactCreatableSelect
                        inputId="specialty_id"
                        isClearable
                        options={specialtyOptions}
                        value={selected}
                        onChange={(opt) => field.onChange((opt as SelectOption | null)?.value ?? null)}
                        onCreateOption={async (name) => {
                          const option = await handleCreateSpecialty(name)
                          if (option) field.onChange(option.value)
                        }}
                        placeholder="Selecione, ou digite para criar..."
                      />
                    )
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Usada pela IA do WhatsApp para filtrar procedimentos por área.
                </p>
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
      
      <ConfirmDialog 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Excluir Procedimento"
        description={`Tem certeza que deseja excluir o procedimento ${procedureToDelete?.name}? Esta ação não pode ser desfeita.`}
      />

      <ConfirmDialog 
        open={bulkDeleteModalOpen}
        onOpenChange={setBulkDeleteModalOpen}
        onConfirm={confirmBulkDelete}
        title="Excluir Procedimentos"
        description={`Tem certeza que deseja excluir ${selectedIds.size} procedimentos selecionados? Esta ação não pode ser desfeita e todos os dados associados poderão ser perdidos.`}
      />
    </div>
  )
}
