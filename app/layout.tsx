import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Oros Pura Vida',
  description:
    'Registro de pedidos de monedas. Venezuela, Costa Rica, Ecuador, Colombia y México.',
  keywords: ['monedas', 'coins', 'Venezuela', 'Costa Rica', 'Ecuador', 'Colombia', 'México'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
