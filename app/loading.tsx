"use client"
import React from 'react'
import { Package } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo Container */}
        <div className="relative mb-6">
          {/* Pulsing ring */}
          <div className="absolute inset-0 w-20 h-20 mx-auto rounded-2xl bg-jeffy-yellow/50 animate-pulse-ring" />
          
          {/* Logo box */}
          <div className="relative w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center mx-auto animate-float">
            <Package className="w-10 h-10 text-jeffy-yellow" />
          </div>
        </div>
        
        {/* Brand Text */}
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Jeffy</h2>
        <p className="text-slate-600 font-medium mb-6">Loading amazing products...</p>
        
        {/* Loading dots */}
        <div className="flex justify-center gap-1.5 loading-dots">
          <span className="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>
          <span className="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>
          <span className="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>
        </div>
      </div>
    </div>
  )
}
