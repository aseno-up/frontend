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
import { api } from '@/lib/api/client'
import { showToast, handleApiError } from '@/lib/toast'
import type { Patient, PatientRecord, SessionNote, FullPatientRecord } from '@/types/api'

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

  const [patient, setPatient] = useState<Patient | null>(null)
  const [record, setRecord] = useState<PatientRecord | null>(null)
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null)
  const [isSavingNote, setIsSavingNote] = useState(false)

  // Record form state
  const [recordForm, setRecordForm] = useState({
    chief_complaint: '',
    medical_history: '',
    family_history: '',
    allergies: '',
    medications: '',
    surgical_history: '',
    social_history: '',
    initial_diagnosis: '',
    treatment_plan: '',
    observations: '',
  })

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
      const [patientData, fullRecord] = await Promise.all([
        api.getPatient(patientId),
        api.getFullPatientRecord(patientId) as Promise<FullPatientRecord>,
      ])

      setPatient(patientData)
      setRecord(fullRecord.record)
      setSessionNotes(fullRecord.session_notes || [])

      // Initialize form with record data
      if (fullRecord.record) {
        setRecordForm({
          chief_complaint: fullRecord.record.chief_complaint || '',
          medical_history: fullRecord.record.medical_history || '',
          family_history: fullRecord.record.family_history || '',
          allergies: fullRecord.record.allergies || '',
          medications: fullRecord.record.medications || '',
          surgical_history: fullRecord.record.surgical_history || '',
          social_history: fullRecord.record.social_history || '',
          initial_diagnosis: fullRecord.record.initial_diagnosis || '',
          treatment_plan: fullRecord.record.treatment_plan || '',
          observations: fullRecord.record.observations || '',
        })
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
      await api.updatePatientRecord(patientId, recordForm)
      showToast.success('Ficha atualizada com sucesso!')
      fetchData()
    } catch (error) {
      handleApiError(error, 'Erro ao salvar ficha')
    } finally {
      setIsSaving(false)
    }
  }

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
                  <h2 className="text-xl font-semibold">{patient.name}</h2>
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
          </TabsList>

          {/* Clinical Record Tab */}
          <TabsContent value="record" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Anamnese e Historico</CardTitle>
                <CardDescription>
                  Informacoes clinicas do paciente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="chief_complaint">Queixa Principal</Label>
                    <Textarea
                      id="chief_complaint"
                      value={recordForm.chief_complaint}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, chief_complaint: e.target.value })
                      }
                      placeholder="Motivo da consulta..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initial_diagnosis">Diagnostico Inicial</Label>
                    <Textarea
                      id="initial_diagnosis"
                      value={recordForm.initial_diagnosis}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, initial_diagnosis: e.target.value })
                      }
                      placeholder="Hipotese diagnostica..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="medical_history">Historico Medico</Label>
                    <Textarea
                      id="medical_history"
                      value={recordForm.medical_history}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, medical_history: e.target.value })
                      }
                      placeholder="Doencas pregressas, internacoes..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family_history">Historico Familiar</Label>
                    <Textarea
                      id="family_history"
                      value={recordForm.family_history}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, family_history: e.target.value })
                      }
                      placeholder="Doencas na familia..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Alergias</Label>
                    <Textarea
                      id="allergies"
                      value={recordForm.allergies}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, allergies: e.target.value })
                      }
                      placeholder="Medicamentos, alimentos, substancias..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medications">Medicamentos em Uso</Label>
                    <Textarea
                      id="medications"
                      value={recordForm.medications}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, medications: e.target.value })
                      }
                      placeholder="Medicamentos atuais..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="surgical_history">Historico Cirurgico</Label>
                    <Textarea
                      id="surgical_history"
                      value={recordForm.surgical_history}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, surgical_history: e.target.value })
                      }
                      placeholder="Cirurgias realizadas..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_history">Historico Social</Label>
                    <Textarea
                      id="social_history"
                      value={recordForm.social_history}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, social_history: e.target.value })
                      }
                      placeholder="Tabagismo, etilismo, atividade fisica..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treatment_plan">Plano de Tratamento</Label>
                  <Textarea
                    id="treatment_plan"
                    value={recordForm.treatment_plan}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, treatment_plan: e.target.value })
                    }
                    placeholder="Plano terapeutico..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observacoes Gerais</Label>
                  <Textarea
                    id="observations"
                    value={recordForm.observations}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, observations: e.target.value })
                    }
                    placeholder="Outras informacoes relevantes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveRecord} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Ficha
                  </Button>
                </div>
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
