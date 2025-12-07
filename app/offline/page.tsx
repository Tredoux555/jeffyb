'use client'

import { WifiOff, RefreshCw, ShoppingCart, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/Button'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Offline Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-white rounded-full shadow-xl flex items-center justify-center">
            <WifiOff className="w-16 h-16 text-gray-400" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <span className="bg-amber-500 text-white text-sm font-medium px-4 py-1 rounded-full">
              No Connection
            </span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          It looks like you've lost your internet connection. Don't worry - your cart is saved and will sync when you're back online!
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <Button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>

          <div className="flex gap-3">
            <Link href="/cart" className="flex-1">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                View Cart
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="mt-10 p-4 bg-white/50 rounded-xl text-left">
          <h3 className="font-semibold text-gray-900 mb-2">While you're offline:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Your cart items are saved locally</li>
            <li>✓ Browse previously viewed products</li>
            <li>✓ Changes will sync when you reconnect</li>
          </ul>
        </div>

        {/* Jeffy Mascot */}
        <div className="mt-8 text-6xl animate-bounce">
          📦
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Jeffy is waiting to deliver your order!
        </p>
      </div>
    </div>
  )
}

