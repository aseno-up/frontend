'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Settings2,
  FileText,
  Save,
  Loader2,
  ArrowUp,
  ArrowDown,
  Layout,
  Tag,
} from 'lucide-react'

import { Header } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api/client'
import { handleApiError, showToast } from '@/lib/toast'
import type { AnamneseTemplate, AnamneseTemplateField } from '@/types/api'

export default function AnamneseSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const lng = params.lng as string
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'owner' || user?.role === 'admin'

  const [templates, setTemplates] = useState<AnamneseTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [editingTemplate, setEditingNote] = useState<AnamneseTemplate | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')

  const [selectedTemplate, setSelectedTemplate] = useState<AnamneseTemplate | null>(null)
  const [isSavingFields, setIsSavingFields] = useState(false)

  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<Partial<AnamneseTemplateField> | null>(null)
  const [optionsText, setOptionsText] = useState('')

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push(`/${lng}/configuracoes`)
    }
  }, [isLoading, isAdmin, router, lng])

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.getAnamneseTemplates()
      setTemplates(data || [])
      if (data && data.length > 0 && !selectedTemplate) {
        // Load the first one by default if none selected
        const fullTemplate = await api.getAnamneseTemplate(data[0].id)
        setSelectedTemplate(fullTemplate)
      }
    } catch (error) {
      handleApiError(error, 'Erro ao carregar modelos')
    } finally {
      setIsLoading(false)
    }
  }, [selectedTemplate])

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleSelectTemplate = async (template: AnamneseTemplate) => {
    try {
      const fullTemplate = await api.getAnamneseTemplate(template.id)
      setSelectedTemplate(fullTemplate)
    } catch (error) {
      handleApiError(error, 'Erro ao carregar detalhes do modelo')
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return
    setIsSaving(true)
    try {
      const res = await api.createAnamneseTemplate({ name: newTemplateName })
      showToast.success('Modelo criado com sucesso!')
      setNewTemplateName('')
      setTemplateDialogOpen(false)
      loadTemplates()
      setSelectedTemplate(res)
    } catch (error) {
      handleApiError(error, 'Erro ao criar modelo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return
    try {
      await api.deleteAnamneseTemplate(id)
      showToast.success('Modelo excluído!')
      if (selectedTemplate?.id === id) setSelectedTemplate(null)
      loadTemplates()
    } catch (error) {
      handleApiError(error, 'Erro ao excluir modelo')
    }
  }

  const handleOpenFieldDialog = (field?: AnamneseTemplateField) => {
    if (field) {
      setEditingField(field)
      setOptionsText(Array.isArray(field.options) ? (field.options as string[]).join(', ') : '')
    } else {
      setEditingField({
        label: '',
        field_key: '',
        field_type: 'text',
        required: false,
        display_order: selectedTemplate?.fields?.length || 0,
        placeholder: '',
        options: [] as any
      })
      setOptionsText('')
    }
    setFieldDialogOpen(true)
  }

  const handleSaveField = async () => {
    if (!selectedTemplate || !editingField) return
    if (!editingField.label || !editingField.field_key) {
      showToast.error('Nome do campo é obrigatório')
      return
    }

    const fieldToSave = { ...editingField }
    if (fieldToSave.field_type === 'select' || fieldToSave.field_type === 'multiselect') {
      fieldToSave.options = optionsText.split(',').map(s => s.trim()).filter(s => !!s) as any
    }

    setIsSavingFields(true)
    try {
      if (fieldToSave.id) {
        await api.updateAnamneseTemplateField(selectedTemplate.id, fieldToSave.id, fieldToSave)
      } else {
        await api.createAnamneseTemplateField(selectedTemplate.id, fieldToSave)
      }
      showToast.success('Campo salvo!')
      setFieldDialogOpen(false)
      // Reload current template
      const fullTemplate = await api.getAnamneseTemplate(selectedTemplate.id)
      setSelectedTemplate(fullTemplate)
    } catch (error) {
      handleApiError(error, 'Erro ao salvar campo')
    } finally {
      setIsSavingFields(false)
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!selectedTemplate || !confirm('Excluir este campo?')) return
    try {
      await api.deleteAnamneseTemplateField(selectedTemplate.id, fieldId)
      const fullTemplate = await api.getAnamneseTemplate(selectedTemplate.id)
      setSelectedTemplate(fullTemplate)
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    if (!selectedTemplate || !selectedTemplate.fields) return
    const newFields = [...selectedTemplate.fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newFields.length) return

    // Swap
    const temp = newFields[index]
    newFields[index] = newFields[targetIndex]
    newFields[targetIndex] = temp

    try {
      await api.reorderAnamneseTemplateFields(selectedTemplate.id, newFields.map(f => f.id))
      setSelectedTemplate({ ...selectedTemplate, fields: newFields })
    } catch (error) {
      handleApiError(error)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Modelos de Anamnese" />

      <div className="flex-1 overflow-auto p-4 md:p-6 bg-muted/10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push(`/${lng}/configuracoes`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Configuracoes
            </Button>
            <Button onClick={() => setTemplateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Modelo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar: Template List */}
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Meus Modelos</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-1">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">Nenhum modelo criado</p>
                  ) : (
                    templates.map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          selectedTemplate?.id === t.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleSelectTemplate(t)}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="text-sm truncate font-medium">{t.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`h-6 w-6 ${selectedTemplate?.id === t.id ? 'hover:bg-primary-foreground/10 text-primary-foreground' : 'text-muted-foreground hover:text-destructive'}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(t.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content: Field Editor */}
            <div className="md:col-span-3">
              {selectedTemplate ? (
                <Card className="border-primary/20 shadow-sm">
                  <CardHeader className="border-b bg-muted/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Layout className="h-5 w-5 text-primary" />
                          {selectedTemplate.name}
                        </CardTitle>
                        <CardDescription>Configure os campos e a ordem de exibicao</CardDescription>
                      </div>
                      <Button size="sm" onClick={() => handleOpenFieldDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Campo
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {!selectedTemplate.fields || selectedTemplate.fields.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-muted-foreground text-sm">Este modelo nao possui campos ainda.</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => handleOpenFieldDialog()}
                          >
                            Criar primeiro campo
                          </Button>
                        </div>
                      ) : (
                        selectedTemplate.fields
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((field, index) => (
                            <div key={field.id} className="flex items-center p-4 hover:bg-muted/30 group transition-colors">
                              <div className="flex flex-col gap-1 mr-4">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  disabled={index === 0}
                                  onClick={() => handleMoveField(index, 'up')}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  disabled={index === (selectedTemplate.fields?.length || 0) - 1}
                                  onClick={() => handleMoveField(index, 'down')}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">{field.label}</span>
                                  {field.required && <Badge variant="outline" className="text-[10px] h-4 py-0">Obrigatorio</Badge>}
                                  <Badge variant="secondary" className="text-[10px] h-4 py-0 uppercase">{field.field_type}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Tag className="h-3 w-3" />
                                  <code className="bg-muted px-1 rounded">{field.field_key}</code>
                                  {field.placeholder && <span>&middot; Placeholder: {field.placeholder}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenFieldDialog(field)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteField(field.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex flex-col items-center justify-center py-24 border-dashed">
                  <Settings2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Selecione ou crie um modelo de anamnese para comecar</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Modelo de Anamnese</DialogTitle>
            <DialogDescription>Dê um nome ao seu novo modelo de ficha clinica.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Modelo</Label>
              <Input 
                id="name" 
                placeholder="Ex: Avaliacao de Estetica, Ficha de Nutricao" 
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTemplate} disabled={isSaving || !newTemplateName}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Editor Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingField?.id ? 'Editar Campo' : 'Novo Campo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Campo</Label>
              <Input
                placeholder="Ex: Queixa Principal"
                value={editingField?.label || ''}
                onChange={(e) => {
                  const label = e.target.value
                  const hash = Math.random().toString(36).substring(2, 6)
                  const key = label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")
                  setEditingField(prev => ({ ...prev, label, field_key: prev?.id ? prev.field_key : `${key}_${hash}` }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Campo</Label>
              <Select 
                value={editingField?.field_type || 'text'} 
                onValueChange={(val: any) => setEditingField(prev => ({ ...prev, field_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto Simples</SelectItem>
                  <SelectItem value="textarea">Texto Longo</SelectItem>
                  <SelectItem value="select">Selecao Unica</SelectItem>
                  <SelectItem value="multiselect">Multipla Selecao</SelectItem>
                  <SelectItem value="scale">Escala (0-10)</SelectItem>
                  <SelectItem value="section_header">Cabecalho de Secao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(editingField?.field_type === 'select' || editingField?.field_type === 'multiselect') && (
              <div className="space-y-2">
                <Label>Opcoes (separadas por virgula)</Label>
                <Input
                  placeholder="Opcao 1, Opcao 2, Opcao 3"
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Dica / Placeholder</Label>
              <Input 
                placeholder="Texto de ajuda no campo..." 
                value={editingField?.placeholder || ''}
                onChange={(e) => setEditingField(prev => ({ ...prev, placeholder: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm">Campo Obrigatorio</Label>
                <p className="text-xs text-muted-foreground">O profissional deve preencher para salvar</p>
              </div>
              <Switch 
                checked={editingField?.required || false}
                onCheckedChange={(checked) => setEditingField(prev => ({ ...prev, required: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveField} disabled={isSavingFields}>
              {isSavingFields && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Campo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
