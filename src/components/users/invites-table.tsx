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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, RefreshCw, XCircle, Clock } from 'lucide-react'
import type { Invite } from '@/types/api'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  professional: 'Profissional',
  receptionist: 'Recepcionista',
}

const roleColors: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-800',
  professional: 'bg-green-100 text-green-800',
  receptionist: 'bg-orange-100 text-orange-800',
}

interface InvitesTableProps {
  invites: Invite[]
  onCancel: (id: string) => void
  onResend: (id: string) => void
  page: number
  total: number
  onPageChange: (page: number) => void
}

export function InvitesTable({
  invites,
  onCancel,
  onResend,
}: InvitesTableProps) {
  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">Nenhum convite pendente</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Funcao</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead>Enviado em</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => {
            const expiresAt = new Date(invite.expires_at)
            const isExpired = isPast(expiresAt)

            return (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell>
                  <Badge className={`${roleColors[invite.role]} border-0`}>
                    {roleLabels[invite.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {isExpired ? (
                      <span className="text-destructive">Expirado</span>
                    ) : (
                      <span>{formatDistanceToNow(expiresAt, { addSuffix: true, locale: ptBR })}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(invite.created_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onResend(invite.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reenviar convite
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onCancel(invite.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar convite
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
