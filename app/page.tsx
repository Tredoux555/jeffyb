import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Dumbbell, Tent, ChefHat, Sparkles, ArrowLeftRight, Baby } from 'lucide-react'

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
  },
  {
    name: 'Baby Toys',
    slug: 'baby-toys',
    icon: Baby,
    description: 'Safe and fun toys for babies',
    color: 'bg-purple-500'
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      {/* Hero Section */}
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
            Welcome to Jeffy
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-2">
            Your trusted commerce platform
          </p>
          <p className="text-base sm:text-lg text-gray-600 font-medium">
            Jeffy in a Jiffy
          </p>
        </div>
        
        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 mb-8 sm:mb-12">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link key={category.slug} href={`/products/${category.slug}`}>
                <Card className="text-center hover:shadow-jeffy-lg transition-all duration-300 sm:hover:scale-105 cursor-pointer group p-3 sm:p-4">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full ${category.color} flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {category.description}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
        
        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Ready to Shop?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Browse our wide selection of products across all categories. 
              Fast delivery, great prices, and excellent customer service.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                  Browse All Products
                </Button>
              </Link>
              <Link href="/delivery">
                <Button variant="outline" size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base">
                  Send <ArrowLeftRight className="w-4 h-4" /> Receive
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
