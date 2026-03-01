"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"

interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

interface DataTablePaginationProps {
  meta: PaginationMeta
  entityName?: string
}

export function DataTablePagination({ meta, entityName = "itens" }: DataTablePaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { page, limit, total, total_pages } = meta

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= total_pages) {
      router.push(pathname + "?" + createQueryString("page", newPage.toString()), { scroll: false })
    }
  }

  // Calculate start and end indices
  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, total)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    
    // Always show first page
    pages.push(1)
    
    if (page > 3) {
      pages.push('...')
    }
    
    let startPage = Math.max(2, page - 1)
    let endPage = Math.min(total_pages - 1, page + 1)
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    if (page < total_pages - 2) {
      pages.push('...')
    }
    
    // Always show last page if more than 1 page
    if (total_pages > 1) {
      pages.push(total_pages)
    }
    
    return pages
  }

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between px-2 w-full mt-4 flex-wrap gap-4">
      <div className="flex-1 text-sm text-muted-foreground whitespace-nowrap">
        Mostrando <span className="font-medium text-foreground">{startIndex}</span>-<span className="font-medium text-foreground">{endIndex}</span> de <span className="font-medium text-foreground">{total}</span> {entityName}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="h-8 w-8 p-0 border-border bg-transparent shadow-sm hover:bg-muted"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          <span className="sr-only">Página anterior</span>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
        
        <div className="flex items-center gap-1.5">
          {getPageNumbers().map((pageNum, idx) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${idx}`} className="h-8 w-8 flex items-center justify-center text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <Button
                key={`page-${pageNum}`}
                variant={page === pageNum ? "default" : "outline"}
                className={`h-8 w-8 p-0 text-sm font-medium shadow-sm ${
                  page === pageNum 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "border-border bg-transparent hover:bg-muted text-muted-foreground transition-colors"
                }`}
                onClick={() => handlePageChange(pageNum as number)}
              >
                {pageNum}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          className="h-8 w-8 p-0 border-border bg-transparent shadow-sm hover:bg-muted"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= total_pages}
        >
          <span className="sr-only">Próxima página</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}
