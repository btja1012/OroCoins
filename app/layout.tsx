import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OroCoins — Tu tienda de monedas',
  description:
    'Compra monedas para tu juego favorito. Venezuela, Costa Rica, Ecuador, Colombia y México. Rápido, seguro y confiable.',
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
