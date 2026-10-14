import type { Metadata, Viewport } from 'next'
import { DM_Sans, Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/auth-context"
import './globals.css'

const dmSans = DM_Sans({ subsets: ["latin"], variable: '--font-dm-sans' });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta' });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ['400', '500'], variable: '--font-plex-mono' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F1F3D',
}

export const metadata: Metadata = {
  title: 'Construction Hub - Site Management',
  description: 'Professional construction site management system for contractors and supervisors',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jakarta.variable} ${plexMono.variable} bg-background`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

