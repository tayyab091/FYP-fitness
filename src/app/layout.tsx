import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Toaster } from 'sonner'
import { Providers } from './providers'
import { AIChatbot } from '@/components/shared/AIChatbot'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'T.E.S.T. — Train. Eat. Sleep. Thrive.',
  description: "Pakistan's first AI-powered fitness coaching platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-[#0a0a0a] text-white antialiased`}>
        <Providers>
          <Navbar />
          <main className="pb-20 md:pb-0">
            {children}
          </main>
          <BottomNav />
          <AIChatbot />
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: { background: '#111', border: '1px solid #2a2a2a', color: '#fff' },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
