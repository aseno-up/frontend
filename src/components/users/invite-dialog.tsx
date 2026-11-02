'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { showToast } from '@/lib/toast'
import { ReactSelect, type SelectOption } from '@/components/ui/react-select'

const inviteSchema = z.object({
  email: z.string().email('Email invalido'),
  role: z.enum(['admin', 'professional', 'receptionist'], {
    message: 'Selecione uma funcao',
  }),
  professional_id: z.string().optional(),
  new_professional_name: z.string().optional(),
}).refine((data) => {
  if (data.role === 'professional') {
    return !!data.professional_id || !!data.new_professional_name
  }
  return true
}, {
  message: 'Selecione um profissional existente ou digite o nome para criar um novo',
  path: ['professional_id'],
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InviteDialog({ open, onOpenChange, onSuccess }: InviteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [professionals, setProfessionals] = useState<SelectOption[]>([])
  const [loadingProfessionals, setLoadingProfessionals] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | undefined>()
  const [professionalInput, setProfessionalInput] = useState('')
  const [selectedProfessional, setSelectedProfessional] = useState<SelectOption | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: undefined,
      professional_id: undefined,
      new_professional_name: undefined,
    },
  })

  // Load available professionals (active, without linked user)
  useEffect(() => {
    if (selectedRole === 'professional' && open) {
      setLoadingProfessionals(true)
      api.getProfessionals({ status: 'active', limit: 100 })
        .then((res) => {
          const available = (res.data || [])
            .filter((p: { user_id?: string }) => !p.user_id)
            .map((p: { id: string; name: string }) => ({
              value: p.id,
              label: p.name,
            }))
          setProfessionals(available)
        })
        .catch(() => setProfessionals([]))
        .finally(() => setLoadingProfessionals(false))
    }
  }, [selectedRole, open])

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    setValue('role', value as InviteFormData['role'])
    // Clear professional selection when changing role
    setValue('professional_id', undefined)
    setValue('new_professional_name', undefined)
    setSelectedProfessional(null)
    setProfessionalInput('')
  }

  const handleProfessionalChange = (option: SelectOption | null) => {
    setSelectedProfessional(option)
    if (option) {
      setValue('professional_id', option.value)
      setValue('new_professional_name', undefined)
    } else {
      setValue('professional_id', undefined)
    }
  }

  const handleProfessionalInputChange = (inputValue: string) => {
    setProfessionalInput(inputValue)
  }

  const handleCreateProfessional = () => {
    if (professionalInput.trim()) {
      setValue('new_professional_name', professionalInput.trim())
      setValue('professional_id', undefined)
      setSelectedProfessional({ value: '__new__', label: professionalInput.trim() })
    }
  }

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true)
    try {
      const payload: { email: string; role: string; professional_id?: string; new_professional_name?: string } = {
        email: data.email,
        role: data.role,
      }

      if (data.role === 'professional') {
        if (data.new_professional_name) {
          payload.new_professional_name = data.new_professional_name
        } else if (data.professional_id) {
          payload.professional_id = data.professional_id
        }
      }

      await api.createInvite(payload)
      reset()
      setSelectedRole(undefined)
      setSelectedProfessional(null)
      setProfessionalInput('')
      onSuccess()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      const message = err.response?.data?.error?.message || 'Erro ao enviar convite'
      showToast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
      setSelectedRole(undefined)
      setSelectedProfessional(null)
      setProfessionalInput('')
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Usuario</DialogTitle>
          <DialogDescription>
            Envie um convite para um novo membro da equipe. Ele recebera um email com as
            instrucoes para criar sua conta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Funcao</Label>
            <Select onValueChange={handleRoleChange} value={selectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma funcao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="receptionist">Recepcionista</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {selectedRole === 'professional' && (
            <div className="space-y-2">
              <Label>Profissional</Label>
              <ReactSelect
                options={professionals}
                value={selectedProfessional}
                onChange={(option) => handleProfessionalChange(option as SelectOption | null)}
                onInputChange={handleProfessionalInputChange}
                inputValue={professionalInput}
                isLoading={loadingProfessionals}
                isClearable
                placeholder="Buscar ou digitar nome para criar..."
                noOptionsMessage={() => (
                  professionalInput.trim() ? (
                    <button
                      type="button"
                      className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCreateProfessional()
                      }}
                    >
                      Criar &quot;{professionalInput.trim()}&quot;
                    </button>
                  ) : 'Nenhum profissional disponivel'
                )}
              />
              {selectedProfessional?.value === '__new__' && (
                <p className="text-sm text-muted-foreground">
                  Um novo profissional sera criado: <strong>{selectedProfessional.label}</strong>
                </p>
              )}
              {errors.professional_id && (
                <p className="text-sm text-destructive">{errors.professional_id.message}</p>
              )}
            </div>
          )}

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Permissoes por funcao:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Administrador:</strong> Acesso total a clinica</li>
              <li><strong>Profissional:</strong> Propria agenda e pacientes atribuidos</li>
              <li><strong>Recepcionista:</strong> Agenda, pacientes e WhatsApp</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
