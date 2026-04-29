'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const utilityLinks = [
  { label: 'USSSA', href: 'https://www.usssa.com/fastpitch' },
  { label: 'USA Softball', href: 'https://usasoftball.com' },
]

const primaryLinks = [
  { label: 'My Tournaments', href: '/tournaments' },
  { label: 'My Teams', href: '/teams' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      {/* Utility bar — scrolls with the page, not sticky */}
      <div className="hidden md:block bg-navy-900">
        <div className="container-page flex justify-end items-center h-9">
          <nav aria-label="Utility navigation">
            <ul className="flex items-center gap-6">
              {utilityLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-label-sm text-neutral-400 hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-sticky bg-white shadow-sm">
      {/* Primary nav bar */}
      <div className="border-b border-neutral-200">
        <div className="container-page flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0"
            aria-label="FastPitch Finder home"
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/fastpitch-finder.png`}
              alt="FastPitch Finder"
              width={500}
              height={150}
              priority
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop primary nav links */}
          <nav aria-label="Primary navigation" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {primaryLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="px-4 py-2 rounded-lg text-body-sm font-medium text-neutral-700 hover:text-navy-700 hover:bg-silver-100 transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hamburger button — mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors duration-150"
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-b border-neutral-200 bg-white"
        >
          {/* Primary links */}
          <nav aria-label="Mobile primary navigation">
            <ul className="px-4 pt-2 pb-1">
              {primaryLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center h-11 px-3 rounded-lg text-body-md font-medium text-neutral-800 hover:text-navy-700 hover:bg-silver-100 transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mx-4 border-t border-neutral-100" />

          {/* Utility links */}
          <nav aria-label="Mobile utility navigation">
            <ul className="px-4 pt-1 pb-3">
              {utilityLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center h-10 px-3 rounded-lg text-body-sm text-neutral-600 hover:text-navy-700 hover:bg-silver-100 transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
      </header>
    </>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M3 6h16M3 11h16M3 16h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M4 4l14 14M18 4L4 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
