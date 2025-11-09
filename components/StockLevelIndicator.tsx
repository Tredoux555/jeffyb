import React from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface StockLevelIndicatorProps {
  currentStock: number
  reorderPoint: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StockLevelIndicator({ 
  currentStock, 
  reorderPoint, 
  showLabel = true,
  size = 'md'
}: StockLevelIndicatorProps) {
  const isLowStock = currentStock < reorderPoint
  const isCriticalStock = currentStock < (reorderPoint * 0.5)
  
  const getColor = () => {
    if (isCriticalStock) return 'text-red-600'
    if (isLowStock) return 'text-orange-600'
    return 'text-green-600'
  }

  const getBgColor = () => {
    if (isCriticalStock) return 'bg-red-50'
    if (isLowStock) return 'bg-orange-50'
    return 'bg-green-50'
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'lg':
        return 'text-base'
      default:
        return 'text-sm'
    }
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${getBgColor()}`}>
      {isLowStock ? (
        <AlertTriangle className={`w-4 h-4 ${getColor()}`} />
      ) : (
        <CheckCircle className={`w-4 h-4 ${getColor()}`} />
      )}
      <span className={`font-medium ${getColor()} ${getSizeClasses()}`}>
        {currentStock}
      </span>
      {showLabel && (
        <span className={`text-xs ${getColor()} opacity-75`}>
          {isCriticalStock ? 'Critical' : isLowStock ? 'Low' : 'OK'}
        </span>
      )}
    </div>
  )
}

