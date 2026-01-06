'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Mail, Loader2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { showToast } from '@/lib/toast'
import type { User, Invite, UserListResponse, InviteListResponse } from '@/types/api'
import { Header } from '@/components/dashboard/header'
import { UserTable } from '@/components/users/user-table'
import { InvitesTable } from '@/components/users/invites-table'
import { InviteDialog } from '@/components/users/invite-dialog'
import { EditRoleDialog } from '@/components/users/edit-role-dialog'
import { useAuthStore } from '@/stores/auth-store'

interface UsuariosPageProps {
  params: Promise<{ lng: string }>
}

export default function UsuariosPage({ params }: UsuariosPageProps) {
  const [lng, setLng] = useState('pt-BR')

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingInvites, setIsLoadingInvites] = useState(true)
  const [userPage, setUserPage] = useState(1)
  const [invitePage, setInvitePage] = useState(1)
  const [userTotal, setUserTotal] = useState(0)
  const [inviteTotal, setInviteTotal] = useState(0)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null)

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const response: UserListResponse = await api.getUsers(userPage, 20)
      setUsers(response.data)
      setUserTotal(response.total)
    } catch (error) {
      showToast.error('Erro ao carregar usuarios')
      console.error(error)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [userPage])

  const loadInvites = useCallback(async () => {
    setIsLoadingInvites(true)
    try {
      const response: InviteListResponse = await api.getInvites(invitePage, 20)
      setInvites(response.data)
      setInviteTotal(response.total)
    } catch (error) {
      showToast.error('Erro ao carregar convites')
      console.error(error)
    } finally {
      setIsLoadingInvites(false)
    }
  }, [invitePage])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadInvites()
  }, [loadInvites])

  const handleInviteCreated = () => {
    setIsInviteDialogOpen(false)
    loadInvites()
    showToast.success('Convite enviado com sucesso!')
  }

  const handleCancelInvite = async (id: string) => {
    try {
      await api.cancelInvite(id)
      showToast.success('Convite cancelado')
      loadInvites()
    } catch (error) {
      showToast.error('Erro ao cancelar convite')
      console.error(error)
    }
  }

  const handleResendInvite = async (id: string) => {
    try {
      await api.resendInvite(id)
      showToast.success('Convite reenviado')
      loadInvites()
    } catch (error) {
      showToast.error('Erro ao reenviar convite')
      console.error(error)
    }
  }

  const handleDeactivateUser = async (id: string) => {
    try {
      await api.deactivateUser(id)
      showToast.success('Usuario desativado')
      loadUsers()
    } catch (error) {
      showToast.error('Erro ao desativar usuario')
      console.error(error)
    }
  }

  const handleReactivateUser = async (id: string) => {
    try {
      await api.reactivateUser(id)
      showToast.success('Usuario reativado')
      loadUsers()
    } catch (error) {
      showToast.error('Erro ao reativar usuario')
      console.error(error)
    }
  }

  const handleRemoveUser = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este usuario? Esta acao nao pode ser desfeita.')) {
      return
    }
    try {
      await api.removeUser(id)
      showToast.success('Usuario removido')
      loadUsers()
    } catch (error) {
      showToast.error('Erro ao remover usuario')
      console.error(error)
    }
  }

  const handleRoleUpdated = () => {
    setEditRoleUser(null)
    loadUsers()
    showToast.success('Funcao atualizada com sucesso!')
  }

  const pendingInvites = invites.filter((i) => i.status === 'pending')

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Usuarios">
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Usuario
        </Button>
      </Header>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios ({userTotal})
          </TabsTrigger>
          <TabsTrigger value="invites" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Convites Pendentes ({pendingInvites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <UserTable
              users={users}
              currentUserId={currentUser?.id || ''}
              onEditRole={(user) => setEditRoleUser(user)}
              onDeactivate={handleDeactivateUser}
              onReactivate={handleReactivateUser}
              onRemove={handleRemoveUser}
              page={userPage}
              total={userTotal}
              onPageChange={setUserPage}
            />
          )}
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          {isLoadingInvites ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <InvitesTable
              invites={pendingInvites}
              onCancel={handleCancelInvite}
              onResend={handleResendInvite}
              page={invitePage}
              total={pendingInvites.length}
              onPageChange={setInvitePage}
            />
          )}
        </TabsContent>
      </Tabs>

      <InviteDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSuccess={handleInviteCreated}
      />

      <EditRoleDialog
        user={editRoleUser}
        open={!!editRoleUser}
        onOpenChange={(open) => !open && setEditRoleUser(null)}
        onSuccess={handleRoleUpdated}
      />
      </div>
    </div>
  )
}
