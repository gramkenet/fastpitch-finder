'use client'

import { useState, useEffect } from 'react'
import type { ScrapedEvent } from '@/types/event'
import { isSaved, toggleSaved, UPDATE_EVENT } from '@/lib/myTournaments'

export default function SaveButton({ event }: { event: ScrapedEvent }) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(isSaved(event.id))

    function sync() { setSaved(isSaved(event.id)) }
    window.addEventListener(UPDATE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [event.id])

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSaved(toggleSaved(event))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from My Tournaments' : 'Save to My Tournaments'}
      className={`p-0.5 rounded transition-colors duration-150 ${
        saved
          ? 'text-navy-700 hover:text-navy-900'
          : 'text-neutral-300 hover:text-neutral-500'
      }`}
    >
      <BookmarkIcon filled={saved} />
    </button>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M2.5 2A1.5 1.5 0 0 1 4 .5h7A1.5 1.5 0 0 1 12.5 2v12l-5-2.917L2.5 14V2Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  )
}
