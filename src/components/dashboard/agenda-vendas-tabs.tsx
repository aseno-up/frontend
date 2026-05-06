"use client"

import { useRouter, useParams } from "next/navigation"
import { CalendarDays, ShoppingCart } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Tab = "agenda" | "vendas"

interface AgendaVendasTabsProps {
  active: Tab
}

// AgendaVendasTabs renders the shared Agenda | Vendas switcher used at the top
// of both /agenda and /vendas. Each tab navigates to its own URL so a refresh
// preserves the active view. Styling matches the configurações tabs (underline
// + primary color on active).
export function AgendaVendasTabs({ active }: AgendaVendasTabsProps) {
  const router = useRouter()
  const params = useParams<{ lng: string }>()
  const lng = params?.lng || "pt-BR"

  const handleChange = (value: string) => {
    if (value === active) return
    router.push(`/${lng}/${value}`)
  }

  const triggerClass =
    "relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"

  return (
    <Tabs value={active} onValueChange={handleChange} className="w-full">
      <div className="border-b border-border/40">
        <TabsList className="flex h-12 w-full justify-start gap-4 md:gap-6 bg-transparent p-0">
          <TabsTrigger value="agenda" className={triggerClass}>
            <CalendarDays className="h-4 w-4" />
            <span>Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="vendas" className={triggerClass}>
            <ShoppingCart className="h-4 w-4" />
            <span>Vendas</span>
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  )
}
