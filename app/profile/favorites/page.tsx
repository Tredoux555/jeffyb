'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Favorite, Product } from '@/types/database'
import { Package, Heart, ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function FavoritesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState<(Favorite & { product?: Product })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchFavorites()
  }, [user, authLoading])

  const fetchFavorites = async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('favorites')
        .select('*, product:products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFavorites((data || []) as (Favorite & { product?: Product })[])
    } catch (error) {
      console.error('Error fetching favorites:', error)
      alert('Error loading favorites')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (productId: string) => {
    if (!user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) throw error
      await fetchFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
      alert('Error removing favorite')
    }
  }

  const handleAddToCart = (product: Product) => {
    if (typeof window === 'undefined') return

    try {
      const savedCart = localStorage.getItem('jeffy-cart')
      const cart: any[] = savedCart ? JSON.parse(savedCart) : []

      const existingItem = cart.find((item) => item.product_id === product.id && !item.variant_id)

      if (existingItem) {
        existingItem.quantity += 1
      } else {
        cart.push({
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: 1,
          image_url: product.images?.[0] || product.image_url,
        })
      }

      localStorage.setItem('jeffy-cart', JSON.stringify(cart))
      
      // Trigger cart update event
      window.dispatchEvent(new Event('storage'))
      
      alert('Added to cart!')
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Error adding to cart')
    }
  }

  // Filter favorites by category
  const filteredFavorites = React.useMemo(() => {
    if (filter === 'all') return favorites
    return favorites.filter((fav) => fav.product?.category === filter)
  }, [favorites, filter])

  // Get unique categories from favorites
  const categories = React.useMemo(() => {
    const cats = new Set<string>()
    favorites.forEach((fav) => {
      if (fav.product?.category) {
        cats.add(fav.product.category)
      }
    })
    return Array.from(cats)
  }, [favorites])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-ping" />
          </div>
          <p className="text-gray-700">Loading favorites...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/profile" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-sm sm:text-base text-gray-600">{favorites.length} item{favorites.length !== 1 ? 's' : ''} saved</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        {categories.length > 0 && (
          <Card className="mb-6 sm:mb-8 p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={filter === category ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Favorites Grid */}
        {filteredFavorites.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Start adding products to your favorites list'
                : 'No favorites in this category'}
            </p>
            <Link href="/">
              <Button>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredFavorites.map((favorite) => {
              const product = favorite.product
              if (!product) return null

              const images = product.images && product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : []

              return (
                <Card key={favorite.id} className="hover:shadow-jeffy-lg transition-all duration-300 group p-3 sm:p-4">
                  <Link href={`/products/${product.id}`}>
                    <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden">
                      {images.length > 0 ? (
                        <Image
                          src={images[0]}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-jeffy-yellow-light flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No Image</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRemoveFavorite(product.id)
                          }}
                          className="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-pink-300 flex items-center justify-center transition-all hover:scale-110"
                        >
                          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                        </button>
                      </div>
                    </div>
                  </Link>
                  <div className="space-y-2">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base hover:text-jeffy-grey transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="text-lg sm:text-xl font-bold text-gray-900">
                        R{product.price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full"
                      size="sm"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
