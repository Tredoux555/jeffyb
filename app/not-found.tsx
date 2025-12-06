'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Package, Home, Search, Gift } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4">
      <Card className="p-8 sm:p-12 max-w-md text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-slate-400" />
        </div>
        
        <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          This page could not be found.
        </h2>
        <p className="text-slate-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
          
          <Link href="/free-products">
            <Button variant="outline" className="w-full">
              <Gift className="w-4 h-4 mr-2" />
              Check Out FREE Products
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-3">Popular pages:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/products" className="text-sm text-jeffy-yellow hover:underline">
              Products
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/free-products" className="text-sm text-jeffy-yellow hover:underline">
              FREE Products
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/cart" className="text-sm text-jeffy-yellow hover:underline">
              Cart
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/profile" className="text-sm text-jeffy-yellow hover:underline">
              Profile
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

