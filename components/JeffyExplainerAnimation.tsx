'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface Slide {
  id: number
  title: string
  subtitle: string
  dialogue: string
  speaker: 'jeffy' | 'thabo'
  bgColor: string
  duration: number // milliseconds
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Hi! I'm Jeffy!",
    subtitle: "And I want to know what YOU want!",
    dialogue: "Hi! I'm Jeffy! And I want to know what YOU want!",
    speaker: 'jeffy',
    bgColor: 'from-yellow-400 to-amber-500',
    duration: 5000,
  },
  {
    id: 2,
    title: "FREE!",
    subtitle: "Get products at ZERO cost!",
    dialogue: "...And I want to give it to you... FOR FREE!",
    speaker: 'jeffy',
    bgColor: 'from-orange-400 to-red-500',
    duration: 4000,
  },
  {
    id: 3,
    title: "The Problem",
    subtitle: "Finding quality at the right price is hard",
    dialogue: "I just want something that WORKS... but isn't crazy overpriced.",
    speaker: 'thabo',
    bgColor: 'from-slate-600 to-slate-800',
    duration: 6000,
  },
  {
    id: 4,
    title: "Share With Friends",
    subtitle: "10 friends = FREE product!",
    dialogue: "Send your link to 10 friends. They approve it... and YOU get it FREE!",
    speaker: 'jeffy',
    bgColor: 'from-emerald-400 to-teal-600',
    duration: 6000,
  },
  {
    id: 5,
    title: "What Do YOU Want?",
    subtitle: "Tell Jeffy below! ⬇️",
    dialogue: "So... what do YOU want? Tell me below!",
    speaker: 'jeffy',
    bgColor: 'from-yellow-400 to-amber-500',
    duration: 4000,
  },
]

