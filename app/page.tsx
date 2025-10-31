import Link from 'next/link'
import { Card } from '@/components/Card'
import { Dumbbell, Tent, ChefHat, Sparkles, ArrowLeftRight, Baby, Target } from 'lucide-react'

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
  },
  {
    name: 'Archery',
    slug: 'archery',
    icon: Target,
    description: 'Bows, arrows, and archery equipment',
    color: 'bg-red-500'
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
          <p className="text-base sm:text-lg text-gray-600 font-medium">
            Jeffy in a Jiffy
          </p>
          {/* White container that wraps the CTA and the two lines */}
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
                  Send or Recieve small packages within town for just R20 (within reason)
                </p>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Call to Action moved into hero above */}

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 mb-8 sm:mb-12">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link key={category.slug} href={`/products/category/${category.slug}`}>
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
      </div>
    </div>
  )
}
