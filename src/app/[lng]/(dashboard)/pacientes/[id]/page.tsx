'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Loader2,
  Save,
  UserX,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  History,
  Clock,
  ArrowUpDown,
} from 'lucide-react'

import { Header } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api/client'
import { showToast, handleApiError } from '@/lib/toast'
import { DynamicAnamneseForm } from '@/components/pacientes/DynamicAnamneseForm'
import { PatientMergeModal } from '@/components/pacientes/PatientMergeModal'
import { Switch } from '@/components/ui/switch'
import type { Patient, PatientRecord, SessionNote, FullPatientRecord, Appointment, NoShowRisk, AnamneseTemplate, PatientWhatsAppConnection } from '@/types/api'

// Helper function to get risk badge variant and label
const getRiskInfo = (risk: NoShowRisk) => {
  switch (risk) {
    case 'low':
      return { variant: 'success' as const, label: 'Confiavel', icon: CheckCircle2 }
    case 'medium':
      return { variant: 'warning' as const, label: 'Medio Risco', icon: AlertTriangle }
    case 'high':
      return { variant: 'destructive' as const, label: 'Alto Risco', icon: UserX }
    default:
      return { variant: 'secondary' as const, label: 'Sem dados', icon: User }
  }
}

// Schema de validacao para nota de sessao
const sessionNoteSchema = z.object({
  session_date: z.string().min(1, 'Data da sessao e obrigatoria'),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  notes: z.string().optional(),
  is_private: z.boolean(),
})

type SessionNoteFormData = z.infer<typeof sessionNoteSchema>

