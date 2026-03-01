'use client'

import {
  Table,
  TableBody,
  TableCell,
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
import { SortableTableHead } from '@/components/ui/sortable-table-head'
import { DataTablePagination } from '@/components/ui/data-table-pagination'

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  professional: 'Profissional',
  receptionist: 'Recepcionista',
}

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  professional: 'bg-green-100 text-green-800 border-green-200',
  receptionist: 'bg-orange-100 text-orange-800 border-orange-200',
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
  limit: number
}

export function UserTable({
  users,
  currentUserId,
  onEditRole,
  onDeactivate,
  onReactivate,
  onRemove,
  page,
  total,
  limit,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-slate-100 p-4 mb-4">
          <Crown className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum usuário encontrado</h3>
        <p className="text-sm text-slate-500 max-w-sm">Tente ajustar seus filtros de busca ou adicione um novo usuário.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <SortableTableHead sortKey="name" title="Nome do Usuário" />
              <SortableTableHead sortKey="email" title="E-mail" />
              <SortableTableHead sortKey="role" title="Função" />
              <SortableTableHead sortKey="status" title="Status" />
              <SortableTableHead sortKey="created_" title="Criado em" />
              <th className="w-[80px]"></th>
            </TableRow>
          </thead>
          <TableBody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId
              const isOwner = user.role === 'owner'

              return (
                <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-medium align-middle">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary uppercase text-xs font-bold">
                        {user.name.substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Sua Conta
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${roleColors[user.role]} shadow-none font-medium`}>
                      <span className="flex items-center gap-1.5 py-0.5">
                        {user.role === 'owner' && <Crown className="h-3 w-3" />}
                        {roleLabels[user.role]}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
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
                          Alterar função
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
                          className="text-destructive focus:text-destructive"
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
      <div className="border-t p-4">
        <DataTablePagination
          meta={{
            page,
            limit,
            total,
            total_pages: Math.max(1, Math.ceil(total / limit))
          }}
          entityName="usuários"
        />
      </div>
    </div>
  )
}
