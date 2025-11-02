'use client'

import React from 'react'
import { Navigation } from '@/components/Navigation'
import { useCart } from '@/lib/hooks/useCart'

export function ClientNavigation() {
  const { itemCount } = useCart()

  return <Navigation cartItemCount={itemCount} />
}


