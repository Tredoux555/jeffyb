import React from 'react'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  className?: string
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className={cn('min-h-screen bg-jeffy-yellow', className)}>
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}
