'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Search, AlertTriangle, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api/client'
import { showToast, handleApiError } from '@/lib/toast'
import type { UnlinkedPatient, PatientSearchResult } from '@/types/api'

function maskCPF(cpf: string): string {
  if (!cpf || cpf.length < 3) return '***.***.***-**'
  return '***.***.***-' + cpf.slice(-2)
}

type Step = 'select' | 'confirm'

interface PatientMergeModalProps {
  open: boolean
  onClose: () => void
  currentPatientId: string
  onMergeComplete: () => void
}

export function PatientMergeModal({
  open,
  onClose,
  currentPatientId,
  onMergeComplete,
}: PatientMergeModalProps) {
  const [step, setStep] = useState<Step>('select')
  const [provisionalPatients, setProvisionalPatients] = useState<UnlinkedPatient[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([])
  const [selectedTarget, setSelectedTarget] = useState<PatientSearchResult | null>(null)
  const [isLoadingProvisional, setIsLoadingProvisional] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchProvisionalPatients = useCallback(async () => {
    setIsLoadingProvisional(true)
    try {
      const patients = await api.getUnlinkedPatients()
      setProvisionalPatients(patients)
      // Pre-select the current patient if it's in the list
      const initialSet = new Set<string>()
      if (patients.some(p => p.id === currentPatientId)) {
        initialSet.add(currentPatientId)
      }
      setSelectedIds(initialSet)
    } catch (err) {
      handleApiError(err, 'Erro ao carregar pacientes provisorios')
    } finally {
      setIsLoadingProvisional(false)
    }
  }, [currentPatientId])

  useEffect(() => {
    if (open) {
      setStep('select')
      setSearchQuery('')
      setSearchResults([])
      setSelectedTarget(null)
      setError(null)
      fetchProvisionalPatients()
    }
  }, [open, fetchProvisionalPatients])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setSelectedTarget(null)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!value.trim()) {
      setSearchResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await api.searchPatientsForMerge(value)
        setSearchResults(results)
      } catch (err) {
        handleApiError(err, 'Erro ao buscar pacientes')
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleGoToConfirm = () => {
    setError(null)
    if (selectedIds.size === 0) {
      setError('Selecione pelo menos um paciente provisorio.')
      return
    }
    if (!selectedTarget) {
      setError('Selecione o paciente de destino.')
      return
    }
    setStep('confirm')
  }

  const handleMerge = async () => {
    if (!selectedTarget) return
    setIsMerging(true)
    setError(null)

    try {
      await api.mergePatientsBulk(
        Array.from(selectedIds),
        selectedTarget.id,
      )
      showToast.success('Paciente vinculado com sucesso.')
      onMergeComplete()
      onClose()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      const msg = axiosErr?.response?.data?.error?.message || 'Erro ao vincular pacientes.'
      setError(msg)
    } finally {
      setIsMerging(false)
    }
  }

  const totalSelected = selectedIds.size

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Vincular a paciente existente' : 'Confirmar vinculacao'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-6">
            {/* Provisional patients list */}
            <div>
              <h4 className="text-sm font-medium mb-2">Pacientes provisorios (portal publico)</h4>
              {isLoadingProvisional ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : provisionalPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nenhum paciente provisorio encontrado.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                  {provisionalPatients.map((patient) => (
                    <label
                      key={patient.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedIds.has(patient.id)}
                        onCheckedChange={() => toggleSelection(patient.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient.email && <span>{patient.email} &middot; </span>}
                          {patient.phone && <span>{patient.phone} &middot; </span>}
                          {format(new Date(patient.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Target patient search */}
            <div>
              <h4 className="text-sm font-medium mb-2">Paciente de destino</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {searchResults.length > 0 && !selectedTarget && (
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-md divide-y">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-muted/50"
                      onClick={() => setSelectedTarget(result)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{result.name}</p>
                        <p className="text-xs text-muted-foreground">
                          CPF: {maskCPF(result.cpf)}
                          {result.email && <span> &middot; {result.email}</span>}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedTarget && (
                <div className="mt-2 flex items-center gap-2 p-3 border rounded-md bg-green-50 dark:bg-green-950/20">
                  <Check className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedTarget.name}</p>
                    <p className="text-xs text-muted-foreground">
                      CPF: {maskCPF(selectedTarget.cpf)}
                      {selectedTarget.email && <span> &middot; {selectedTarget.email}</span>}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTarget(null)}
                  >
                    Alterar
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {step === 'confirm' && selectedTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {totalSelected} registro(s) provisorio(s) e seus agendamentos serao vinculados a{' '}
                  <strong>{selectedTarget.name}</strong>.
                </p>
                <p className="mt-1 text-amber-700 dark:text-amber-300">
                  Esta acao nao pode ser desfeita.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'select' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleGoToConfirm}>
                Continuar
              </Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => { setStep('select'); setError(null) }}>
                Voltar
              </Button>
              <Button onClick={handleMerge} disabled={isMerging}>
                {isMerging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar vinculacao
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
