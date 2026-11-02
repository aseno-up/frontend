'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Percent, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api/client'
import { handleApiError, showToast } from '@/lib/toast'
import type { Professional, ProfessionalProcedure, Procedure } from '@/types/api'

interface CommissionRow {
  procedure_id: string
  procedure_name: string
  procedure_price: number
  commission_type: 'percentage' | 'fixed'
  commission_value: number
  enabled: boolean
}

export function CommissionTab() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('')
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [rows, setRows] = useState<CommissionRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(false)

  // Load professionals and procedures on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [profRes, procRes] = await Promise.all([
          api.getProfessionals({ page: 1, limit: 100, status: 'active' }),
          api.getProcedures({ page: 1, limit: 100 }),
        ])
        setProfessionals(profRes.data || [])
        setProcedures((procRes.data || []) as Procedure[])
      } catch (error) {
        handleApiError(error, 'Erro ao carregar dados')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Load commissions when professional changes
  const loadCommissions = useCallback(async (professionalId: string) => {
    if (!professionalId || procedures.length === 0) return

    setIsLoadingCommissions(true)
    try {
      const commissions: ProfessionalProcedure[] = await api.getProfessionalProcedures(professionalId)

      const commissionMap = new Map<string, ProfessionalProcedure>()
      for (const c of commissions) {
        commissionMap.set(c.procedure_id, c)
      }

      const newRows: CommissionRow[] = procedures.map((proc) => {
        const existing = commissionMap.get(proc.id)
        return {
          procedure_id: proc.id,
          procedure_name: proc.name,
          procedure_price: proc.price,
          commission_type: existing?.commission_type || 'percentage',
          commission_value: existing?.commission_value ?? 100,
          enabled: !!existing,
        }
      })

      setRows(newRows)
    } catch (error) {
      handleApiError(error, 'Erro ao carregar repasses')
    } finally {
      setIsLoadingCommissions(false)
    }
  }, [procedures])

  useEffect(() => {
    if (selectedProfessionalId) {
      loadCommissions(selectedProfessionalId)
    } else {
      setRows([])
    }
  }, [selectedProfessionalId, loadCommissions])

  const handleTypeChange = (index: number, type: 'percentage' | 'fixed') => {
    setRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], commission_type: type, enabled: true }
      if (type === 'percentage' && updated[index].commission_value > 100) {
        updated[index].commission_value = 100
      }
      return updated
    })
  }

  const handleValueChange = (index: number, value: string) => {
    const num = parseFloat(value) || 0
    setRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], commission_value: num, enabled: true }
      return updated
    })
  }

  const handleToggle = (index: number) => {
    setRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], enabled: !updated[index].enabled }
      return updated
    })
  }

  const calculateCommission = (row: CommissionRow): number => {
    if (!row.enabled) return 0
    if (row.commission_type === 'percentage') {
      return (row.procedure_price * row.commission_value) / 100
    }
    return row.commission_value
  }

  const handleSave = async () => {
    if (!selectedProfessionalId) return

    const enabledRows = rows.filter(r => r.enabled)
    if (enabledRows.length === 0) {
      showToast.error('Selecione pelo menos um procedimento.')
      return
    }

    const invalidFixed = enabledRows.find(r => r.commission_type === 'fixed' && r.commission_value > r.procedure_price)
    if (invalidFixed) {
      showToast.error(`Valor fixo de repasse (R$ ${invalidFixed.commission_value.toFixed(2)}) nao pode ser maior que o preco do procedimento "${invalidFixed.procedure_name}" (R$ ${invalidFixed.procedure_price.toFixed(2)}).`)
      return
    }

    setIsSaving(true)
    try {
      await api.updateProfessionalProcedures(selectedProfessionalId, {
        items: enabledRows.map(r => ({
          procedure_id: r.procedure_id,
          commission_type: r.commission_type,
          commission_value: r.commission_value,
        })),
      })
      showToast.success('Repasses salvos com sucesso!')
      loadCommissions(selectedProfessionalId)
    } catch (error) {
      handleApiError(error, 'Erro ao salvar repasses')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Repasse por Profissional</CardTitle>
          <CardDescription>
            Configure quanto cada profissional recebe por procedimento realizado.
            O repasse pode ser um percentual do valor ou um valor fixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedProfessionalId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Procedimentos e Repasses</CardTitle>
              <CardDescription>
                Marque os procedimentos que o profissional atende e defina o repasse.
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingCommissions ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                Nenhum procedimento cadastrado. Cadastre procedimentos primeiro.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead className="w-[120px] text-right">Valor</TableHead>
                      <TableHead className="w-[140px]">Tipo Repasse</TableHead>
                      <TableHead className="w-[120px]">Valor Repasse</TableHead>
                      <TableHead className="w-[120px] text-right">Repasse (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => {
                      const commission = calculateCommission(row)
                      return (
                        <TableRow key={row.procedure_id} className={!row.enabled ? 'opacity-50' : ''}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={() => handleToggle(index)}
                              className="h-4 w-4 rounded border-input"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{row.procedure_name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              R$ {row.procedure_price.toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.commission_type}
                              onValueChange={(v) => handleTypeChange(index, v as 'percentage' | 'fixed')}
                              disabled={!row.enabled}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">
                                  <div className="flex items-center gap-1.5">
                                    <Percent className="h-3 w-3" />
                                    Percentual
                                  </div>
                                </SelectItem>
                                <SelectItem value="fixed">
                                  <div className="flex items-center gap-1.5">
                                    <DollarSign className="h-3 w-3" />
                                    Valor Fixo
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={row.commission_type === 'percentage' ? 100 : row.procedure_price}
                                step={row.commission_type === 'percentage' ? 1 : 0.01}
                                value={row.commission_value}
                                onChange={(e) => handleValueChange(index, e.target.value)}
                                disabled={!row.enabled}
                                className="h-8 w-20"
                              />
                              <span className="text-xs text-muted-foreground">
                                {row.commission_type === 'percentage' ? '%' : 'R$'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.enabled ? (
                              <span className="text-emerald-600">
                                R$ {commission.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
