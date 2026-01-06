import { useAuthStore } from '@/stores/auth-store'
import type { UserRole } from '@/types/api'

// Permission types
export type Permission =
  // Agenda
  | 'agenda:view'
  | 'agenda:create'
  | 'agenda:edit'
  | 'agenda:delete'
  | 'agenda:full'
  | 'agenda:own'
  // Patients
  | 'patients:view'
  | 'patients:create'
  | 'patients:edit'
  | 'patients:delete'
  | 'patients:full'
  | 'patients:assigned'
  // Professionals
  | 'professionals:view'
  | 'professionals:create'
  | 'professionals:edit'
  | 'professionals:delete'
  | 'professionals:full'
  // Session Plans
  | 'session-plans:view'
  | 'session-plans:create'
  | 'session-plans:edit'
  | 'session-plans:delete'
  | 'session-plans:full'
  | 'session-plans:own'
  // WhatsApp
  | 'whatsapp:access'
  // Billing
  | 'billing:access'
  // Settings
  | 'settings:access'
  // Users
  | 'users:manage'

// Role permission mappings
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'agenda:full',
    'patients:full',
    'professionals:full',
    'session-plans:full',
    'whatsapp:access',
    'billing:access',
    'settings:access',
    'users:manage',
  ],
  admin: [
    'agenda:full',
    'patients:full',
    'professionals:full',
    'session-plans:full',
    'whatsapp:access',
    'billing:access',
    'settings:access',
    'users:manage',
  ],
  receptionist: [
    'agenda:full',
    'patients:full',
    'professionals:view',
    'session-plans:full',
    'whatsapp:access',
  ],
  professional: [
    'agenda:own',
    'patients:assigned',
    'professionals:view',
    'session-plans:own',
  ],
}

// Permission expansion - some permissions include others
const PERMISSION_INCLUDES: Partial<Record<Permission, Permission[]>> = {
  'agenda:full': ['agenda:view', 'agenda:create', 'agenda:edit', 'agenda:delete'],
  'agenda:own': ['agenda:view', 'agenda:create', 'agenda:edit'],
  'patients:full': ['patients:view', 'patients:create', 'patients:edit', 'patients:delete'],
  'patients:assigned': ['patients:view'],
  'professionals:full': ['professionals:view', 'professionals:create', 'professionals:edit', 'professionals:delete'],
  'session-plans:full': ['session-plans:view', 'session-plans:create', 'session-plans:edit', 'session-plans:delete'],
  'session-plans:own': ['session-plans:view', 'session-plans:create', 'session-plans:edit'],
}

export function usePermissions() {
  const user = useAuthStore((state) => state.user)

  const role = user?.role ?? null

  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false

    const permissions = ROLE_PERMISSIONS[role] || []

    // Check direct permission
    if (permissions.includes(permission)) {
      return true
    }

    // Check if any permission in the role includes this permission
    for (const p of permissions) {
      const included = PERMISSION_INCLUDES[p]
      if (included?.includes(permission)) {
        return true
      }
    }

    return false
  }

  const hasAnyPermission = (...permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p))
  }

  const hasAllPermissions = (...permissions: Permission[]): boolean => {
    return permissions.every((p) => hasPermission(p))
  }

  // Role checks
  const isOwner = role === 'owner'
  const isAdmin = role === 'owner' || role === 'admin'
  const isProfessional = role === 'professional'
  const isReceptionist = role === 'receptionist'

  // Common permission checks
  const canManageUsers = hasPermission('users:manage')
  const canAccessBilling = hasPermission('billing:access')
  const canAccessSettings = hasPermission('settings:access')
  const canAccessWhatsApp = hasPermission('whatsapp:access')
  const canManageProfessionals = hasPermission('professionals:full')

  return {
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner,
    isAdmin,
    isProfessional,
    isReceptionist,
    canManageUsers,
    canAccessBilling,
    canAccessSettings,
    canAccessWhatsApp,
    canManageProfessionals,
  }
}
