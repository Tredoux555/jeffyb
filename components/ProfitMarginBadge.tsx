import React from 'react'

interface ProfitMarginBadgeProps {
  margin: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function ProfitMarginBadge({ margin, size = 'md', showIcon = false }: ProfitMarginBadgeProps) {
  const getColor = () => {
    if (margin >= 30) return 'text-green-600 bg-green-50'
    if (margin >= 15) return 'text-blue-600 bg-blue-50'
    if (margin >= 0) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5'
      case 'lg':
        return 'text-base px-4 py-2'
      default:
        return 'text-sm px-3 py-1'
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${getColor()} ${getSizeClasses()}`}>
      {showIcon && margin >= 0 && <span>↑</span>}
      {showIcon && margin < 0 && <span>↓</span>}
      {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
    </span>
  )
}

