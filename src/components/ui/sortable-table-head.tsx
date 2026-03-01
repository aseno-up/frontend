"use client"

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string
  title: string
}

export function SortableTableHead({ sortKey, title, className, ...props }: SortableTableHeadProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSortKey = searchParams.get("sort_by")?.split("_")[0]
  const currentDirection = searchParams.get("sort_by")?.split("_")[1]
  const isActive = currentSortKey === sortKey

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      // reset page when sorting changes
      params.set("page", "1")
      return params.toString()
    },
    [searchParams]
  )

  const toggleSort = () => {
    let newDirection = "asc"
    
    if (isActive) {
      if (currentDirection === "asc") {
        newDirection = "desc"
      } else if (currentDirection === "desc") {
        // Option to remove sort entirely or cycle back to default could be added here
        newDirection = "asc" 
      }
    }
    
    router.push(pathname + "?" + createQueryString("sort_by", `${sortKey}_${newDirection}`), { scroll: false })
  }

  return (
    <TableHead className={cn("cursor-pointer select-none transition-colors hover:text-primary", isActive && "text-primary", className)} onClick={toggleSort} {...props}>
      <div className="flex items-center gap-1.5">
        {title}
        <span className="shrink-0">
          {isActive ? (
            currentDirection === "asc" ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          )}
        </span>
      </div>
    </TableHead>
  )
}