export default function PatientRecordPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  const lng = params.lng as string
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'owner' || user?.role === 'admin'

  const [patient, setPatient] = useState<Patient | null>(null)
  const [record, setRecord] = useState<PatientRecord | null>(null)
  const [recordHistory, setRecordHistory] = useState<PatientRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([])
  const [noShowAppointments, setNoShowAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [mergeModalOpen, setMergeModalOpen] = useState(false)
  const [whatsappConn, setWhatsappConn] = useState<PatientWhatsAppConnection | null>(null)
  const [isSavingWhatsappConn, setIsSavingWhatsappConn] = useState(false)

  // Dynamic Record state
  const [customFields, setCustomFields] = useState<Record<string, any>>({})
  const [template, setTemplate] = useState<AnamneseTemplate | null>(null)

  // Note form with validation
  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    formState: { errors: noteErrors },
    reset: resetNote,
    setValue: setNoteValue,
    watch: watchNote,
  } = useForm<SessionNoteFormData>({
    resolver: zodResolver(sessionNoteSchema),
    defaultValues: {
      session_date: format(new Date(), 'yyyy-MM-dd'),
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      notes: '',
      is_private: false,
    },
  })

  const isPrivate = watchNote('is_private')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [patientData, fullRecord, historyData, noShowsResponse] = await Promise.all([
        api.getPatient(patientId),
        api.getFullPatientRecord(patientId) as Promise<FullPatientRecord>,
        api.getPatientRecordHistory(patientId) as Promise<PatientRecord[]>,
        api.getAppointments({ patient_id: patientId, status: 'no_show' }),
      ])

      setPatient(patientData)

      // Fetch WhatsApp connection preferences
      try {
        const connData = await api.getPatientWhatsAppConnection(patientId)
        setWhatsappConn(connData)
      } catch {
        // No connection yet — use defaults
        setWhatsappConn({ patient_id: patientId, clinic_id: '', ai_scheduling_enabled: true, reminders_enabled: true })
      }

      setRecord(fullRecord.record)
      setRecordHistory(historyData || [])
      setSessionNotes(fullRecord.session_notes || [])
      setNoShowAppointments(noShowsResponse.data || [])

      // Initialize form with latest record data or template from fullRecord
      if (fullRecord.record) {
        setCustomFields(fullRecord.record.custom_fields || {})
        setTemplate(fullRecord.record.template || null)
        setSelectedRecordId(fullRecord.record.id)
      } else {
        // Handle case where there's no record but maybe a resolved template
        // fullRecord.record might be empty but could contain a template from backend ResolveTemplate
        const recordData = fullRecord.record as any
        if (recordData?.template) {
          setTemplate(recordData.template)
        }
      }
    } catch (error) {
      handleApiError(error, 'Erro ao carregar dados do paciente')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveRecord = async () => {
    setIsSaving(true)
    try {
      await api.updatePatientRecord(patientId, {
        template_id: template?.id,
        custom_fields: customFields,
      })
      showToast.success('Ficha atualizada com sucesso! (Nova versão criada)')
      fetchData()
    } catch (error) {
      handleApiError(error, 'Erro ao salvar ficha')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectHistoryRecord = (recordId: string) => {
    setSelectedRecordId(recordId)
    const selected = recordHistory.find(r => r.id === recordId)
    if (selected) {
      setCustomFields(selected.custom_fields || {})
      // Ideally we'd also load the template used in that version
      // Backend returns template object if it was saved
      if (selected.template) {
        setTemplate(selected.template)
      }
    }
  }

  const isHistoryMode = selectedRecordId !== (record?.id || null) && record !== null

  const handleOpenNoteDialog = (note?: SessionNote) => {
    if (note) {
      setEditingNote(note)
      resetNote({
        session_date: note.session_date.split('T')[0],
        subjective: note.subjective || '',
        objective: note.objective || '',
        assessment: note.assessment || '',
        plan: note.plan || '',
        notes: note.notes || '',
        is_private: note.is_private,
      })
    } else {
      setEditingNote(null)
      resetNote({
        session_date: format(new Date(), 'yyyy-MM-dd'),
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        notes: '',
        is_private: false,
      })
    }
    setNoteDialogOpen(true)
  }

  const onSubmitNote = async (data: SessionNoteFormData) => {
    setIsSavingNote(true)
    try {
      if (editingNote) {
        await api.updateSessionNote(patientId, editingNote.id, data)
        showToast.success('Evolucao atualizada com sucesso!')
      } else {
        await api.createSessionNote(patientId, {
          ...data,
          session_date: new Date(data.session_date).toISOString(),
        })
        showToast.success('Evolucao criada com sucesso!')
      }
      setNoteDialogOpen(false)
      fetchData()
    } catch (error) {
      handleApiError(error, 'Erro ao salvar evolucao')
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta evolucao?')) return

    try {
      await api.deleteSessionNote(patientId, noteId)
      showToast.success('Evolucao excluida com sucesso!')
      fetchData()
    } catch (error) {
      handleApiError(error, 'Erro ao excluir evolucao')
    }
  }

  const handleToggleWhatsappConnField = async (field: 'ai_scheduling_enabled' | 'reminders_enabled', enabled: boolean) => {
    if (!whatsappConn) return

    try {
      setIsSavingWhatsappConn(true)
      setWhatsappConn({ ...whatsappConn, [field]: enabled })
      const updated = await api.updatePatientWhatsAppConnection(patientId, { [field]: enabled })
      setWhatsappConn(updated)
      showToast.success(enabled ? 'Ativado com sucesso' : 'Desativado com sucesso')
    } catch (err) {
      setWhatsappConn({ ...whatsappConn, [field]: !enabled })
      handleApiError(err)
    } finally {
      setIsSavingWhatsappConn(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <Header lng={lng} title="Carregando..." />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex h-full flex-col">
        <Header lng={lng} title="Paciente nao encontrado" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Paciente nao encontrado</p>
          <Button onClick={() => router.push(`/${lng}/pacientes`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pacientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title={`Ficha: ${patient.name}`} />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Back button and patient info */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push(`/${lng}/pacientes`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{patient.name}</h2>
                    {(() => {
                      const riskInfo = getRiskInfo(patient.no_show_risk)
                      const RiskIcon = riskInfo.icon
                      return (
                        <Badge variant={riskInfo.variant} className="gap-1">
                          <RiskIcon className="h-3 w-3" />
                          {riskInfo.label}
                        </Badge>
                      )
                    })()}
                    {patient.attendance_rate > 0 && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {patient.attendance_rate.toFixed(0)}% comparecimento
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {patient.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {patient.email}
                      </span>
                    )}
                    {(patient.phone || patient.whatsapp) && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.whatsapp || patient.phone}
                      </span>
                    )}
                    {patient.birth_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(patient.birth_date), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provisional patient banner */}
        {patient.source === 'SELF_REGISTERED' && !patient.merged_into_patient_id && (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Paciente criado via portal publico &mdash; cadastro pendente de verificacao.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900"
              onClick={() => setMergeModalOpen(true)}
            >
              Vincular a paciente existente
            </Button>
          </div>
        )}

        <PatientMergeModal
          open={mergeModalOpen}
          onClose={() => setMergeModalOpen(false)}
          currentPatientId={patientId}
          onMergeComplete={() => fetchData()}
        />

        {/* WhatsApp Connection Settings */}
        {whatsappConn && (patient.whatsapp || patient.phone) && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp
              </CardTitle>
              <CardDescription>Configuracoes de notificacao e IA para este paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enviar lembretes de consulta</p>
                  <p className="text-xs text-muted-foreground">Lembretes automaticos antes da consulta</p>
                </div>
                <Switch
                  checked={whatsappConn.reminders_enabled}
                  onCheckedChange={(enabled) => handleToggleWhatsappConnField('reminders_enabled', enabled)}
                  disabled={isSavingWhatsappConn}
                />
              </div>
              {(() => {
                const takeoverUntil = whatsappConn.human_takeover_until
                  ? new Date(whatsappConn.human_takeover_until)
                  : null
                const isTakeoverActive = !!takeoverUntil && takeoverUntil.getTime() > Date.now()
                return (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Permitir agendamento por IA</p>
                      <p className="text-xs text-muted-foreground">A IA pode agendar consultas para este paciente</p>
                      {isTakeoverActive && takeoverUntil && (
                        <Badge variant="secondary" className="mt-1 gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200">
                          <Clock className="h-3 w-3" />
                          IA pausada até {format(takeoverUntil, 'HH:mm', { locale: ptBR })}
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={whatsappConn.ai_scheduling_enabled && !isTakeoverActive}
                      onCheckedChange={(enabled) => handleToggleWhatsappConnField('ai_scheduling_enabled', enabled)}
                      disabled={isSavingWhatsappConn}
                    />
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Tabs for Record and Session Notes */}
        <Tabs defaultValue="record" className="space-y-4">
          <TabsList>
            <TabsTrigger value="record" className="gap-2">
              <FileText className="h-4 w-4" />
              Ficha Clinica
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <Calendar className="h-4 w-4" />
              Evolucoes ({sessionNotes.length})
            </TabsTrigger>
            <TabsTrigger value="faltas" className="gap-2">
              <UserX className="h-4 w-4" />
              Faltas ({patient.no_show_count})
            </TabsTrigger>
          </TabsList>

          {/* Clinical Record Tab */}
          <TabsContent value="record" className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-medium">Anamnese e Historico</h3>
                <p className="text-sm text-muted-foreground">
                  Informacoes clinicas do paciente
                </p>
              </div>

              {recordHistory.length > 0 && (
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedRecordId || ''}
                    onValueChange={handleSelectHistoryRecord}
                  >
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Ver historico..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recordHistory.map((r, index) => (
                        <SelectItem key={r.id} value={r.id}>
                          <div className="flex flex-col items-start">
                            <span>
                              {index === 0 ? 'Versao Atual' : `Versao ${recordHistory.length - index}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(r.recorded_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {isHistoryMode && (
              <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-900/30 dark:bg-yellow-900/20 dark:text-yellow-500">
                <Clock className="h-5 w-5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">Modo de Visualizacao de Historico</p>
                  <p>Voce esta visualizando uma versao antiga desta ficha. Edicoes estao desabilitadas.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-yellow-300 hover:bg-yellow-100 dark:border-yellow-800 dark:hover:bg-yellow-900/40"
                  onClick={() => record && handleSelectHistoryRecord(record.id)}
                >
                  Voltar para Atual
                </Button>
              </div>
            )}

            <Card>
              <CardContent className="pt-6">
                {template ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg">{template.name}</span>
                      </div>
                      {recordHistory.find(r => r.id === selectedRecordId)?.recorded_by && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Registrado por: {recordHistory.find(r => r.id === selectedRecordId)?.recorded_by}
                        </span>
                      )}
                    </div>

                    <DynamicAnamneseForm
                      template={template}
                      values={customFields}
                      onChange={setCustomFields}
                      readOnly={isHistoryMode}
                    />

                    {!isHistoryMode && (
                      <div className="flex justify-end pt-6 border-t">
                        <Button onClick={handleSaveRecord} disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Salvar Alteracoes
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">
                      Nenhum modelo de anamnese configurado para esta clinica ou especialidade.
                    </p>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push(`/${lng}/configuracoes/anamnese`)}
                      >
                        Configurar Modelos
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Session Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Evolucoes</h3>
                <p className="text-sm text-muted-foreground">
                  Historico de atendimentos no formato SOAP
                </p>
              </div>
              <Button onClick={() => handleOpenNoteDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Evolucao
              </Button>
            </div>

            {sessionNotes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    Nenhuma evolucao registrada ainda
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleOpenNoteDialog()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira evolucao
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sessionNotes.map((note) => (
                  <Card key={note.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {format(new Date(note.session_date), "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                            {note.is_private && (
                              <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Privado
                              </Badge>
                            )}
                          </CardTitle>
                          {note.professional_name && (
                            <CardDescription>Por: {note.professional_name}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenNoteDialog(note)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {note.subjective && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            S - Subjetivo
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{note.subjective}</p>
                        </div>
                      )}
                      {note.objective && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            O - Objetivo
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{note.objective}</p>
                        </div>
                      )}
                      {note.assessment && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            A - Avaliacao
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{note.assessment}</p>
                        </div>
                      )}
                      {note.plan && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            P - Plano
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{note.plan}</p>
                        </div>
                      )}
                      {note.notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Observacoes
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{note.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* No-Show History Tab */}
          <TabsContent value="faltas" className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Faltas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {patient.no_show_count}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Agendamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {patient.total_appointments}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Comparecimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${
                      patient.attendance_rate >= 80 ? 'text-green-600' :
                      patient.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {patient.attendance_rate.toFixed(0)}%
                    </span>
                    <span className="text-sm text-muted-foreground">de presenca</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* No-Show Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-500" />
                  Historico de Faltas
                </CardTitle>
                <CardDescription>
                  Consultas em que o paciente nao compareceu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {noShowAppointments.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500/50" />
                    <p className="mt-4 text-muted-foreground">
                      Nenhuma falta registrada
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Este paciente tem um otimo historico de comparecimento!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {noShowAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-red-50/50 dark:bg-red-950/20"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                          <Calendar className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {format(new Date(appointment.start_time), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                            <Badge variant="destructive" className="text-xs">
                              Nao compareceu
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                          </p>
                          {appointment.professional?.name && (
                            <p className="text-sm text-muted-foreground">
                              Profissional: {appointment.professional.name}
                            </p>
                          )}
                          {appointment.title && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {appointment.title}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Session Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Editar Evolucao' : 'Nova Evolucao'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitNote(onSubmitNote)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="session_date">
                  Data da Sessao <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="session_date"
                  type="date"
                  {...registerNote('session_date')}
                  className={noteErrors.session_date ? 'border-destructive' : ''}
                />
                {noteErrors.session_date && (
                  <p className="text-sm text-destructive">{noteErrors.session_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjective">S - Subjetivo</Label>
                <Textarea
                  id="subjective"
                  {...registerNote('subjective')}
                  placeholder="Queixa do paciente, relatos, sintomas..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">O - Objetivo</Label>
                <Textarea
                  id="objective"
                  {...registerNote('objective')}
                  placeholder="Exame fisico, observacoes clinicas..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment">A - Avaliacao</Label>
                <Textarea
                  id="assessment"
                  {...registerNote('assessment')}
                  placeholder="Analise, hipotese diagnostica..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">P - Plano</Label>
                <Textarea
                  id="plan"
                  {...registerNote('plan')}
                  placeholder="Conduta, encaminhamentos, proximos passos..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observacoes Adicionais</Label>
                <Textarea
                  id="notes"
                  {...registerNote('notes')}
                  placeholder="Outras informacoes relevantes..."
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_private"
                  checked={isPrivate}
                  onCheckedChange={(checked) =>
                    setNoteValue('is_private', checked as boolean)
                  }
                />
                <Label
                  htmlFor="is_private"
                  className="text-sm font-normal cursor-pointer"
                >
                  Evolucao privada (visivel apenas para voce)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNoteDialogOpen(false)}
                disabled={isSavingNote}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingNote}>
                {isSavingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
