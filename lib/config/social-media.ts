// Social Media Configuration
// Centralized configuration for social media URLs and settings

export const socialMediaConfig = {
  facebook: {
    url: process.env.NEXT_PUBLIC_FACEBOOK_URL || '#',
    name: 'Facebook',
    icon: 'Facebook' as const
  },
  instagram: {
    url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#',
    name: 'Instagram',
    icon: 'Instagram' as const
  },
  tiktok: {
    url: process.env.NEXT_PUBLIC_TIKTOK_URL || '#',
    name: 'TikTok',
    icon: 'Video' as const
  },
  whatsapp: {
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
    url: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER 
      ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`
      : '#',
    name: 'WhatsApp',
    icon: 'MessageCircle' as const
  }
}

export function getWhatsAppUrl(message?: string): string {
  const baseUrl = socialMediaConfig.whatsapp.url
  if (!message || baseUrl === '#') return baseUrl
  
  const encodedMessage = encodeURIComponent(message)
  return `${baseUrl}?text=${encodedMessage}`
}

