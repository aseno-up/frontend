'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, UserCog, UserX, UserCheck, Trash2, Crown } from 'lucide-react'
import type { User } from '@/types/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const roleLabels: Record<string, string> = {
  owner: 'Proprietario',
  admin: 'Administrador',
  professional: 'Profissional',
  receptionist: 'Recepcionista',
}

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  professional: 'bg-green-100 text-green-800',
  receptionist: 'bg-orange-100 text-orange-800',
}

interface UserTableProps {
  users: User[]
  currentUserId: string
  onEditRole: (user: User) => void
  onDeactivate: (id: string) => void
  onReactivate: (id: string) => void
  onRemove: (id: string) => void
  page: number
  total: number
  onPageChange: (page: number) => void
}

export function UserTable({
  users,
  currentUserId,
  onEditRole,
  onDeactivate,
  onReactivate,
  onRemove,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">Nenhum usuario encontrado</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Funcao</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId
            const isOwner = user.role === 'owner'

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {user.name}
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        Voce
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={`${roleColors[user.role]} border-0`}>
                    <span className="flex items-center gap-1">
                      {user.role === 'owner' && <Crown className="h-3 w-3" />}
                      {roleLabels[user.role]}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Inativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isOwner || isCurrentUser}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditRole(user)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Alterar funcao
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.is_active ? (
                        <DropdownMenuItem onClick={() => onDeactivate(user.id)}>
                          <UserX className="mr-2 h-4 w-4" />
                          Desativar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onReactivate(user.id)}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Reativar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onRemove(user.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
