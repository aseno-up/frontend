"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Link2, Loader2, Phone, Mail, Clock, ArrowLeft, Check } from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { UnlinkedPatient, PatientSearchResult } from "@/types/api"

function getInitials(name: string) {
  return name.split(" ").filter((n) => n.length > 0).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = ["bg-purple-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-indigo-500", "bg-cyan-500", "bg-pink-500", "bg-teal-500"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

interface AutoCadastroPageProps {
  params: Promise<{ lng: string }>
}

export default function AutoCadastroPage({ params }: AutoCadastroPageProps) {
  const router = useRouter()
  const [lng, setLng] = useState("pt-BR")
  useEffect(() => { params.then((p) => setLng(p.lng)) }, [params])

  const [patients, setPatients] = useState<UnlinkedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterText, setFilterText] = useState("")

  // Merge modal
  const [mergeOpen, setMergeOpen] = useState(false)
  const [targetSearch, setTargetSearch] = useState("")
  const [targetResults, setTargetResults] = useState<PatientSearchResult[]>([])
  const [selectedTarget, setSelectedTarget] = useState<PatientSearchResult | null>(null)
  const [merging, setMerging] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [mergeError, setMergeError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getUnlinkedPatients()
      setPatients(res)
      setSelectedIds(new Set())
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  const filteredPatients = useMemo(() => {
    if (!filterText.trim()) return patients
    const q = filterText.toLowerCase()
    return patients.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.cpf && p.cpf.includes(q))
    )
  }, [patients, filterText])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filteredPatients.map((p) => p.id)))
    else setSelectedIds(new Set())
  }

  function openMergeModal() {
    setTargetSearch("")
    setTargetResults([])
    setSelectedTarget(null)
    setMergeError(null)
    setMergeOpen(true)
  }

  const handleTargetSearchChange = useCallback((value: string) => {
    setTargetSearch(value)
    setSelectedTarget(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setTargetResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await api.searchPatientsForMerge(value)
        setTargetResults(results)
      } catch (err) {
        handleApiError(err, "Erro ao buscar pacientes")
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  async function handleMerge() {
    if (!selectedTarget || selectedIds.size === 0) return
    // If the target is one of the selected provisionals, remove it from the list
    // (it becomes the destination, not a source to be merged)
    const provisionalToMerge = Array.from(selectedIds).filter((id) => id !== selectedTarget.id)
    if (provisionalToMerge.length === 0) {
      setMergeError("Selecione pelo menos um paciente diferente do destino.")
      return
    }
    try {
      setMerging(true)
      setMergeError(null)
      await api.mergePatientsBulk(provisionalToMerge, selectedTarget.id)
      showToast.success("Paciente vinculado com sucesso.")
      setMergeOpen(false)
      fetchPatients()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      setMergeError(axiosErr?.response?.data?.error?.message || "Erro ao vincular pacientes.")
    } finally {
      setMerging(false)
    }
  }

  const allFilteredSelected = filteredPatients.length > 0 && filteredPatients.every((p) => selectedIds.has(p.id))

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Pendentes do Portal" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/${lng}/pacientes`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <span className="text-sm text-muted-foreground">
            {patients.length} paciente(s) pendente(s) de verificacao
          </span>
        </div>

        {/* Filter toolbar */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome, telefone, email ou CPF..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-10 h-10 border-none shadow-none bg-muted/50 rounded-lg focus-visible:ring-1"
            />
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button size="sm" className="font-semibold animate-in fade-in" onClick={openMergeModal}>
                <Link2 className="mr-2 h-4 w-4" />
                Vincular {selectedIds.size} selecionado(s)
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              {filterText ? "Nenhum paciente encontrado para esse filtro" : "Nenhum paciente auto-cadastrado pendente"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col flex-1">
            <Table className="text-sm" wrapperClassName="flex-1 overflow-auto">
              <TableHeader className="sticky top-0 bg-slate-50 z-20 shadow-sm dark:bg-slate-900 border-b">
                <TableRow>
                  <TableHead className="w-[40px] px-4">
                    <Checkbox checked={allFilteredSelected} onCheckedChange={handleSelectAll} aria-label="Selecionar todos" />
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70 w-[350px]">PACIENTE</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">CONTATO</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">CPF</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">CADASTRO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const isSelected = selectedIds.has(patient.id)
                  return (
                    <TableRow key={patient.id} className="group" data-state={isSelected ? "selected" : undefined}>
                      <TableCell className="px-4">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(patient.id)} aria-label={`Selecionar ${patient.name}`} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 shrink-0 text-white font-bold rounded-full text-xs shadow-sm ${getAvatarColor(patient.name)}`}>
                            {getInitials(patient.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate">{patient.name}</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
                              {patient.email ? (
                                <><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{patient.email}</span></>
                              ) : (
                                <span className="text-amber-600/70 dark:text-amber-500/70 flex items-center gap-1"><Clock className="w-3 h-3" /> Sem email</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.phone ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                            <Phone className="h-4 w-4 shrink-0 text-muted-foreground/50" /><span>{patient.phone}</span>
                          </div>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {patient.cpf ? <span className="text-muted-foreground font-medium">{patient.cpf}</span> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-xs">{formatDate(patient.created_at)}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Merge Modal */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Vincular a paciente existente</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente por nome, telefone, email ou CPF..."
                className="pl-9"
                value={targetSearch}
                onChange={(e) => handleTargetSearchChange(e.target.value)}
                autoFocus
              />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto border rounded-lg">
              {!targetSearch.trim() ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">Digite para buscar um paciente</p>
                </div>
              ) : isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : targetResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum paciente encontrado</p>
                </div>
              ) : (
                <Table className="text-sm">
                  <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">PACIENTE</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">CONTATO</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">DOCUMENTO</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">CADASTRO</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targetResults.map((p) => {
                      const isComplete = p.email && p.phone && p.cpf
                      const isTarget = selectedTarget?.id === p.id
                      return (
                        <TableRow
                          key={p.id}
                          className={isTarget ? "bg-primary/5" : "cursor-pointer hover:bg-muted/50"}
                          onClick={() => setSelectedTarget(isTarget ? null : p)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-8 h-8 shrink-0 text-white font-bold rounded-full text-xs shadow-sm ${getAvatarColor(p.name)}`}>
                                {getInitials(p.name)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-foreground truncate text-sm">{p.name}</span>
                                {p.email && (
                                  <span className="text-xs text-muted-foreground truncate">{p.email}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {p.phone ? (
                              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                                <span>{p.phone}</span>
                              </div>
                            ) : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {p.cpf ? (
                              <span className="text-muted-foreground font-medium text-sm">{p.cpf}</span>
                            ) : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {p.source === "SELF_REGISTERED" ? (
                              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-bold w-fit border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                Portal
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold w-fit border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Interno
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {isTarget && <Check className="h-5 w-5 text-primary" />}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {mergeError && <p className="text-sm text-destructive">{mergeError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>Cancelar</Button>
            <Button onClick={handleMerge} disabled={!selectedTarget || merging}>
              {merging ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Vinculando...</>
              ) : (
                selectedTarget
                  ? `Vincular a ${selectedTarget.name}`
                  : "Selecione um paciente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
