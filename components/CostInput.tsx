import React from 'react'
import { Input } from './Input'

interface CostInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
}

export function CostInput({ 
  value, 
  onChange, 
  label = 'Cost per Unit',
  helperText = 'Product cost for profit calculation',
  required = false,
  disabled = false
}: CostInputProps) {
  return (
    <Input
      label={label}
      type="number"
      step="0.01"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0.00"
      helperText={helperText}
      required={required}
      disabled={disabled}
    />
  )
}

