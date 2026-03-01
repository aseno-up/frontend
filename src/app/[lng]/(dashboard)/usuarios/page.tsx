'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Mail, Loader2, Search, X } from 'lucide-react'
import { api } from '@/lib/api/client'
import { showToast } from '@/lib/toast'
import type { User, Invite, InviteListResponse } from '@/types/api'
import { Header } from '@/components/dashboard/header'
import { UserTable } from '@/components/users/user-table'
import { InvitesTable } from '@/components/users/invites-table'
import { InviteDialog } from '@/components/users/invite-dialog'
import { EditRoleDialog } from '@/components/users/edit-role-dialog'
import { useAuthStore } from '@/stores/auth-store'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UsuariosPageProps {
  params: Promise<{ lng: string }>
}

export default function UsuariosPage({ params }: UsuariosPageProps) {
  const [lng, setLng] = useState('pt-BR')

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { user: currentUser } = useAuthStore()
  
  // URL Params for Users
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20
  const searchUrl = searchParams.get('search') || ''
  const roleUrl = searchParams.get('status') || 'all' // using status term for role filtering
  const sortBy = searchParams.get('sort_by') || 'created_desc'

  const [users, setUsers] = useState<User[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingInvites, setIsLoadingInvites] = useState(true)
  
  const [userTotal, setUserTotal] = useState(0)
  const [inviteTotal, setInviteTotal] = useState(0)
  const [invitePage, setInvitePage] = useState(1)
  
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null)

  // Local state for search debounce
  const [searchTerm, setSearchTerm] = useState(searchUrl)

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    // reset to page 1 on filter changes if not explicit
    if (!('page' in updates)) {
      params.set('page', '1')
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  // Debounced Search Sync
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== searchUrl) {
        updateFilters({ search: searchTerm || null })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, searchUrl, updateFilters])

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const response = await api.getUsers({
        page,
        limit,
        search: searchUrl || undefined,
        status: roleUrl !== 'all' ? roleUrl : undefined,
        sort_by: sortBy,
      })
      setUsers(response.data || [])
      setUserTotal(response.meta?.total || 0)
    } catch (error) {
      showToast.error('Erro ao carregar usuários')
      console.error(error)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [page, limit, searchUrl, roleUrl, sortBy])

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
      showToast.success('Usuário desativado')
      loadUsers()
    } catch (error) {
      showToast.error('Erro ao desativar usuário')
      console.error(error)
    }
  }

  const handleReactivateUser = async (id: string) => {
    try {
      await api.reactivateUser(id)
      showToast.success('Usuário reativado')
      loadUsers()
    } catch (error) {
      showToast.error('Erro ao reativar usuário')
      console.error(error)
    }
  }

  const handleRemoveUser = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.')) {
      return
    }
    try {
      await api.removeUser(id)
      showToast.success('Usuário removido')
      loadUsers()
    } catch (error) {
      showToast.error('Erro ao remover usuário')
      console.error(error)
    }
  }

  const handleRoleUpdated = () => {
    setEditRoleUser(null)
    loadUsers()
    showToast.success('Função atualizada com sucesso!')
  }

  const pendingInvites = invites.filter((i) => i.status === 'pending')

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <Header lng={lng} title="Usuários do Sistema">
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Usuário
        </Button>
      </Header>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        <Tabs defaultValue="users" className="space-y-4">
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <TabsList className="bg-white border shadow-sm h-11">
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-slate-100 px-6">
              <Users className="h-4 w-4" />
              Usuários Cadastrados
              <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold">{userTotal}</span>
            </TabsTrigger>
            <TabsTrigger value="invites" className="flex items-center gap-2 data-[state=active]:bg-slate-100 px-6">
              <Mail className="h-4 w-4" />
              Convites Pendentes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-4 m-0">
          
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative w-full sm:max-w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex w-full sm:w-auto items-center gap-2 ml-auto">
              <Select
                value={roleUrl}
                onValueChange={(val) => updateFilters({ status: val })}
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-white">
                  <SelectValue placeholder="Todas Funções" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Funções</SelectItem>
                  <SelectItem value="owner">Proprietário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="receptionist">Recepcionista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-20">
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
                page={page}
                total={userTotal}
                limit={limit}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4 m-0 pt-2">
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden p-0">
             <div className="p-4 border-b bg-slate-50/50">
               <h3 className="font-medium">Gerenciar Convites</h3>
               <p className="text-sm text-muted-foreground">Reenvie ou cancele convites em andamento.</p>
             </div>
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
          </div>
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
