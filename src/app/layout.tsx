import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Sora, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/providers'

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-barlow',
  display: 'swap',
})
const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
})
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Celo Shooter — Arcade Leaderboard',
  description:
    'Dodge, shoot, and climb the on-chain leaderboard. A pocket arcade shooter built for MiniPay on Celo.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  applicationName: 'Celo Shooter',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Celo Shooter',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Celo Shooter — Arcade Leaderboard',
    description: 'Dodge, shoot, and climb the on-chain leaderboard on Celo',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#05060A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${barlow.variable} ${sora.variable} ${plexMono.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style>{`
          html, body { overscroll-behavior: none; }
        `}</style>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
