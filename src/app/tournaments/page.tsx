'use client'

import { useState, useEffect } from 'react'
import type { ScrapedEvent } from '@/types/event'
import { getSavedEvents, UPDATE_EVENT } from '@/lib/myTournaments'
import EventCard from '@/components/ui/EventCard'
import CardGrid from '@/components/ui/CardGrid'

export default function TournamentsPage() {
  const [events, setEvents] = useState<ScrapedEvent[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setEvents(getSavedEvents())

    function sync() { setEvents(getSavedEvents()) }
    window.addEventListener(UPDATE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return (
    <div className="container-page section-gap">
      <header className="mb-8">
        <p className="text-label-lg text-primary-600 mb-2">Saved Events</p>
        <h1 className="text-display-md text-navy-800">My Tournaments</h1>
        {mounted && events.length > 0 && (
          <p className="text-body-lg text-neutral-600 mt-3">
            {events.length} {events.length === 1 ? 'tournament' : 'tournaments'} saved
          </p>
        )}
      </header>

      {!mounted ? null : events.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <BookmarkEmptyIcon />
          <p className="text-body-lg text-neutral-600">No saved tournaments yet.</p>
          <p className="text-body-sm text-neutral-400">
            Bookmark events on the home page to save them here.
          </p>
        </div>
      ) : (
        <CardGrid columns={1}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </CardGrid>
      )}
    </div>
  )
}

function BookmarkEmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="text-neutral-300">
      <path
        d="M8 7A3 3 0 0 1 11 4h18a3 3 0 0 1 3 3v28l-12-7-12 7V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