export function JeffyExplainerAnimation() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
    setProgress(0)
  }, [])

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1)
    } else {
      setIsPlaying(false)
      setHasStarted(false)
      goToSlide(0)
    }
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1)
    }
  }, [currentSlide, goToSlide])

  const startAnimation = () => {
    setHasStarted(true)
    setIsPlaying(true)
    setCurrentSlide(0)
    setProgress(0)
  }

  const togglePlay = () => {
    if (!hasStarted) {
      startAnimation()
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  // Auto-advance slides
  useEffect(() => {
    if (!isPlaying) return

    const slide = slides[currentSlide]
    const interval = 50 // Update progress every 50ms
    const increment = (interval / slide.duration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide()
          return 0
        }
        return prev + increment
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, currentSlide, nextSlide])

  const slide = slides[currentSlide]

  // Start screen
  if (!hasStarted) {
    return (
      <div 
        className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden cursor-pointer group"
        onClick={startAnimation}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full animate-pulse" />
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-yellow-400/10 rounded-full animate-pulse delay-300" />
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-400/15 rounded-full animate-pulse delay-500" />
        </div>

        {/* Jeffy character placeholder */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end justify-center gap-4">
          {/* Jeffy */}
          <div className="relative animate-bounce-slow">
            <div className="w-28 h-36 sm:w-36 sm:h-44 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-full flex flex-col items-center justify-center shadow-2xl">
              {/* Eyes */}
              <div className="flex gap-3 mb-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-slate-900 rounded-full animate-look" />
                </div>
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-slate-900 rounded-full animate-look" />
                </div>
              </div>
              {/* Smile */}
              <div className="w-8 sm:w-10 h-3 sm:h-4 border-b-4 border-slate-800 rounded-b-full" />
              {/* Cap */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-6 sm:h-8 bg-slate-800 rounded-t-full" />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-2 sm:h-3 bg-slate-900 rounded-full" />
            </div>
            {/* Arms waving */}
            <div className="absolute top-16 sm:top-20 -left-6 sm:-left-8 w-6 sm:w-8 h-14 sm:h-16 bg-yellow-400 rounded-full origin-top animate-wave" />
            <div className="absolute top-16 sm:top-20 -right-6 sm:-right-8 w-6 sm:w-8 h-14 sm:h-16 bg-yellow-400 rounded-full origin-top animate-wave-reverse" />
          </div>
        </div>

        {/* Title */}
        <div className="absolute top-8 sm:top-12 left-0 right-0 text-center">
          <p className="text-yellow-400/80 text-xs sm:text-sm mb-1">Watch how it works</p>
          <h2 className="text-white text-2xl sm:text-4xl font-bold">Meet Jeffy! 👋</h2>
        </div>

        {/* Play button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 text-slate-900 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Duration label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <span className="text-white/60 text-xs sm:text-sm">25 seconds</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor} transition-all duration-700`} />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content based on slide */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 sm:p-8 text-white">
        {/* Slide 1 & 5: Jeffy waving */}
        {(slide.id === 1 || slide.id === 5) && (
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2">
            <div className="relative animate-bounce-slow">
              <div className="w-20 h-24 sm:w-28 sm:h-32 bg-gradient-to-b from-yellow-300 to-yellow-400 rounded-t-full flex flex-col items-center justify-center shadow-xl">
                <div className="flex gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-slate-900 rounded-full" />
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-slate-900 rounded-full" />
                  </div>
                </div>
                <div className="w-6 sm:w-8 h-2 sm:h-3 border-b-3 sm:border-b-4 border-slate-800 rounded-b-full" />
                <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 w-10 sm:w-14 h-5 sm:h-6 bg-slate-800 rounded-t-full" />
              </div>
              <div className="absolute top-12 sm:top-16 -left-4 sm:-left-6 w-4 sm:w-6 h-10 sm:h-12 bg-yellow-400 rounded-full origin-top animate-wave" />
              <div className="absolute top-12 sm:top-16 -right-4 sm:-right-6 w-4 sm:w-6 h-10 sm:h-12 bg-yellow-400 rounded-full origin-top animate-wave-reverse" />
            </div>
          </div>
        )}

        {/* Slide 2: FREE explosion */}
        {slide.id === 2 && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 sm:w-6 sm:h-6 bg-yellow-300 rounded-full animate-explode"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    transform: `rotate(${i * 45}deg) translateY(-60px)`,
                  }}
                />
              ))}
            </div>
            {/* Confetti */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 sm:w-3 sm:h-3 rounded-sm animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#FCD34D', '#F97316', '#EF4444', '#22C55E', '#3B82F6'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </>
        )}

        {/* Slide 3: Thabo thinking */}
        {slide.id === 3 && (
          <div className="absolute bottom-4 sm:bottom-8 right-8 sm:right-16">
            <div className="relative">
              {/* Thought bubble */}
              <div className="absolute -top-20 sm:-top-28 -left-8 sm:-left-12 w-24 h-16 sm:w-32 sm:h-20 bg-white rounded-2xl flex items-center justify-center animate-pulse">
                <span className="text-xl sm:text-2xl">🚗💰❓</span>
                <div className="absolute -bottom-2 left-4 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full" />
                <div className="absolute -bottom-5 left-2 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full" />
              </div>
              {/* Person */}
              <div className="w-16 h-20 sm:w-20 sm:h-24 bg-blue-500 rounded-t-full flex flex-col items-center justify-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-700 rounded-full mb-1" />
                <div className="w-4 sm:w-5 h-1 sm:h-1.5 bg-slate-800 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Slide 4: Share visualization */}
        {slide.id === 4 && (
          <div className="absolute bottom-8 sm:bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4">
            {/* Link icon */}
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-xl flex items-center justify-center animate-pulse shadow-lg">
              <span className="text-lg sm:text-2xl">🔗</span>
            </div>
            {/* Arrow */}
            <div className="text-white text-xl sm:text-2xl animate-bounce-horizontal">→</div>
            {/* Friends */}
            <div className="flex -space-x-2 sm:-space-x-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 rounded-full border-2 border-white flex items-center justify-center text-xs sm:text-sm animate-pop"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  👤
                </div>
              ))}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs sm:text-sm font-bold text-white animate-pop" style={{ animationDelay: '0.75s' }}>
                +5
              </div>
            </div>
            {/* Arrow */}
            <div className="text-white text-xl sm:text-2xl animate-bounce-horizontal">→</div>
            {/* FREE badge */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-spin-slow">
              <span className="text-slate-900 font-bold text-xs sm:text-sm">FREE!</span>
            </div>
          </div>
        )}

        {/* Text content */}
        <div className="text-center z-10">
          <h2 
            className={`text-3xl sm:text-5xl md:text-6xl font-bold mb-2 sm:mb-4 animate-slide-up ${slide.id === 2 ? 'text-yellow-300 animate-scale-pulse' : ''}`}
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
          >
            {slide.title}
          </h2>
          <p className="text-base sm:text-xl md:text-2xl opacity-90 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {slide.subtitle}
          </p>
        </div>

        {/* Speech bubble */}
        <div className="absolute bottom-20 sm:bottom-24 left-4 right-4 sm:left-8 sm:right-8">
          <div className={`inline-block max-w-md mx-auto px-4 py-2 sm:px-6 sm:py-3 rounded-2xl ${slide.speaker === 'jeffy' ? 'bg-yellow-400 text-slate-900' : 'bg-blue-500 text-white'} shadow-lg animate-fade-in`}>
            <p className="text-xs sm:text-sm md:text-base font-medium">"{slide.dialogue}"</p>
            <span className="text-[10px] sm:text-xs opacity-70 mt-1 block">
              — {slide.speaker === 'jeffy' ? 'Jeffy' : 'Thabo'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
        <div 
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-5 sm:w-6' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-8 h-8 sm:w-10 sm:h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
        <button
          onClick={togglePlay}
          className="w-8 h-8 sm:w-10 sm:h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
        disabled={currentSlide === 0}
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  )
}

