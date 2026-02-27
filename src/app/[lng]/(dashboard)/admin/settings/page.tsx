"use client"

import { useEffect, useState } from "react"
import { Settings, Save, Loader2, AlertTriangle } from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/stores/auth-store"
import { api } from "@/lib/api/client"
import { handleApiError, showToast } from "@/lib/toast"

interface AdminSettingsPageProps {
  params: Promise<{ lng: string }>
}

interface SettingDetail {
  value: string
  description: string
}

export default function AdminSettingsPage({ params }: AdminSettingsPageProps) {
  const [lng, setLng] = useState("pt-BR")
  const { clinic } = useAuthStore()
  const [settings, setSettings] = useState<Record<string, SettingDetail>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const data = await api.getAdminSettings()
      setSettings(data.settings)
      // Initialize edited values with current values
      const values: Record<string, string> = {}
      Object.entries(data.settings).forEach(([key, detail]) => {
        values[key] = detail.value
      })
      setEditedValues(values)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (key: string) => {
    const newValue = editedValues[key]
    if (newValue === settings[key]?.value) return

    try {
      setIsSaving(key)
      await api.updateAdminSetting(key, newValue)
      setSettings(prev => ({
        ...prev,
        [key]: { ...prev[key], value: newValue }
      }))
      showToast.success("Configuracao atualizada com sucesso")
    } catch (err) {
      handleApiError(err)
      // Revert on error
      setEditedValues(prev => ({
        ...prev,
        [key]: settings[key]?.value || ""
      }))
    } finally {
      setIsSaving(null)
    }
  }

  const handleToggle = async (key: string, checked: boolean) => {
    const newValue = checked ? "true" : "false"
    setEditedValues(prev => ({ ...prev, [key]: newValue }))

    try {
      setIsSaving(key)
      await api.updateAdminSetting(key, newValue)
      setSettings(prev => ({
        ...prev,
        [key]: { ...prev[key], value: newValue }
      }))
      showToast.success("Configuracao atualizada com sucesso")
    } catch (err) {
      handleApiError(err)
      // Revert on error
      setEditedValues(prev => ({
        ...prev,
        [key]: settings[key]?.value || "false"
      }))
    } finally {
      setIsSaving(null)
    }
  }

  const hasChanged = (key: string) => editedValues[key] !== settings[key]?.value

  // Check if clinic is dev type
  // @ts-ignore - Clinic type might not have 'type' property defined yet in the frontend types
  if (clinic?.type !== "dev") {
    return (
      <div className="flex h-full flex-col">
        <Header lng={lng} title="Configuracoes do Sistema" />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>Acesso Restrito</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta pagina esta disponivel apenas para clinicas de desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Configuracoes do Sistema" />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Plan Limits */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Limites de Profissionais</CardTitle>
                  </div>
                  <CardDescription>
                    Configure o numero maximo de profissionais por plano
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingInput
                    label="Plano Basico"
                    settingKey="plan_basic_limit"
                    description={settings.plan_basic_limit?.description}
                    value={editedValues.plan_basic_limit || ""}
                    onChange={(val) => setEditedValues(prev => ({ ...prev, plan_basic_limit: val }))}
                    onSave={() => handleSave("plan_basic_limit")}
                    hasChanged={hasChanged("plan_basic_limit")}
                    isSaving={isSaving === "plan_basic_limit"}
                  />
                  <Separator />
                  <SettingInput
                    label="Plano Profissional"
                    settingKey="plan_pro_limit"
                    description={settings.plan_pro_limit?.description}
                    value={editedValues.plan_pro_limit || ""}
                    onChange={(val) => setEditedValues(prev => ({ ...prev, plan_pro_limit: val }))}
                    onSave={() => handleSave("plan_pro_limit")}
                    hasChanged={hasChanged("plan_pro_limit")}
                    isSaving={isSaving === "plan_pro_limit"}
                  />
                  <Separator />
                  <SettingInput
                    label="Plano Avancado"
                    settingKey="plan_advanced_limit"
                    description={settings.plan_advanced_limit?.description}
                    value={editedValues.plan_advanced_limit || ""}
                    onChange={(val) => setEditedValues(prev => ({ ...prev, plan_advanced_limit: val }))}
                    onSave={() => handleSave("plan_advanced_limit")}
                    hasChanged={hasChanged("plan_advanced_limit")}
                    isSaving={isSaving === "plan_advanced_limit"}
                    hint="Use -1 para ilimitado"
                  />
                </CardContent>
              </Card>

              {/* Plan Prices */}
              <Card>
                <CardHeader>
                  <CardTitle>Precos dos Planos (BRL)</CardTitle>
                  <CardDescription>
                    Configure os precos mensais de cada plano
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingInput
                    label="Plano Basico"
                    settingKey="plan_basic_price"
                    description={settings.plan_basic_price?.description}
                    value={editedValues.plan_basic_price || ""}
                    onChange={(val) => setEditedValues(prev => ({ ...prev, plan_basic_price: val }))}
                    onSave={() => handleSave("plan_basic_price")}
                    hasChanged={hasChanged("plan_basic_price")}
                    isSaving={isSaving === "plan_basic_price"}
                    prefix="R$"
                  />
                  <Separator />
                  <SettingInput
                    label="Plano Profissional"
                    settingKey="plan_pro_price"
                    description={settings.plan_pro_price?.description}
                    value={editedValues.plan_pro_price || ""}
                    onChange={(val) => setEditedValues(prev => ({ ...prev, plan_pro_price: val }))}
                    onSave={() => handleSave("plan_pro_price")}
                    hasChanged={hasChanged("plan_pro_price")}
                    isSaving={isSaving === "plan_pro_price"}
                    prefix="R$"
                  />
                  <Separator />
                  <SettingInput
                    label="Plano Avancado"
                    settingKey="plan_advanced_price"
                    description={settings.plan_advanced_price?.description}
                    value={editedValues.plan_advanced_price || ""}
                    onChange={(val) => setEditedValues(prev => ({ ...prev, plan_advanced_price: val }))}
                    onSave={() => handleSave("plan_advanced_price")}
                    hasChanged={hasChanged("plan_advanced_price")}
                    isSaving={isSaving === "plan_advanced_price"}
                    prefix="R$"
                  />
                </CardContent>
              </Card>

              {/* Excess Billing */}
              <Card>
                <CardHeader>
                  <CardTitle>Cobranca de Excedente</CardTitle>
                  <CardDescription>
                    Configure a cobranca por profissional adicional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingInput
                    label="Preco por Profissional Excedente"
                    settingKey="plan_excess_price"
                    description={settings.plan_excess_price?.description}
                    value={editedValues.plan_excess_price || ""}
                    onChange={(val) => setEditedValues(prev => ({ ...prev, plan_excess_price: val }))}
                    onSave={() => handleSave("plan_excess_price")}
                    hasChanged={hasChanged("plan_excess_price")}
                    isSaving={isSaving === "plan_excess_price"}
                    prefix="R$"
                  />
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Cobranca de Excedente Ativa</Label>
                      <p className="text-sm text-muted-foreground">
                        {settings.excess_billing_enabled?.description || "Ativar cobranca automatica por excedente"}
                      </p>
                    </div>
                    <Switch
                      checked={editedValues.excess_billing_enabled === "true"}
                      onCheckedChange={(checked) => handleToggle("excess_billing_enabled", checked)}
                      disabled={isSaving === "excess_billing_enabled"}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Trial */}
              <Card>
                <CardHeader>
                  <CardTitle>Periodo de Trial</CardTitle>
                  <CardDescription>
                    Configure o periodo de teste gratuito
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SettingInput
                    label="Dias de Trial"
                    settingKey="trial_days"
                    description={settings.trial_days?.description}
                    value={editedValues.trial_days || ""}
                    onChange={(val) => setEditedValues(prev => ({ ...prev, trial_days: val }))}
                    onSave={() => handleSave("trial_days")}
                    hasChanged={hasChanged("trial_days")}
                    isSaving={isSaving === "trial_days"}
                    suffix="dias"
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface SettingInputProps {
  label: string
  settingKey: string
  description?: string
  value: string
  onChange: (value: string) => void
  onSave: () => void
  hasChanged: boolean
  isSaving: boolean
  prefix?: string
  suffix?: string
  hint?: string
}

function SettingInput({
  label,
  description,
  value,
  onChange,
  onSave,
  hasChanged,
  isSaving,
  prefix,
  suffix,
  hint,
}: SettingInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-base">{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex items-center gap-2">
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-[120px]"
        />
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
        {hasChanged && (
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
