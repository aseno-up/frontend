'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import type { User } from '@/types/api'

type UserRole = 'admin' | 'professional' | 'receptionist'

interface EditRoleDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditRoleDialog({ user, open, onOpenChange, onSuccess }: EditRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  useEffect(() => {
    if (user && user.role !== 'owner') {
      setSelectedRole(user.role as UserRole)
    }
  }, [user])

  const handleSubmit = async () => {
    if (!user || !selectedRole) return

    setIsLoading(true)
    try {
      await api.updateUserRole(user.id, selectedRole)
      onSuccess()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      const message = err.response?.data?.error?.message || 'Erro ao atualizar funcao'
      showToast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Funcao</DialogTitle>
          <DialogDescription>
            Altere a funcao de <strong>{user.name}</strong> na clinica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Nova Funcao</Label>
            <Select
              value={selectedRole || undefined}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma funcao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="receptionist">Recepcionista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Permissoes por funcao:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Administrador:</strong> Acesso total a clinica</li>
              <li><strong>Profissional:</strong> Propria agenda e pacientes atribuidos</li>
              <li><strong>Recepcionista:</strong> Agenda, pacientes e WhatsApp</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedRole || selectedRole === user.role}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
