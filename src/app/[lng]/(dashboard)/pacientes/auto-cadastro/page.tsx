"use client"

import { useCallback, useEffect, useState } from "react"
import { Search, Users, Link2, Loader2 } from "lucide-react"

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
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { Patient, PaginatedResponse } from "@/types/api"

interface SelfRegisteredPatient {
  id: string
  name: string
  email: string
  phone: string
  whatsapp: string
  source: string
  created_at: string
}

interface AutoCadastroPageProps {
  params: Promise<{ lng: string }>
}

export default function AutoCadastroPage({ params }: AutoCadastroPageProps) {
  const [lng, setLng] = useState("pt-BR")

  // Resolve params
  useEffect(() => {
    params.then((p) => setLng(p.lng))
  }, [params])
  const [patients, setPatients] = useState<SelfRegisteredPatient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  // Merge modal
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeSource, setMergeSource] = useState<SelfRegisteredPatient | null>(null)
  const [existingPatients, setExistingPatients] = useState<Patient[]>([])
  const [searchExisting, setSearchExisting] = useState("")
  const [selectedTarget, setSelectedTarget] = useState<Patient | null>(null)
  const [merging, setMerging] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
      })
      if (search) params.set("search", search)

      const res = await api.getSelfRegisteredPatients({
        page,
        limit: perPage,
        search: search || undefined,
      })
      setPatients(res.data || [])
      setTotal(res.meta?.total || 0)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  async function searchExistingPatients(query: string) {
    if (query.length < 2) {
      setExistingPatients([])
      return
    }
    try {
      setLoadingExisting(true)
      const res = await api.getPatients({ search: query, limit: 10 })
      // Filter out the source patient and self-registered patients
      const filtered = (res.data || []).filter(
        (p: Patient) => p.id !== mergeSource?.id && (p as unknown as SelfRegisteredPatient).source !== "SELF_REGISTERED"
      )
      setExistingPatients(filtered)
    } catch {
      setExistingPatients([])
    } finally {
      setLoadingExisting(false)
    }
  }

  async function handleMerge() {
    if (!selectedTarget || !mergeSource) return
    try {
      setMerging(true)
      await api.mergePatients(selectedTarget.id, mergeSource.id)
      showToast.success("Pacientes mesclados com sucesso")
      setMergeOpen(false)
      setMergeSource(null)
      setSelectedTarget(null)
      fetchPatients()
    } catch (err) {
      handleApiError(err)
    } finally {
      setMerging(false)
    }
  }

  function openMergeModal(patient: SelfRegisteredPatient) {
    setMergeSource(patient)
    setSearchExisting("")
    setExistingPatients([])
    setSelectedTarget(null)
    setMergeOpen(true)
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <Header lng={lng} title="Pacientes Auto-cadastrados" />

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Data de cadastro</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhum paciente auto-cadastrado encontrado
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.email || "-"}</TableCell>
                  <TableCell>{formatDate(patient.created_at)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMergeModal(patient)}
                    >
                      <Link2 className="h-3.5 w-3.5 mr-1" />
                      Vincular
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > perPage && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-muted-foreground">
            {total} pacientes encontrados
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / perPage)}
              onClick={() => setPage(page + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular paciente</DialogTitle>
          </DialogHeader>

          {mergeSource && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Paciente auto-cadastrado:</p>
                <p className="font-medium">{mergeSource.name}</p>
                <p className="text-sm text-muted-foreground">
                  {mergeSource.phone} {mergeSource.email && `· ${mergeSource.email}`}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Buscar paciente existente para vincular:</p>
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchExisting}
                  onChange={(e) => {
                    setSearchExisting(e.target.value)
                    searchExistingPatients(e.target.value)
                  }}
                />
              </div>

              {loadingExisting && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {existingPatients.length > 0 && (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {existingPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedTarget(p)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer border ${
                        selectedTarget?.id === p.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground ml-2">{p.phone}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedTarget && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-amber-800 mb-1">O que vai acontecer:</p>
                  <ul className="text-amber-700 text-xs space-y-0.5 list-disc list-inside">
                    <li>Agendamentos de <strong>{mergeSource.name}</strong> serão transferidos para <strong>{selectedTarget.name}</strong></li>
                    <li>Dados de contato faltantes serão copiados</li>
                    <li>O cadastro auto-gerado será desativado</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!selectedTarget || merging}
            >
              {merging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Vinculando...
                </>
              ) : (
                "Confirmar vinculação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
