'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && !isDark ? 'Switch to dark mode' : 'Switch to light mode'}
      className="p-2 rounded-lg text-neutral-600 hover:bg-silver-100 transition-colors duration-150"
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 1.5v2M9 14.5v2M16.5 9h-2M3.5 9h-2M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4M14.3 14.3l-1.4-1.4M5.1 5.1L3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M15.5 10.4A6.5 6.5 0 1 1 7.6 2.5a5.25 5.25 0 0 0 7.9 7.9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
