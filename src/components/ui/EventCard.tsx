import Link from 'next/link'
import Image from 'next/image'
import type { AgeGroup, ScrapedEvent } from '@/types/event'
import CardFooter from './CardFooter'
import SaveButton from './SaveButton'

function ageRangeLabel(ageGroups: AgeGroup[]): string | null {
  const ages = ageGroups
    .map((ag) => { const m = ag.label.match(/^(\d+)/); return m ? parseInt(m[1], 10) : null })
    .filter((n): n is number => n !== null)
  if (ages.length === 0) return null
  const min = Math.min(...ages)
  const max = Math.max(...ages)
  return min === max ? `${min}U` : `${min}U–${max}U`
}

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
        <Image src={src} alt="" fill sizes="40px" className="object-contain" />
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

const SANCTION_COLOR: Record<string, string> = {
  USSSA: 'var(--color-columbia-500)',
  'USA Softball': 'var(--color-error-500)',
  FASA: 'var(--color-columbia-300)',
  NSA: 'var(--color-primary-500)',
}

const SANCTION_LABEL: Record<string, string> = {
  'USA Softball': 'USA SB',
}

export default function EventCard({ event }: { event: ScrapedEvent }) {
  const dateRange = formatDateRange(event.eventStartDate, event.eventEndDate)
  const location = [event.venueName, event.city, event.state].filter(Boolean).join(', ')
  const feeStr = formatEntryFee(event.entryFee)
  const accentColor = SANCTION_COLOR[event.sanction]
  const sanctionLabel = SANCTION_LABEL[event.sanction] ?? event.sanction
  const ageRange = ageRangeLabel(event.ageGroups)
  const canExpand = event.usssaId !== undefined || event.tmvpId !== undefined

  return (
    <article
      className="card relative flex flex-col p-0 overflow-hidden"
      style={accentColor ? { borderTopWidth: 4, borderTopColor: accentColor, borderLeftWidth: 4, borderLeftColor: accentColor } : undefined}
    >
      {/* Sanction badge flush with the top-left corner */}
      {accentColor && (
        <span
          className="absolute top-0 left-0 text-[10px] font-bold tracking-wide uppercase px-1.5 py-1 rounded-br-md text-white leading-none"
          style={{ backgroundColor: accentColor }}
        >
          {sanctionLabel}
        </span>
      )}

      {/* Main content row: logo strip + details */}
      <div className="flex flex-row gap-4">
        {/* Logo strip */}
        <div className="w-16 self-stretch shrink-0 bg-white flex flex-col items-center gap-1 pt-10">
          <EventLogo logoUrl={event.logoUrl} sanction={event.sanction} />
        </div>

        {/* Details column */}
        <div className="flex flex-col gap-2 flex-1 min-w-0 py-4 pr-4">
          {/* Header: badges top-right on mobile (own line), inline with date on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 lg:gap-2">
            <div className="flex items-center gap-1.5 flex-wrap justify-end order-first lg:order-last shrink-0">
              {event.teamCount !== null && event.teamCount > 0 && (
                <span className="badge badge-neutral">{event.teamCount} teams</span>
              )}
              {ageRange && (
                <span className="badge badge-neutral">{ageRange}</span>
              )}
              {event.statureName && (
                <span className="badge badge-primary">{event.statureName}</span>
              )}
              <SaveButton event={event} />
            </div>
            <span className="text-label-sm text-primary-600 order-last lg:order-first">{dateRange}</span>
          </div>

          {/* Title + entry fee */}
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

          {/* Location + director */}
          {(location || event.directorName) && (
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2 text-body-sm text-neutral-500 mt-auto">
              {location && (
                <span className="flex items-center gap-1">
                  <LocationIcon className="shrink-0" />
                  {location}
                </span>
              )}
              {location && event.directorName && (
                <span className="hidden lg:inline text-neutral-300 select-none" aria-hidden="true">·</span>
              )}
              {event.directorName && (
                <span className="flex items-center gap-1">
                  <PersonIcon className="shrink-0" />
                  {event.directorName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-width View details section */}
      {canExpand && (
        <CardFooter
          href={event.href}
          ageGroups={event.ageGroups}
          eventId={event.usssaId}
          tmvpId={event.tmvpId}
        />
      )}
    </article>
  )
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path d="M7 1a4 4 0 0 1 4 4c0 3-4 8-4 8S3 8 3 5a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="7" cy="5" r="1.25" fill="currentColor" />
    </svg>
  )
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M2 12c0-2.21 2.239-4 5-4s5 1.79 5 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}
