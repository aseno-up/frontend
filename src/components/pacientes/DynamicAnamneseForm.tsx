'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import type { AnamneseTemplate, AnamneseTemplateField } from '@/types/api'

interface DynamicAnamneseFormProps {
  template: AnamneseTemplate
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
  readOnly?: boolean
}

export function DynamicAnamneseForm({
  template,
  values,
  onChange,
  readOnly = false,
}: DynamicAnamneseFormProps) {
  const handleFieldChange = (key: string, value: any) => {
    if (readOnly) return
    onChange({ ...values, [key]: value })
  }

  const renderField = (field: AnamneseTemplateField) => {
    const value = values[field.field_key] || ''

    switch (field.field_type) {
      case 'section_header':
        return (
          <div key={field.id} className="col-span-full mt-4 first:mt-0">
            <h3 className="text-lg font-medium">{field.label}</h3>
            <Separator className="my-2" />
          </div>
        )

      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_key}>
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Input
              id={field.field_key}
              value={value}
              onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
              placeholder={field.placeholder}
              disabled={readOnly}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="col-span-full space-y-2">
            <Label htmlFor={field.field_key}>
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.field_key}
              value={value}
              onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              disabled={readOnly}
            />
          </div>
        )

      case 'select':
        const options = (field.options as string[]) || []
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_key}>
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.field_key, val)}
              disabled={readOnly}
            >
              <SelectTrigger id={field.field_key}>
                <SelectValue placeholder={field.placeholder || 'Selecione...'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'scale':
        return (
          <div key={field.id} className="space-y-4">
            <Label>
              {field.label} (0-10)
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <RadioGroup
              value={value?.toString()}
              onValueChange={(val) => handleFieldChange(field.field_key, parseInt(val))}
              className="flex flex-wrap gap-2"
              disabled={readOnly}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <div key={num} className="flex flex-col items-center gap-1">
                  <RadioGroupItem
                    value={num.toString()}
                    id={`${field.field_key}-${num}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`${field.field_key}-${num}`}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary"
                  >
                    {num}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case 'multiselect':
        const multiOptions = (field.options as string[]) || []
        const currentValues = (value as string[]) || []
        
        return (
          <div key={field.id} className="col-span-full space-y-3">
            <Label>
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {multiOptions.map((opt) => (
                <div key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.field_key}-${opt}`}
                    checked={currentValues.includes(opt)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...currentValues, opt]
                        : currentValues.filter((v) => v !== opt)
                      handleFieldChange(field.field_key, newValues)
                    }}
                    disabled={readOnly}
                  />
                  <Label
                    htmlFor={`${field.field_key}-${opt}`}
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const sortedFields = [...(template.fields || [])].sort(
    (a, b) => a.display_order - b.display_order
  )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {sortedFields.map((field) => renderField(field))}
    </div>
  )
}
