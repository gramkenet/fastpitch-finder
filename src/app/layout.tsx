import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BackToTop from '@/components/ui/BackToTop'
import './globals.css'

// Runs before hydration so the correct theme applies before first paint.
// Defaults to dark when no preference has been saved yet.
const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      var dark = stored ? stored === 'dark' : true;
      document.documentElement.classList.toggle('dark', dark);
    } catch (e) {}
  })();
`

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FastPitch Finder',
  description: 'Find fastpitch softball tournaments, teams, players, and rankings.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
      </body>
    </html>
  )
}
