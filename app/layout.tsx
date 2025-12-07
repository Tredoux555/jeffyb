import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { ClientNavigation } from "../components/ClientNavigation";
import { AuthProvider } from "../lib/contexts/AuthContext";
import { NotificationProvider } from "../lib/providers/NotificationProvider";
import { Footer } from "../components/Footer";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { ServiceWorkerRegistration } from "../components/ServiceWorkerRegistration";

// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
//   display: 'swap',
//   preload: false,
// });

export const metadata: Metadata = {
  title: "Jeffy - In a Jiffy",
  description: "Your mobile-optimized commerce platform for gym, camping, kitchen, and beauty products",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jeffy",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: "Jeffy - In a Jiffy",
    description: "Your mobile-optimized commerce platform for gym, camping, kitchen, and beauty products",
    type: "website",
    locale: "en_ZA",
    siteName: "Jeffy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jeffy - In a Jiffy",
    description: "Your mobile-optimized commerce platform for gym, camping, kitchen, and beauty products",
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#EAB308',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            <ServiceWorkerRegistration />
            <ClientNavigation />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <WhatsAppButton />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
