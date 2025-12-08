'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { 
  Mic, 
  MicOff, 
  Send, 
  Image as ImageIcon, 
  Link as LinkIcon,
  X,
  Loader2,
  CheckCircle,
  Sparkles,
  Package
} from 'lucide-react'

interface JeffyWantFormProps {
  onSuccess?: (data: { referral_code: string; shareable_link: string }) => void
  className?: string
}

export function JeffyWantForm({ onSuccess, className }: JeffyWantFormProps) {
  const [formData, setFormData] = useState({
    request_text: '',
    requester_name: '',
    requester_email: '',
    requester_phone: ''
  })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [referenceLinks, setReferenceLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ referral_code: string; shareable_link: string } | null>(null)
  const [error, setError] = useState('')
  
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          if (finalTranscript) {
            setFormData(prev => ({
              ...prev,
              request_text: prev.request_text + ' ' + finalTranscript
            }))
            setTranscript(finalTranscript)
          }
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)
        }
        
        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please type your request instead.')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // For now, we'll just use placeholder - in production, upload to Supabase storage
    // This is a simplified version
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageUrls(prev => [...prev, e.target?.result as string])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const addLink = () => {
    if (newLink && newLink.startsWith('http')) {
      setReferenceLinks(prev => [...prev, newLink])
      setNewLink('')
    }
  }

  const removeLink = (index: number) => {
    setReferenceLinks(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/jeffy-wants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          voice_transcript: transcript || null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          reference_links: referenceLinks.length > 0 ? referenceLinks : null
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setResult({
        referral_code: data.data.referral_code,
        shareable_link: data.data.shareable_link
      })

      if (onSuccess) {
        onSuccess({
          referral_code: data.data.referral_code,
          shareable_link: data.data.shareable_link
        })
      }

    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Success state - show shareable link
  if (result) {
    return (
      <Card className={`p-6 sm:p-8 ${className}`}>
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            🎉 Your Link is Ready!
          </h3>
          <p className="text-slate-600 mb-6">
            Share this link with 10 friends to get <span className="font-bold text-amber-600">50% OFF</span> any product!
          </p>

          {/* Shareable Link */}
          <div className="bg-slate-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500 mb-2">Your unique link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={result.shareable_link}
                className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-mono text-sm"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(result.shareable_link)
                  alert('Link copied!')
                }}
                className="shrink-0"
              >
                Copy
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Share on:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hey! I found something I want to get at 50% OFF! If you think it's a good idea, click my link - you'll also get 30% off your first order! ${result.shareable_link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(result.shareable_link)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Found something cool! Help me get 50% off - you'll get 30% off too: ${result.shareable_link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
              >
                X/Twitter
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent('Check this out - 50% off!')}&body=${encodeURIComponent(`Hey! I found something cool at Jeffy. If you think it's a good idea, click my link - I'll get 50% off and you'll get 30% off your first order! ${result.shareable_link}`)}`}
                className="px-4 py-2 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Email
              </a>
            </div>
          </div>

          {/* Progress tracker link */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3">
              Track your progress:
            </p>
            <a
              href={`/want/${result.referral_code}/status`}
              className="text-jeffy-yellow hover:underline font-medium"
            >
              View Approval Status →
            </a>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 sm:p-8 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-jeffy-yellow rounded-xl flex items-center justify-center">
          <Package className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">What do YOU want?</h3>
          <p className="text-sm text-slate-600">Tell Jeffy what product you're looking for</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Main request input with voice */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Describe what you want *
          </label>
          <div className="relative">
            <textarea
              value={formData.request_text}
              onChange={(e) => setFormData({ ...formData, request_text: e.target.value })}
              placeholder="I want a mobile air pump I can keep in my car that also works as a jump starter..."
              className="w-full px-4 py-3 pr-14 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-jeffy-yellow focus:bg-white focus:ring-4 focus:ring-yellow-100 transition-all min-h-[120px] resize-none"
              required
            />
            <button
              type="button"
              onClick={toggleRecording}
              className={`absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          {isRecording && (
            <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Recording... Speak now!
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Add images (optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-jeffy-yellow hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-5 h-5" />
            Click to upload images
          </button>
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reference Links */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Add reference links (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://example.com/product"
              className="flex-1 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-jeffy-yellow"
            />
            <Button type="button" variant="outline" onClick={addLink}>
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>
          {referenceLinks.length > 0 && (
            <div className="space-y-2 mt-3">
              {referenceLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600 truncate flex-1">{link}</span>
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Your Name *"
            value={formData.requester_name}
            onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
            placeholder="John Doe"
            required
          />
          <Input
            label="Your Email *"
            type="email"
            value={formData.requester_email}
            onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
            placeholder="john@example.com"
            required
          />
        </div>

        <Input
          label="Phone Number (optional)"
          type="tel"
          value={formData.requester_phone}
          onChange={(e) => setFormData({ ...formData, requester_phone: e.target.value })}
          placeholder="+27 12 345 6789"
        />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting || !formData.request_text || !formData.requester_name || !formData.requester_email}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating your link...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Get My 50% OFF Link
            </>
          )}
        </Button>

        <p className="text-xs text-center text-slate-500">
          Share your link with 10 friends who agree it's a good idea, and get 50% OFF any product!
        </p>
      </form>
    </Card>
  )
}

