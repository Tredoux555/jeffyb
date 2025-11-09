'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { createClient } from '@/lib/supabase'
import { Category } from '@/types/database'
import { ArrowLeftRight } from 'lucide-react'
import { getIconComponent } from '@/lib/utils/icons'

// Color mapping (can be stored in database later if needed)
const colorMap: Record<string, string> = {
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
      // Fallback to empty array - page will show no categories
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      {/* Hero Section */}
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
            Welcome to Jeffy
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-medium">
            Jeffy in a Jiffy
          </p>
          {/* Send / Receive functionality hidden temporarily - can be restored later by setting SHOW_SEND_RECEIVE to true */}
          {false && (
            <div className="mt-4 sm:mt-6">
              <Card className="max-w-xl sm:max-w-2xl mx-auto p-4 sm:p-6 bg-white">
                {/* Green box wrapping the Send / Receive text */}
                <div className="flex justify-center">
                  <Link href="/delivery" className="inline-block">
                    <div className="px-4 sm:px-6 py-2 sm:py-3 rounded-md bg-green-500 text-black font-semibold inline-flex items-center gap-2">
                      <span>Send</span>
                      <ArrowLeftRight className="w-4 h-4 text-black" />
                      <span>Receive</span>
                    </div>
                  </Link>
                </div>
                {/* Promo line under the CTA inside the same white box */}
                <div className="mt-3 sm:mt-4 text-center">
                  <p className="text-sm sm:text-base text-gray-700 w-[40ch] mx-auto">
                    Send or Recieve a package in town for R20
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
        
        {/* Call to Action moved into hero above */}

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 mb-8 sm:mb-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-3 sm:p-4 animate-pulse">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-300"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 mb-8 sm:mb-12">
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon)
              const color = colorMap[category.slug] || 'bg-gray-500'
              return (
                <Link key={category.id} href={`/products/category/${category.slug}`}>
                  <Card className="text-center hover:shadow-jeffy-lg transition-all duration-300 sm:hover:scale-105 cursor-pointer group p-3 sm:p-4">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full ${color} flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                      {category.name}
                    </h3>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
