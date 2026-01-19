import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={`flex flex-col items-center justify-center p-8 md:p-12 text-center ${className || ""}`}>
      <div className="mb-4 rounded-full bg-muted p-4 md:p-6">
        <Icon className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg md:text-xl font-semibold">{title}</h3>
      <p className="mb-6 text-sm md:text-base text-muted-foreground max-w-md">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="lg" className="w-full sm:w-auto">
          {action.label}
        </Button>
      )}
    </Card>
  )
}
