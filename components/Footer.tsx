'use client'

import React from 'react'
import Link from 'next/link'
import { Facebook, Instagram, MessageCircle, Video, Mail, Phone, MapPin } from 'lucide-react'
import { socialMediaConfig } from '@/lib/config/social-media'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-jeffy-grey text-white mt-auto">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-jeffy-yellow">About Jeffy</h3>
            <p className="text-gray-300 mb-4">
              Your one-stop shop for quality products. We bring you the best in gym equipment, 
              camping gear, kitchen essentials, and beauty products - all at great prices.
            </p>
            <p className="text-sm text-gray-400">
              Based in Johannesburg, South Africa
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-jeffy-yellow">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-jeffy-yellow transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-jeffy-yellow transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/coming-soon" className="text-gray-300 hover:text-jeffy-yellow transition-colors">
                  Coming Soon
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-jeffy-yellow">Connect With Us</h3>
            <div className="space-y-3 mb-6">
              {socialMediaConfig.whatsapp.number && (
                <a
                  href={socialMediaConfig.whatsapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-300 hover:text-jeffy-yellow transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp: {socialMediaConfig.whatsapp.number}</span>
                </a>
              )}
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-5 h-5" />
                <span>Johannesburg, South Africa</span>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-4">
              <a
                href={socialMediaConfig.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={socialMediaConfig.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={socialMediaConfig.tiktok.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                aria-label="TikTok"
              >
                <Video className="w-5 h-5" />
              </a>
              {socialMediaConfig.whatsapp.number && (
                <a
                  href={socialMediaConfig.whatsapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} Jeffy - In a Jiffy. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Made with ❤️ in Johannesburg, South Africa
          </p>
        </div>
      </div>
    </footer>
  )
}

