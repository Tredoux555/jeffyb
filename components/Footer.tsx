'use client'

import React from 'react'
import Link from 'next/link'
import { Facebook, Instagram, MessageCircle, Video, MapPin, Package, Mail, Phone } from 'lucide-react'
import { socialMediaConfig } from '@/lib/config/social-media'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-jeffy-yellow flex items-center justify-center shadow-md">
                <Package className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Jeffy</span>
                <span className="text-xs text-yellow-400 font-medium block -mt-0.5">in a Jiffy</span>
              </div>
            </div>
            <p className="text-slate-400 mb-4 leading-relaxed">
              Your one-stop shop for quality products. We bring you the best in gym equipment, 
              camping gear, kitchen essentials, and beauty products – all at great prices.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-jeffy-yellow" />
              <span className="text-sm">Johannesburg, South Africa</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-slate-400 hover:text-jeffy-yellow transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-jeffy-yellow rounded-full"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-slate-400 hover:text-jeffy-yellow transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-jeffy-yellow rounded-full"></span>
                  Products
                </Link>
              </li>
              <li>
                <Link href="/coming-soon" className="text-slate-400 hover:text-jeffy-yellow transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-jeffy-yellow rounded-full"></span>
                  Coming Soon
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-slate-400 hover:text-jeffy-yellow transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-jeffy-yellow rounded-full"></span>
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white">Connect With Us</h3>
            <div className="space-y-3 mb-6">
              {socialMediaConfig.whatsapp.number && (
                <a
                  href={socialMediaConfig.whatsapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-400 hover:text-jeffy-yellow transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm">WhatsApp: {socialMediaConfig.whatsapp.number}</span>
                </a>
              )}
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-3">
              <a
                href={socialMediaConfig.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={socialMediaConfig.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={socialMediaConfig.tiktok.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors"
                aria-label="TikTok"
              >
                <Video className="w-5 h-5" />
              </a>
              {socialMediaConfig.whatsapp.number && (
                <a
                  href={socialMediaConfig.whatsapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-green-500 transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-6 text-center">
          <p className="text-slate-400 text-sm">
            &copy; {currentYear} Jeffy - In a Jiffy. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Made with ❤️ in Johannesburg, South Africa
          </p>
        </div>
      </div>
    </footer>
  )
}
