"use client"
import React from 'react'
import Link from 'next/link'
import { Package } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      {/* Top bar with animated cube next to Jeffy */}
      <div className="bg-jeffy-grey shadow-jeffy">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <Package className="w-8 h-8 text-green-500 animate-[spin_3s_linear_infinite]" />
              </div>
              <span className="text-xl font-bold text-white">Jeffy</span>
              <span className="text-sm text-jeffy-yellow-light">in a Jiffy</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Centered subtle message */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <p className="text-gray-800 font-medium">Loading…</p>
        </div>
      </div>

    </div>
  )
}


