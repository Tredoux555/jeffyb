import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientNavigation } from "@/components/ClientNavigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Jeffy - In a Jiffy",
  description: "Your mobile-optimized commerce platform for gym, camping, kitchen, and beauty products",
  // viewport and themeColor moved to viewport export below
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FCD34D',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClientNavigation />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
