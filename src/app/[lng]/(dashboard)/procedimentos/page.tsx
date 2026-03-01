"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Search, Pencil, Trash2, Activity, CheckCircle2, Clock, Calendar, Briefcase, MoreHorizontal } from "lucide-react"
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
import { ReactSelect, SelectOption } from "@/components/ui/react-select"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { Procedure, PaginatedResponse } from "@/types/api"

// Schema
const procedureSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  duration_minutes: z.number().min(1, "Duração deve ser maior ou igual a 1"),
  price: z.number().min(0, "Preço base predefinido deve ser maior ou igual a 0"),
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
  const statusParam = searchParams.get("status") || "all"
  const sortBy = searchParams.get("sort_by") || "name_asc"

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [searchInput, setSearchInput] = useState(search)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: { name: "", description: "", duration_minutes: 30, price: 0 }
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
      })
    } else {
      setEditingProcedure(null)
      reset({ name: "", description: "", duration_minutes: 30, price: 0 })
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

  const sortOptions: SelectOption[] = [
    { value: "name_asc", label: "Ordenar: Nome A-Z" },
    { value: "name_desc", label: "Ordenar: Nome Z-A" },
    { value: "price_desc", label: "Ordenar: Maior Valor" },
    { value: "price_asc", label: "Ordenar: Menor Valor" },
  ]

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Procedimentos" tutorialPage="procedimentos" />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Status Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-wrap items-center justify-between gap-4">
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

            <Button className="h-10 px-5 font-semibold bg-emerald-500 hover:bg-emerald-600 rounded-lg ml-2" onClick={() => handleOpenDialog()}>
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
          <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col pt-2 pb-6">
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                     <SortableTableHead sortKey="name" title="PROCEDIMENTO" className="w-[350px]" />
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">DESCRIÇÃO</TableHead>
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">DURAÇÃO</TableHead>
                     <SortableTableHead sortKey="price" title="PREÇO BASE" />
                     <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/70">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedures.map((procedure) => (
                    <TableRow key={procedure.id} className="group">
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
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            
            <DataTablePagination meta={{ page, limit, total, total_pages: totalPages }} entityName="procedimentos" />
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
