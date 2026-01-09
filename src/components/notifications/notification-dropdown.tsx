"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, Trash2, Calendar, MessageSquare, AlertTriangle, User, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api/client"
import { handleApiError } from "@/lib/toast"
import type { Notification, NotificationType } from "@/types/api"
import { cn } from "@/lib/utils"

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  appointment_reminder: <Calendar className="h-4 w-4 text-blue-500" />,
  appointment_confirmed: <Calendar className="h-4 w-4 text-green-500" />,
  appointment_cancelled: <Calendar className="h-4 w-4 text-red-500" />,
  appointment_rescheduled: <Calendar className="h-4 w-4 text-yellow-500" />,
  whatsapp_connected: <MessageSquare className="h-4 w-4 text-green-500" />,
  whatsapp_disconnected: <MessageSquare className="h-4 w-4 text-red-500" />,
  trial_ending: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  trial_expired: <AlertTriangle className="h-4 w-4 text-red-500" />,
  new_patient: <User className="h-4 w-4 text-blue-500" />,
  system: <Info className="h-4 w-4 text-gray-500" />,
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.getUnreadNotificationCount()
      setUnreadCount(data.count)
    } catch {
      // Silently fail - don't show error for background polling
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.getNotifications(20, 0)
      setNotifications(data || [])
    } catch (err) {
      handleApiError(err, "Erro ao carregar notificacoes")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      handleApiError(err, "Erro ao marcar como lida")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      handleApiError(err, "Erro ao marcar todas como lidas")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id)
      const notification = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      handleApiError(err, "Erro ao excluir notificacao")
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <h4 className="font-semibold">Notificacoes</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificacao</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.read && "bg-muted/50"
                )}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="mt-0.5">
                  {notificationIcons[notification.type]}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={cn("text-sm", !notification.read && "font-medium")}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(notification.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
