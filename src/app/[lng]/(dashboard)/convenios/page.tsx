"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShieldCheck,
  Network,
  Layers,
  CalendarDays,
  ChevronRight,
  Power,
  Sparkles,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { PartnerNetwork, PartnerPlan } from "@/types/api"

const networkSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
})
type NetworkFormData = z.infer<typeof networkSchema>

const planSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  max_sessions_per_week: z.string().optional(),
})
type PlanFormData = z.infer<typeof planSchema>

interface PageProps {
  params: Promise<{ lng: string }>
}

type StatusFilter = "all" | "active" | "inactive"

export default function ConveniosPage({ params }: PageProps) {
  const [lng, setLng] = useState("pt-BR")
  const [networks, setNetworks] = useState<PartnerNetwork[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState<PartnerNetwork | null>(null)
  const [plans, setPlans] = useState<PartnerPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPlans, setLoadingPlans] = useState(false)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")

  // Network dialog
  const [networkDialogOpen, setNetworkDialogOpen] = useState(false)
  const [editingNetwork, setEditingNetwork] = useState<PartnerNetwork | null>(null)
  const [networkSaving, setNetworkSaving] = useState(false)

  // Network delete
  const [deleteNetworkOpen, setDeleteNetworkOpen] = useState(false)
  const [networkToDelete, setNetworkToDelete] = useState<PartnerNetwork | null>(null)

  // Plan dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PartnerPlan | null>(null)
  const [planSaving, setPlanSaving] = useState(false)

  // Plan delete
  const [deletePlanOpen, setDeletePlanOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<PartnerPlan | null>(null)

  const networkForm = useForm<NetworkFormData>({
    resolver: zodResolver(networkSchema),
    defaultValues: { name: "" },
  })

  const planForm = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: "", max_sessions_per_week: "" },
  })

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  const loadNetworks = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await api.getPartnerNetworks()
      const list: PartnerNetwork[] = res.data ?? []
      setNetworks(list)
      setSelectedNetwork((current) => {
        if (!current) return current
        return list.find((n) => n.id === current.id) ?? null
      })
    } catch (e) {
      handleApiError(e, "Erro ao carregar convênios")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPlans = useCallback(async (networkId: string) => {
    setLoadingPlans(true)
    try {
      const res: any = await api.getPartnerPlansByNetwork(networkId)
      setPlans(res.data ?? [])
    } catch (e) {
      handleApiError(e, "Erro ao carregar planos")
    } finally {
      setLoadingPlans(false)
    }
  }, [])

  useEffect(() => {
    loadNetworks()
  }, [loadNetworks])

  useEffect(() => {
    if (selectedNetwork) {
      loadPlans(selectedNetwork.id)
    } else {
      setPlans([])
    }
  }, [selectedNetwork, loadPlans])

  // Filtered networks for the master list
  const filteredNetworks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return networks.filter((n) => {
      if (statusFilter === "active" && !n.is_active) return false
      if (statusFilter === "inactive" && n.is_active) return false
      if (q && !n.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [networks, search, statusFilter])

  // Top metrics
  const totals = useMemo(() => {
    const totalNetworks = networks.length
    const activeNetworks = networks.filter((n) => n.is_active).length
    const totalPlans = networks.reduce((acc, n) => acc + (n.plans?.length ?? 0), 0)
    return { totalNetworks, activeNetworks, totalPlans }
  }, [networks])

  // Auto-select first visible network when nothing selected
  useEffect(() => {
    if (!selectedNetwork && filteredNetworks.length > 0) {
      setSelectedNetwork(filteredNetworks[0])
    }
  }, [filteredNetworks, selectedNetwork])

  // ---- Network handlers ----

  const openNewNetwork = () => {
    setEditingNetwork(null)
    networkForm.reset({ name: "" })
    setNetworkDialogOpen(true)
  }

  const openEditNetwork = (n: PartnerNetwork) => {
    setEditingNetwork(n)
    networkForm.reset({ name: n.name })
    setNetworkDialogOpen(true)
  }

  const onSubmitNetwork = async (data: NetworkFormData) => {
    setNetworkSaving(true)
    try {
      if (editingNetwork) {
        await api.updatePartnerNetwork(editingNetwork.id, { name: data.name })
        showToast.success("Convênio atualizado com sucesso!")
      } else {
        await api.createPartnerNetwork({ name: data.name })
        showToast.success("Convênio criado com sucesso!")
      }
      setNetworkDialogOpen(false)
      await loadNetworks()
    } catch (e) {
      handleApiError(e, "Erro ao salvar convênio")
    } finally {
      setNetworkSaving(false)
    }
  }

  const toggleNetworkActive = async (n: PartnerNetwork) => {
    try {
      await api.updatePartnerNetwork(n.id, { is_active: !n.is_active })
      showToast.success(n.is_active ? "Convênio desativado" : "Convênio reativado")
      await loadNetworks()
    } catch (e) {
      handleApiError(e, "Erro ao alterar status do convênio")
    }
  }

  const confirmDeleteNetwork = (n: PartnerNetwork) => {
    setNetworkToDelete(n)
    setDeleteNetworkOpen(true)
  }

  const handleDeleteNetwork = async () => {
    if (!networkToDelete) return
    try {
      await api.deletePartnerNetwork(networkToDelete.id)
      showToast.success("Convênio removido com sucesso!")
      if (selectedNetwork?.id === networkToDelete.id) setSelectedNetwork(null)
      await loadNetworks()
    } catch (e) {
      handleApiError(e, "Erro ao remover convênio")
    } finally {
      setDeleteNetworkOpen(false)
      setNetworkToDelete(null)
    }
  }

  // ---- Plan handlers ----

  const openNewPlan = () => {
    if (!selectedNetwork) return
    setEditingPlan(null)
    planForm.reset({ name: "", max_sessions_per_week: "" })
    setPlanDialogOpen(true)
  }

  const openEditPlan = (p: PartnerPlan) => {
    setEditingPlan(p)
    planForm.reset({
      name: p.name,
      max_sessions_per_week: p.max_sessions_per_week ? String(p.max_sessions_per_week) : "",
    })
    setPlanDialogOpen(true)
  }

  const onSubmitPlan = async (data: PlanFormData) => {
    if (!selectedNetwork) return
    setPlanSaving(true)
    const max =
      data.max_sessions_per_week && data.max_sessions_per_week.trim() !== ""
        ? Number(data.max_sessions_per_week)
        : null
    if (max !== null && (Number.isNaN(max) || max < 1 || max > 14)) {
      planForm.setError("max_sessions_per_week", { message: "Deve ser entre 1 e 14" })
      setPlanSaving(false)
      return
    }
    try {
      if (editingPlan) {
        await api.updatePartnerPlan(editingPlan.id, {
          name: data.name,
          max_sessions_per_week: max,
        })
        showToast.success("Plano atualizado com sucesso!")
      } else {
        await api.createPartnerPlan({
          partner_network_id: selectedNetwork.id,
          name: data.name,
          max_sessions_per_week: max,
        })
        showToast.success("Plano criado com sucesso!")
      }
      setPlanDialogOpen(false)
      await loadPlans(selectedNetwork.id)
      await loadNetworks() // refresh plan counts
    } catch (e) {
      handleApiError(e, "Erro ao salvar plano")
    } finally {
      setPlanSaving(false)
    }
  }

  const togglePlanActive = async (p: PartnerPlan) => {
    try {
      await api.updatePartnerPlan(p.id, { is_active: !p.is_active })
      showToast.success(p.is_active ? "Plano desativado" : "Plano reativado")
      if (selectedNetwork) await loadPlans(selectedNetwork.id)
    } catch (e) {
      handleApiError(e, "Erro ao alterar status do plano")
    }
  }

  const confirmDeletePlan = (p: PartnerPlan) => {
    setPlanToDelete(p)
    setDeletePlanOpen(true)
  }

  const handleDeletePlan = async () => {
    if (!planToDelete) return
    try {
      await api.deletePartnerPlan(planToDelete.id)
      showToast.success("Plano removido com sucesso!")
      if (selectedNetwork) await loadPlans(selectedNetwork.id)
      await loadNetworks()
    } catch (e) {
      handleApiError(e, "Erro ao remover plano")
    } finally {
      setDeletePlanOpen(false)
      setPlanToDelete(null)
    }
  }

  // ---- Render ----

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Convênios" />

      <div className="flex flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6">
        {/* Status Cards */}
        <div className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totals.totalNetworks}</div>
              <div className="whitespace-nowrap text-sm text-muted-foreground">
                Convênios cadastrados
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totals.activeNetworks}</div>
              <div className="whitespace-nowrap text-sm text-muted-foreground">
                Convênios ativos
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totals.totalPlans}</div>
              <div className="whitespace-nowrap text-sm text-muted-foreground">
                Planos cadastrados
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="relative min-w-[280px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do convênio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-lg border-none bg-muted/50 pl-10 shadow-none focus-visible:ring-1"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <div className="flex items-center gap-1 p-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("all")}
                className={`h-8 rounded-full px-4 text-xs font-semibold ${
                  statusFilter === "all"
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("active")}
                className={`h-8 rounded-full px-4 text-xs font-semibold ${
                  statusFilter === "active"
                    ? "border-emerald-500 text-emerald-500"
                    : "border-border text-muted-foreground"
                }`}
              >
                <span
                  className={`mr-2 h-1.5 w-1.5 rounded-full ${
                    statusFilter === "active" ? "bg-emerald-500" : "bg-emerald-500/50"
                  }`}
                />
                Ativos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("inactive")}
                className={`h-8 rounded-full px-4 text-xs font-semibold ${
                  statusFilter === "inactive"
                    ? "border-rose-500 text-rose-500"
                    : "border-border text-muted-foreground"
                }`}
              >
                <span
                  className={`mr-2 h-1.5 w-1.5 rounded-full ${
                    statusFilter === "inactive" ? "bg-rose-500" : "bg-rose-500/50"
                  }`}
                />
                Inativos
              </Button>
            </div>

            <Button
              className="ml-2 h-10 rounded-lg bg-primary px-5 font-semibold hover:bg-primary/90"
              onClick={openNewNetwork}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Convênio
            </Button>
          </div>
        </div>

        {/* Master-detail */}
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[400px_1fr]">
          {/* Left: networks list */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                Redes
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {filteredNetworks.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : filteredNetworks.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <Network className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-base font-medium text-muted-foreground">
                    {search || statusFilter !== "all"
                      ? "Nenhum convênio para esses filtros"
                      : "Nenhum convênio cadastrado"}
                  </p>
                  {!search && statusFilter === "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 rounded-lg"
                      onClick={openNewNetwork}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar primeiro
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {filteredNetworks.map((n) => {
                    const isSelected = selectedNetwork?.id === n.id
                    const planCount = n.plans?.length ?? 0
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork(n)}
                          className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                              n.is_active
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-base font-bold text-foreground">
                                {n.name}
                              </span>
                              {!n.is_active && (
                                <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                                  Inativo
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {planCount === 0
                                ? "Sem planos"
                                : `${planCount} ${planCount === 1 ? "plano" : "planos"}`}
                            </div>
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isSelected ? "text-primary" : "text-muted-foreground/40"
                            }`}
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right: selected network detail + plans */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
            {!selectedNetwork ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-base font-medium text-muted-foreground">
                  Selecione um convênio para ver seus planos
                </p>
              </div>
            ) : (
              <>
                {/* Detail header */}
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        selectedNetwork.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">{selectedNetwork.name}</h2>
                        {!selectedNetwork.is_active && (
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {plans.length === 0
                          ? "Nenhum plano cadastrado"
                          : `${plans.length} ${plans.length === 1 ? "plano" : "planos"} no convênio`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-md border-border bg-transparent text-muted-foreground hover:text-foreground"
                      title={selectedNetwork.is_active ? "Desativar" : "Reativar"}
                      onClick={() => toggleNetworkActive(selectedNetwork)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-md border-border bg-transparent text-muted-foreground hover:text-foreground"
                      title="Editar"
                      onClick={() => openEditNetwork(selectedNetwork)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-md border-border bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Remover"
                      onClick={() => confirmDeleteNetwork(selectedNetwork)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Plans toolbar */}
                <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                    Planos do convênio
                  </div>
                  <Button
                    size="sm"
                    className="h-9 rounded-lg bg-primary px-4 font-semibold hover:bg-primary/90"
                    onClick={openNewPlan}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo plano
                  </Button>
                </div>

                {/* Plans table */}
                <div className="flex-1 overflow-auto">
                  {loadingPlans ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : plans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                      <Layers className="mb-4 h-12 w-12 text-muted-foreground/30" />
                      <p className="text-base font-medium text-muted-foreground">
                        Nenhum plano neste convênio
                      </p>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
                        Cadastre planos como Silver, Tp2 ou Básico III para vincular a matrículas e
                        validar o limite de sessões por semana.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 rounded-lg"
                        onClick={openNewPlan}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar primeiro plano
                      </Button>
                    </div>
                  ) : (
                    <Table className="text-sm">
                      <TableHeader className="sticky top-0 z-20 border-b bg-slate-50 shadow-sm dark:bg-slate-900">
                        <TableRow>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">
                            Plano
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">
                            Limite semanal
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">
                            Status
                          </TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/70">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.map((p) => (
                          <TableRow key={p.id} className="group">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-500 transition-transform group-hover:scale-105">
                                  <Sparkles className="h-4 w-4" />
                                </div>
                                <span className="text-base font-bold text-foreground">{p.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {p.max_sessions_per_week ? (
                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                  <CalendarDays className="h-4 w-4 text-muted-foreground/60" />
                                  <span>
                                    {p.max_sessions_per_week}{" "}
                                    <span className="text-xs font-normal text-muted-foreground">
                                      {p.max_sessions_per_week === 1 ? "sessão" : "sessões"}/sem
                                    </span>
                                  </span>
                                </div>
                              ) : (
                                <span className="italic text-muted-foreground/60">Sem limite</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={p.is_active}
                                  onCheckedChange={() => togglePlanActive(p)}
                                  aria-label="Ativar/desativar plano"
                                />
                                <span
                                  className={`text-xs font-semibold ${
                                    p.is_active ? "text-emerald-600" : "text-muted-foreground"
                                  }`}
                                >
                                  {p.is_active ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-md border-border bg-transparent text-muted-foreground hover:text-foreground"
                                  title="Editar"
                                  onClick={() => openEditPlan(p)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-md border-border bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  title="Remover"
                                  onClick={() => confirmDeletePlan(p)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Network dialog */}
      <Dialog open={networkDialogOpen} onOpenChange={setNetworkDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{editingNetwork ? "Editar convênio" : "Novo convênio"}</DialogTitle>
            <DialogDescription>
              Cadastre a rede (ex: Gympass, Total Pass, Namu Pass, Gogood). Os planos específicos
              são adicionados na tela seguinte.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={networkForm.handleSubmit(onSubmitNetwork)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="network-name">Nome da rede</Label>
              <Input id="network-name" {...networkForm.register("name")} placeholder="Ex: Gympass" />
              {networkForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {networkForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNetworkDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={networkSaving}>
                {networkSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Plan dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar plano" : "Novo plano"}</DialogTitle>
            <DialogDescription>
              Plano específico de <strong>{selectedNetwork?.name}</strong> (ex: Silver, Tp2, Básico
              III).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={planForm.handleSubmit(onSubmitPlan)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nome do plano</Label>
              <Input id="plan-name" {...planForm.register("name")} placeholder="Ex: Silver" />
              {planForm.formState.errors.name && (
                <p className="text-xs text-destructive">{planForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-max">
                Sessões por semana <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="plan-max"
                type="number"
                min={1}
                max={14}
                placeholder="Ex: 3"
                {...planForm.register("max_sessions_per_week")}
              />
              <p className="text-xs text-muted-foreground">
                Quando preenchido, matrículas neste plano não podem exceder esse total semanal.
                Deixe em branco para sem limite.
              </p>
              {planForm.formState.errors.max_sessions_per_week && (
                <p className="text-xs text-destructive">
                  {planForm.formState.errors.max_sessions_per_week.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPlanDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={planSaving}>
                {planSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteNetworkOpen}
        onOpenChange={setDeleteNetworkOpen}
        title="Remover convênio"
        description={`Tem certeza que deseja remover "${networkToDelete?.name}"? Os planos associados também serão removidos.`}
        confirmText="Remover"
        variant="destructive"
        onConfirm={handleDeleteNetwork}
      />

      <ConfirmDialog
        open={deletePlanOpen}
        onOpenChange={setDeletePlanOpen}
        title="Remover plano"
        description={`Tem certeza que deseja remover "${planToDelete?.name}"?`}
        confirmText="Remover"
        variant="destructive"
        onConfirm={handleDeletePlan}
      />
    </div>
  )
}
