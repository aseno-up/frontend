"use client"

import Select, { Props, GroupBase, StylesConfig } from "react-select"
import CreatableSelect, { CreatableProps } from "react-select/creatable"

export interface SelectOption {
  value: string
  label: string
  color?: string
  basePrice?: number
}

const customStyles: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> = {
  control: (base, state) => ({
    ...base,
    minHeight: "40px",
    borderRadius: "0.375rem",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--input))",
    backgroundColor: "hsl(var(--background))",
    boxShadow: state.isFocused ? "0 0 0 2px hsl(var(--ring) / 0.2)" : "none",
    "&:hover": {
      borderColor: "hsl(var(--ring))",
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.375rem",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    zIndex: 50,
  }),
  menuList: (base) => ({
    ...base,
    padding: "4px",
    maxHeight: "250px",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
      ? "hsl(var(--accent))"
      : "transparent",
    color: state.isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
    borderRadius: "0.25rem",
    padding: "8px 12px",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "hsl(var(--accent))",
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
  input: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
}

// Custom styles for option with color indicator
const colorOptionStyles: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> = {
  ...customStyles,
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
      ? "hsl(var(--accent))"
      : "transparent",
    color: state.isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
    borderRadius: "0.25rem",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    "&:active": {
      backgroundColor: "hsl(var(--accent))",
    },
  }),
}

interface ReactSelectProps<IsMulti extends boolean = false> extends Omit<Props<SelectOption, IsMulti, GroupBase<SelectOption>>, "styles"> {
  showColorIndicator?: boolean
}

export function ReactSelect<IsMulti extends boolean = false>({ showColorIndicator, ...props }: ReactSelectProps<IsMulti>) {
  const styles = showColorIndicator ? colorOptionStyles : customStyles

  const formatOptionLabel = showColorIndicator
    ? (option: SelectOption) => (
        <div className="flex items-center gap-2">
          {option.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: option.color }}
            />
          )}
          <span>{option.label}</span>
        </div>
      )
    : undefined

  return (
    <Select
      {...props}
      styles={styles}
      formatOptionLabel={formatOptionLabel}
      classNamePrefix="react-select"
      noOptionsMessage={() => "Nenhuma opção encontrada"}
      loadingMessage={() => "Carregando..."}
    />
  )
}

interface ReactCreatableSelectProps<IsMulti extends boolean = false> extends Omit<CreatableProps<SelectOption, IsMulti, GroupBase<SelectOption>>, "styles"> {}

export function ReactCreatableSelect<IsMulti extends boolean = false>(props: ReactCreatableSelectProps<IsMulti>) {
  return (
    <CreatableSelect
      {...props}
      styles={customStyles}
      classNamePrefix="react-select"
      noOptionsMessage={() => "Digite para criar..."}
      formatCreateLabel={(inputValue: string) => `Criar "${inputValue}"`}
      loadingMessage={() => "Carregando..."}
    />
  )
}
