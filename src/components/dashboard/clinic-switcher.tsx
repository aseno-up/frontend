'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { showToast } from '@/lib/toast'
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ClinicSwitcherProps {
  collapsed?: boolean
}

export function ClinicSwitcher({ collapsed = false }: ClinicSwitcherProps) {
  const { clinic, clinics, switchClinic } = useAuthStore()
  const [isSwitching, setIsSwitching] = useState(false)

  // Don't show if user only has one clinic
  if (!clinics || clinics.length <= 1) {
    return null
  }

  const handleSwitch = async (clinicId: string) => {
    if (clinicId === clinic?.id) return
    setIsSwitching(true)
    try {
      await switchClinic(clinicId)
      window.location.reload()
    } catch {
      showToast.error('Erro ao trocar de clinica')
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-2 text-sm font-normal text-muted-foreground hover:text-foreground",
            collapsed ? "justify-center px-2" : "justify-between px-3"
          )}
          disabled={isSwitching}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isSwitching ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Building2 className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && (
              <span className="truncate">{clinic?.name || 'Clinica'}</span>
            )}
          </div>
          {!collapsed && <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {clinics.map((c) => (
          <DropdownMenuItem
            key={c.clinic_id}
            onClick={() => handleSwitch(c.clinic_id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="text-sm">{c.clinic_name}</span>
              <span className="text-xs text-muted-foreground capitalize">{c.role}</span>
            </div>
            {c.clinic_id === clinic?.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
