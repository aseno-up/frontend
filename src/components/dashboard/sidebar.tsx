"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Calendar,
  LayoutDashboard,
  Users,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Menu,
  MessageCircle,
  CalendarRange,
  UserPlus,
  BarChart3,
  DollarSign,
  Stethoscope,
  Shield,
  FileText,
  Server,
  Flag,
  Activity,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissions, Permission } from "@/hooks/use-permissions"
import { useState, useEffect, useMemo, useCallback } from "react"
import { ClinicSwitcher } from "./clinic-switcher"

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  permission?: Permission
  tutorialId?: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard, tutorialId: "dashboard" },
  { href: "/agenda", label: "Agenda", icon: Calendar, permission: "agenda:view", tutorialId: "agenda" },
  { href: "/pacientes", label: "Pacientes", icon: Users, permission: "patients:view", tutorialId: "pacientes" },
  { href: "/profissionais", label: "Profissionais", icon: UserCog, permission: "professionals:view", tutorialId: "profissionais" },
  { href: "/procedimentos", label: "Procedimentos", icon: Stethoscope, permission: "professionals:view", tutorialId: "procedimentos" },
  { href: "/planos-sessao", label: "Planos de Sessao", icon: CalendarRange, permission: "session-plans:view", tutorialId: "planos-sessao" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, permission: "whatsapp:access", tutorialId: "whatsapp" },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign, permission: "billing:access", tutorialId: "financeiro" },
  { href: "/usuarios", label: "Usuarios", icon: UserPlus, permission: "users:manage", tutorialId: "usuarios" },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings, permission: "settings:access", tutorialId: "configuracoes" },
]

const adminNavItems: NavItem[] = [
  { href: "/admin/leads", label: "CRM Leads", icon: Target },
  { href: "/admin/system-logs", label: "System Logs", icon: Server },
  { href: "/admin/usage-metrics", label: "Usage Metrics", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Shield },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
]

interface SidebarProps {
  lng: string
}

export function Sidebar({ lng }: SidebarProps) {
  const pathname = usePathname()
  const { clinic, logout } = useAuthStore()
  const { hasPermission } = usePermissions()
  const [collapsed, setCollapsed] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Filter nav items based on permissions
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (!item.permission) return true
      return hasPermission(item.permission)
    })
  }, [hasPermission])

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (stored !== null) {
      setCollapsed(stored === "true")
    }
    setIsHydrated(true)
  }, [])

  // Save collapsed state to localStorage when it changes
  const handleCollapse = (value: boolean) => {
    setCollapsed(value)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value))
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = `/${lng}/login`
  }

  // Check if clinic is dev type for admin menu
  const isDevClinic = clinic?.type === "dev"
  const [adminOpen, setAdminOpen] = useState(pathname.includes("/admin/"))

  const NavLinks = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto" data-tutorial="sidebar">
      {filteredNavItems.map((item) => {
        const isActive = pathname.includes(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={`/${lng}${item.href}`}
            onClick={onItemClick}
            data-tutorial={item.tutorialId}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}

      {/* Admin section - collapsible dropdown, only visible for dev clinics */}
      {isDevClinic && (
        <div className="mt-2">
          <button
            onClick={() => setAdminOpen(!adminOpen)}
            className={cn(
              "flex items-center w-full gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              adminOpen && "text-foreground"
            )}
          >
            <Shield className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Admin</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", adminOpen && "rotate-180")} />
              </>
            )}
          </button>
          {adminOpen && !collapsed && (
            <div className="ml-4 mt-1 space-y-0.5">
              {adminNavItems.map((item) => {
                const isActive = pathname.includes(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={`/${lng}${item.href}`}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  )

  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-40">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-4 justify-center">
              <Link
                href={`/${lng}/agenda`}
                className="flex items-center justify-center"
                onClick={() => setMobileOpen(false)}
              >
                <div className="relative h-10 w-32 overflow-hidden">
                  <Image
                    src="/logo-horizontal.png"
                    alt="Aseno"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>

            <NavLinks onItemClick={() => setMobileOpen(false)} />

            {/* Logout */}
            <div className="border-t p-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b px-4 relative group",
          collapsed ? "justify-center" : "justify-center"
        )}>
          <Link 
            href={`/${lng}/agenda`} 
            className={cn(
              "flex items-center justify-center overflow-hidden transition-all",
              collapsed && "group-hover:hidden"
            )}
          >
            <div className={cn(
              "relative transition-all duration-300",
              collapsed ? "h-8 w-8" : "h-10 w-32"
            )}>
              <Image
                src={collapsed ? "/logo-icon.png" : "/logo-horizontal.png"}
                alt="Aseno"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 transition-all",
              collapsed ? "hidden group-hover:flex" : "absolute right-4"
            )}
            onClick={() => handleCollapse(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Clinic Switcher - only shows when user has multiple clinics */}
        <div className="border-b px-2 py-2">
          <ClinicSwitcher collapsed={collapsed} />
        </div>

        <NavLinks />

        {/* Logout */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3 text-muted-foreground hover:text-foreground",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>
    </>
  )
}
