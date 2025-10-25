import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Dumbbell, Tent, ChefHat, Sparkles } from 'lucide-react'

const categories = [
  {
    name: 'Gym',
    slug: 'gym',
    icon: Dumbbell,
    description: 'Fitness equipment and accessories',
    color: 'bg-blue-500'
  },
  {
    name: 'Camping',
    slug: 'camping',
    icon: Tent,
    description: 'Outdoor gear and essentials',
    color: 'bg-green-500'
  },
  {
    name: 'Kitchen',
    slug: 'kitchen',
    icon: ChefHat,
    description: 'Cooking tools and appliances',
    color: 'bg-orange-500'
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    icon: Sparkles,
    description: 'Skincare and beauty products',
    color: 'bg-pink-500'
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to Jeffy
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-2">
            Your trusted commerce platform
          </p>
          <p className="text-lg text-gray-600 font-medium">
            Jeffy in a Jiffy
          </p>
        </div>
        
        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link key={category.slug} href={`/products/${category.slug}`}>
                <Card className="text-center hover:shadow-jeffy-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {category.description}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
        
        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to Shop?
            </h2>
            <p className="text-gray-600 mb-6">
              Browse our wide selection of products across all categories. 
              Fast delivery, great prices, and excellent customer service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Browse All Products
                </Button>
              </Link>
              <Link href="/delivery">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Request Delivery
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
