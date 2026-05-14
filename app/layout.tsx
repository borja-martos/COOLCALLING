import type { Metadata } from 'next'
import './globals.css'
// Fuente: Host Grotesk (cargada via @font-face en globals.css)

export const metadata: Metadata = {
  title: 'CoolCalling',
  description: 'El Duolingo de las llamadas en frío',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
