'use client'

import { ReactNode } from 'react'
import { usePermissions, Permission } from '@/hooks/use-permissions'

interface PermissionGuardProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  // Single permission check
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>
    }
    return <>{children}</>
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(...permissions)
      : hasAnyPermission(...permissions)

    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = usePermissions()

  if (!isAdmin) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface OwnerOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function OwnerOnly({ children, fallback = null }: OwnerOnlyProps) {
  const { isOwner } = usePermissions()

  if (!isOwner) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
