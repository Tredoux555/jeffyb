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
  Package,
  Search,
  Target,
  Percent
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

export default function JeffyWantsPage() {
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
              <Search className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-slate-900">We Only Stock What YOU Want!</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-4">
              Tell Jeffy What You{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                WANT
              </span>
            </h1>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto mb-4">
              Can't find what you're looking for at a fair price?
              <br />
              <strong>Tell me.</strong> I'll source it for you.
            </p>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              If 10 people agree it's a good idea, I'll stock it and 
              <span className="text-amber-600 font-bold"> YOU get it at 50% off</span> (my cost price)!
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

      {/* How It Works - Reframed */}
      <section className="py-12 px-4 bg-white/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            I don't guess what to sell. <strong>You tell me what you need</strong>, and if there's demand, I stock it.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                icon: Search,
                title: 'Tell Me What You Want',
                description: 'Describe the product you\'ve been looking for'
              },
              {
                step: 2,
                icon: Share2,
                title: 'Share Your Link',
                description: 'Send it to friends who might want it too'
              },
              {
                step: 3,
                icon: Target,
                title: 'Prove The Demand',
                description: '10 people agree = I\'ll source & stock it'
              },
              {
                step: 4,
                icon: Percent,
                title: 'Get 50% Off!',
                description: 'As thanks, you get it at my cost price'
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

      {/* Why This Works - Business Model Explanation */}
      <section className="py-12 px-4 bg-slate-900 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Why 50% Off?
              </h2>
              <p className="text-slate-300 mb-4">
                Most shops guess what you want, buy stock, and hope it sells.
                <strong className="text-white"> I do the opposite.</strong>
              </p>
              <p className="text-slate-300 mb-4">
                You tell me what you want. When 10 people agree, I KNOW there's demand. 
                That's valuable market research you're giving me for free.
              </p>
              <p className="text-amber-400 font-semibold">
                50% off (my cost price) is my thank you for helping me build 
                a store that sells what people actually want.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">No wasted inventory</span>
                </div>
                <p className="text-slate-400 text-sm">I only stock what people want</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">Lower prices for everyone</span>
                </div>
                <p className="text-slate-400 text-sm">No guesswork = better deals</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">You shape the store</span>
                </div>
                <p className="text-slate-400 text-sm">Every request helps me serve you better</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-16 px-4" id="form">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full mb-4">
              <Sparkles className="w-5 h-5 text-jeffy-yellow" />
              <span className="font-semibold">Tell Me What You Want</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              What Have You Been Looking For?
            </h2>
            <p className="text-slate-600">
              Type or speak your request. Be specific - what's the product? What's wrong with what's out there?
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
                <span className="font-semibold">What People Are Looking For</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Products In Demand
              </h2>
              <p className="text-slate-600">
                These are real requests from real people. Vote if you want it too!
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

      {/* FAQ Section - Reframed */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Why only 50% off and not free?",
                a: "50% off is my cost price - I make no profit, but I don't lose money either. This way I can keep doing this sustainably. If 1000 people want something, I can actually afford to stock it!"
              },
              {
                q: "Why do I need 10 people to agree?",
                a: "10 approvals proves there's real demand. I'm not guessing what to sell - I'm only stocking products people actually want. Your 10 friends validate that it's worth sourcing."
              },
              {
                q: "What happens after 10 people approve?",
                a: "I'll source the product and add it to the store. You'll get a 50% off code to use at checkout. Your friends who approved can also buy it (they get 30% off for helping!)."
              },
              {
                q: "What if the product I want is already in stock?",
                a: "Even better! If we have it, you still get 50% off when your request hits 10 approvals. The system rewards demand validation regardless."
              },
              {
                q: "Can I request anything?",
                a: "Almost! Describe what you're looking for - the more specific, the better. I specialize in quality products at fair prices. If I can source it, I will."
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
            What Have You Been Looking For?
          </h2>
          <p className="text-slate-300 mb-8">
            Help me build a store that sells what people actually want. 
            Tell me what you need - if 10 people agree, you get it at half price.
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
