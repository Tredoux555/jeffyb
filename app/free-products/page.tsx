'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { JeffyWantForm } from '@/components/JeffyWantForm'
import { 
  Gift, 
  Users, 
  Share2, 
  CheckCircle,
  ArrowDown,
  Sparkles,
  TrendingUp,
  Heart,
  Package
} from 'lucide-react'
import { JeffyExplainerAnimation } from '@/components/JeffyExplainerAnimation'

interface PopularRequest {
  id: string
  request_text: string
  requester_name: string
  referral_code: string
  approvals_received: number
  approvals_needed: number
  status: string
  created_at: string
}

export default function FreeProductsPage() {
  const [popularRequests, setPopularRequests] = useState<PopularRequest[]>([])

  useEffect(() => {
    fetchPopularRequests()
  }, [])

  const fetchPopularRequests = async () => {
    try {
      const response = await fetch('/api/jeffy-wants?type=popular&limit=6')
      const data = await response.json()
      if (data.success) {
        setPopularRequests(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching popular requests:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow via-yellow-400 to-amber-100">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 px-4 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/20 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-yellow-300/50 rounded-full blur-lg" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-8">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-6 animate-bounce">
              <Gift className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-slate-900">Get Products FREE!</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-4">
              Tell Jeffy What You{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                WANT
              </span>
            </h1>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto mb-8">
              Share your link with 10 friends who agree it's a good idea,
              and Jeffy will give you the product <strong>completely FREE!</strong>
            </p>
          </div>

          {/* Animated Explainer */}
          <div className="max-w-3xl mx-auto mb-12">
            <JeffyExplainerAnimation />
          </div>

          {/* How It Works Steps */}
          <div className="flex justify-center mb-8">
            <ArrowDown className="w-8 h-8 text-slate-600 animate-bounce" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 bg-white/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                icon: Package,
                title: 'Tell Jeffy',
                description: 'Describe the product you want - speak or type!'
              },
              {
                step: 2,
                icon: Share2,
                title: 'Get Your Link',
                description: 'Receive a unique link to share with friends'
              },
              {
                step: 3,
                icon: Users,
                title: 'Share & Collect',
                description: 'Get 10 friends to approve your idea'
              },
              {
                step: 4,
                icon: Gift,
                title: 'Get It FREE!',
                description: 'Your product ships to you at no cost!'
              }
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-jeffy-yellow rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon className="w-8 h-8 text-slate-900" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-16 px-4" id="form">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full mb-4">
              <Sparkles className="w-5 h-5 text-jeffy-yellow" />
              <span className="font-semibold">Start Here</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              What Product Do You Want?
            </h2>
            <p className="text-slate-600">
              Type or speak your request below. Be specific about what you're looking for!
            </p>
          </div>

          <JeffyWantForm />
        </div>
      </section>

      {/* Popular Requests */}
      {popularRequests.length > 0 && (
        <section className="py-16 px-4 bg-white/50">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full mb-4">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Trending Requests</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                What Others Are Looking For
              </h2>
              <p className="text-slate-600">
                Join in and help others get their products FREE!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularRequests.map((request) => (
                <Link key={request.id} href={`/want/${request.referral_code}`}>
                  <Card className="p-4 hover:shadow-lg transition-all h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-jeffy-yellow/20 rounded-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-jeffy-yellow" />
                        </div>
                        <span className="text-sm text-slate-500">
                          {request.requester_name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-semibold text-slate-900">
                          {request.approvals_received}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-900 font-medium line-clamp-2 mb-3">
                      "{request.request_text}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-jeffy-yellow h-2 rounded-full"
                          style={{ width: `${(request.approvals_received / request.approvals_needed) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 ml-2 whitespace-nowrap">
                        {request.approvals_received}/{request.approvals_needed}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Is this really free?",
                a: "Yes! If 10 of your friends approve your request, you get the product completely free. We ship it to you at no cost."
              },
              {
                q: "How does Jeffy afford this?",
                a: "When enough people show interest in a product, we source it directly and add it to our store. The viral exposure helps us grow, and we reward early supporters with free products!"
              },
              {
                q: "What happens after I get 10 approvals?",
                a: "We'll email you to collect your shipping address. Your free product will be shipped within 2-4 weeks depending on sourcing."
              },
              {
                q: "Can my friends also get free products?",
                a: "Absolutely! When they approve your request, they can choose to create their own link and get the same product free too."
              },
              {
                q: "What products can I request?",
                a: "Almost anything! Describe what you're looking for - the more specific, the better. We specialize in quality products at fair prices."
              }
            ].map((item, index) => (
              <Card key={index} className="p-6">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  {item.q}
                </h3>
                <p className="text-slate-600 ml-7">{item.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Your FREE Product?
          </h2>
          <p className="text-slate-300 mb-8">
            It takes less than a minute to create your request. What are you waiting for?
          </p>
          <a href="#form">
            <Button size="lg" className="bg-jeffy-yellow text-slate-900 hover:bg-yellow-400">
              <Sparkles className="w-5 h-5 mr-2" />
              Tell Jeffy What You Want
            </Button>
          </a>
        </div>
      </section>
    </div>
  )
}

