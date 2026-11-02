"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TimePickerProps {
  value?: string // HH:MM
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  error?: boolean
  interval?: number // minutes between options, default 30
}

function generateTimes(interval: number): string[] {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += interval) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }
  }
  return times
}

function TimePicker({ value, onChange, placeholder = "Horário", className, error, interval = 30 }: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const times = React.useMemo(() => generateTimes(interval), [interval])
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (open && value && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-time="${value}"]`)
      if (el) {
        el.scrollIntoView({ block: "center" })
      }
    }
  }, [open, value])

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground",
            error && "border-destructive",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 shrink-0" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div ref={scrollRef} className="h-60 overflow-y-auto overscroll-contain">
          <div className="flex flex-col p-1">
            {times.map((t) => (
              <button
                key={t}
                type="button"
                data-time={t}
                className={cn(
                  "rounded-md px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                  value === t && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => {
                  onChange?.(t)
                  setOpen(false)
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface TimePickerInlineProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  interval?: number
}

function TimePickerInline({ value, onChange, placeholder = "Horário", className, interval = 30 }: TimePickerInlineProps) {
  const [open, setOpen] = React.useState(false)
  const times = React.useMemo(() => generateTimes(interval), [interval])
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (open && value && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-time="${value}"]`)
      if (el) {
        el.scrollIntoView({ block: "center" })
      }
    }
  }, [open, value])

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value ? "text-foreground" : "text-muted-foreground",
            className
          )}
        >
          {value || placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <div ref={scrollRef} className="h-52 overflow-y-auto overscroll-contain">
          <div className="flex flex-col p-1">
            {times.map((t) => (
              <button
                key={t}
                type="button"
                data-time={t}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                  value === t && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => {
                  onChange?.(t)
                  setOpen(false)
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { TimePicker, TimePickerInline }
