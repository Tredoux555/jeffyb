'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { createClient } from '@/lib/supabase'
import { Category } from '@/types/database'
import { Package, Sparkles, Zap, ArrowRight, Truck, Shield, Star } from 'lucide-react'
import { getIconComponent } from '@/lib/utils/icons'

// Color mapping for categories
const colorMap: Record<string, string> = {
  'gym': 'from-blue-500 to-blue-600',
  'camping': 'from-green-500 to-green-600',
  'kitchen': 'from-orange-500 to-orange-600',
  'beauty': 'from-pink-500 to-pink-600',
  'baby-toys': 'from-purple-500 to-purple-600',
  'archery': 'from-red-500 to-red-600',
}

const solidColorMap: Record<string, string> = {
  'gym': 'bg-blue-500',
  'camping': 'bg-green-500',
  'kitchen': 'bg-orange-500',
  'beauty': 'bg-pink-500',
  'baby-toys': 'bg-purple-500',
  'archery': 'bg-red-500',
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow via-yellow-400 to-amber-100 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-300/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-56 h-56 bg-amber-200/50 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-yellow-200/60 rounded-full blur-xl" />
      </div>

      {/* Hero Section */}
      <div className="relative container mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
        <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg mb-6 border border-yellow-200">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-slate-700">Quality Products, Lightning Fast</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-4 tracking-tight text-shadow">
            <span className="text-slate-900">Welcome to</span>
            <br />
            <span className="gradient-text">Jeffy</span>
          </h1>

          {/* Tagline */}
          <p className="text-2xl sm:text-3xl text-slate-800 font-semibold mb-2 flex items-center justify-center gap-2">
            In a Jiffy <Zap className="w-7 h-7 text-amber-500 animate-pulse" />
          </p>
          <p className="text-slate-600 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Premium gym equipment, camping gear, kitchen essentials & more – 
            all at prices that make sense.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-10">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-sm sm:text-base">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-sm sm:text-base">Quality Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-sm sm:text-base">Top Rated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="relative container mx-auto px-4 sm:px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Shop by Category
            </h2>
            <p className="text-slate-600">Find exactly what you need</p>
          </div>
          
          {/* Categories Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 stagger-children">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-card animate-pulse">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gray-200"></div>
                  <div className="h-5 bg-gray-200 rounded mb-2 mx-auto w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded mx-auto w-1/2"></div>
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 stagger-children">
              {categories.map((category) => {
                const IconComponent = getIconComponent(category.icon)
                const gradient = colorMap[category.slug] || 'from-gray-500 to-gray-600'
                const solidColor = solidColorMap[category.slug] || 'bg-gray-500'
                
                return (
                  <Link key={category.id} href={`/products/category/${category.slug}`}>
                    <div className="group relative bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
                      {/* Hover gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                      
                      <div className="relative text-center">
                        {/* Icon Container */}
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                          <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </div>
                        
                        {/* Category Name */}
                        <h3 className="font-bold text-slate-900 group-hover:text-slate-700 transition-colors mb-2">
                          {category.name}
                        </h3>
                        
                        {/* Shop Link */}
                        <div className="flex items-center justify-center gap-1 text-sm text-slate-500 group-hover:text-amber-600 transition-colors">
                          <span>Shop now</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="text-center py-12" padding="lg">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Categories Available</h3>
              <p className="text-slate-600">Check back soon for new products!</p>
            </Card>
          )}

          {/* View All Products Link */}
          {categories.length > 0 && (
            <div className="text-center mt-10">
              <Link 
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-button hover:shadow-button-hover"
              >
                <Package className="w-5 h-5" />
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
