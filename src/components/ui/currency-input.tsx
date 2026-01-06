"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number
  onChange?: (value: number) => void
}

/**
 * Formata um valor em centavos para Real brasileiro
 * Ex: 15000 -> "150,00"
 */
function formatCurrency(cents: number): string {
  const value = cents / 100
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Extrai apenas os digitos de uma string e converte para centavos
 * Ex: "R$ 150,00" -> 15000
 */
function parseCurrency(value: string): number {
  const digits = value.replace(/\D/g, "")
  return parseInt(digits, 10) || 0
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = 0, onChange, ...props }, ref) => {
    // Converte o valor (em reais) para centavos para exibicao
    const centsValue = Math.round((value || 0) * 100)
    const [displayValue, setDisplayValue] = React.useState(() => formatCurrency(centsValue))

    // Atualiza o displayValue quando o value externo muda
    React.useEffect(() => {
      const newCents = Math.round((value || 0) * 100)
      setDisplayValue(formatCurrency(newCents))
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const cents = parseCurrency(inputValue)

      // Atualiza o display formatado
      setDisplayValue(formatCurrency(cents))

      // Converte centavos para reais e notifica o pai
      const reais = cents / 100
      onChange?.(reais)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Seleciona todo o texto ao focar
      e.target.select()
      props.onFocus?.(e)
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          {...props}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput, formatCurrency, parseCurrency }
