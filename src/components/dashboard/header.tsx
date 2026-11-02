"use client"

import { Search, User, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuthStore } from "@/stores/auth-store"
import { useTutorial, TutorialPage } from "@/hooks/use-tutorial"

interface HeaderProps {
  lng: string
  title?: string
  children?: React.ReactNode
  tutorialPage?: TutorialPage
}

export function Header({ lng, title, children, tutorialPage = "global" }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const { startTutorial, isRunning } = useTutorial({ page: tutorialPage, lng })

  const handleLogout = async () => {
    await logout()
    window.location.href = `/${lng}/login`
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-card/80 backdrop-blur-md px-4 md:px-6">
      {/* Title (mobile has extra padding for menu button) */}
      <div className="flex-1 pl-12 md:pl-0 flex items-center justify-between">
        <div>
          {title && (
            <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
          )}
        </div>
        {children && <div className="hidden md:flex">{children}</div>}
      </div>

      {/* Search */}
      <div className="hidden md:flex relative w-64" data-tutorial="search">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar..."
          className="pl-8 bg-muted/50"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Tutorial Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startTutorial()}
                disabled={isRunning}
                data-tutorial="tutorial-button"
                className="h-10 w-10 md:h-10 md:w-10"
              >
                <HelpCircle className="h-5 w-5 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver tutorial</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notifications */}
        <div data-tutorial="notifications">
          <NotificationDropdown />
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 md:h-9 md:w-9 rounded-full"
              data-tutorial="user-menu"
            >
              <Avatar className="h-10 w-10 md:h-9 md:w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user ? getInitials(user.name) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`/${lng}/configuracoes`}>Configuracoes</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
