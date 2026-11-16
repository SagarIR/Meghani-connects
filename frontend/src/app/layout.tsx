import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: {
    default: 'Meghani Watch Co. — Timeless Style. Trusted Quality.',
    template: '%s | Meghani Watch Co.',
  },
  description: 'Authorized luxury watch retailer and master watchmaker atelier in Vadodara since 1984. Curating genuine timepieces from Titan, Casio, Timex, and Citizen.',
  keywords: [
    'Meghani Watch Co', 'luxury watches Vadodara', 'Titan watch dealer Vadodara',
    'Casio watches', 'Citizen Eco Drive', 'watch repair Vadodara',
    'automatic watches', 'wall clocks', 'New Sama Road watches'
  ],
  authors: [{ name: 'Meghani Watch Co.' }],
  creator: 'Meghani Watch Co.',
  publisher: 'Meghani Watch Co.',
  metadataBase: new URL('https://meghaniwatch.com'),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
