import Link from 'next/link'
import Image from 'next/image'
import type { ScrapedEvent } from '@/types/event'
import CardFooter from './CardFooter'
import SaveButton from './SaveButton'

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

  if (s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString('en-US', { ...opts, year: 'numeric' })
  }
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString('en-US', opts)}–${e.getDate()}, ${s.getFullYear()}`
  }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}, ${e.getFullYear()}`
}

function formatEntryFee(fee: ScrapedEvent['entryFee']): string | null {
  const { min, max } = fee
  if (min === null && max === null) return null
  if (min === null) return `$${max}`
  if (max === null) return `$${min}`
  if (min === max) return `$${min}`
  return `$${min}–$${max}`
}

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const SANCTION_DEFAULTS: Record<string, string> = {
  USSSA: 'https://mofastpitch.usssa.com/wp-content/themes/tournamentgear/images/logo-s.svg',
}

function EventLogo({ logoUrl, sanction }: { logoUrl: string | null; sanction: string }) {
  const src = logoUrl ?? SANCTION_DEFAULTS[sanction] ?? null

  if (src) {
    return (
      <div className="relative w-10 h-10">
        <Image
          src={src}
          alt=""
          fill
          sizes="40px"
          className="object-contain"
        />
      </div>
    )
  }

  const label = sanction === 'USA Softball' ? 'USA SB' : sanction
  return (
    <>
      <svg width="28" height="28" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="13" cy="13" r="12" fill="var(--color-primary-400)" />
        <path d="M5 9.5C7.5 6.5 10 6.5 13 9.5C16 12.5 18.5 12.5 21 9.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" fill="none" />
        <path d="M5 16.5C7.5 19.5 10 19.5 13 16.5C16 13.5 18.5 13.5 21 16.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" fill="none" />
      </svg>
      <span className="text-[9px] font-bold text-neutral-500 leading-none text-center">{label}</span>
    </>
  )
}

const SANCTION_BORDER: Record<string, string> = {
  USSSA: 'var(--color-columbia-500)',
  'USA Softball': 'var(--color-error-500)',
}

export default function EventCard({ event }: { event: ScrapedEvent }) {
  const dateRange = formatDateRange(event.eventStartDate, event.eventEndDate)
  const location = [event.venueName, event.city, event.state].filter(Boolean).join(', ')
  const feeStr = formatEntryFee(event.entryFee)
  const borderColor = SANCTION_BORDER[event.sanction]

  return (
    <article
      className="card flex flex-row gap-4 p-0 overflow-hidden"
      style={borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : undefined}
    >
      {/* Logo — full-height strip, content pinned to top so it doesn't shift on expand */}
      <div className={`w-16 self-stretch shrink-0 bg-white flex flex-col items-center gap-1 ${event.sanction === 'USSSA' ? 'pt-[60px]' : 'pt-[45px]'}`}>
        <EventLogo logoUrl={event.logoUrl} sanction={event.sanction} />
      </div>

      {/* Card content */}
      <div className="flex flex-col gap-2 flex-1 min-w-0 py-4 pr-4">
        {/* Header: date (left) | team count + stature badges (right) */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-label-sm text-primary-600">{dateRange}</span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
            {event.teamCount !== null && event.teamCount > 0 && (
              <span className="badge badge-neutral">{event.teamCount} teams</span>
            )}
            {event.statureName && (
              <span className="badge badge-primary">{event.statureName}</span>
            )}
            <SaveButton event={event} />
          </div>
        </div>

        {/* Title (left) + entry fee (right) — baseline aligned */}
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-heading-sm text-neutral-900 leading-snug flex-1 min-w-0">
            <Link
              href={event.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-navy-700 transition-colors duration-150"
            >
              {event.name}
            </Link>
          </h3>
          {feeStr && (
            <span className="text-body-sm font-medium text-neutral-700 shrink-0 whitespace-nowrap">
              {feeStr}
            </span>
          )}
        </div>

        {/* Registration deadline */}
        {event.registrationDeadline && (
          <p className="text-body-sm text-neutral-500">
            Reg. by {formatDeadline(event.registrationDeadline)}
          </p>
        )}

        {/* Footer: location · director | age tabs → expands team list */}
        <CardFooter
          location={location}
          directorName={event.directorName}
          ageGroups={event.ageGroups}
          eventId={event.usssaId}
        />
      </div>
    </article>
  )
}
