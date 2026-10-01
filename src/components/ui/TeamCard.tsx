import Link from 'next/link'
import type { UsssaTeam } from '@/types/team'

export default function TeamCard({ team }: { team: UsssaTeam }) {
  const location = [team.city, team.state].filter(Boolean).join(', ')

  return (
    <article className="card flex flex-col gap-2">
      <h3 className="text-heading-sm text-neutral-900 leading-snug">
        <Link
          href={team.href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150"
        >
          {team.teamName}
        </Link>
      </h3>

      {team.className && (
        <span className="badge badge-primary self-start">{team.className}</span>
      )}

      {location && (
        <span className="flex items-center gap-1 text-body-sm text-neutral-500 mt-auto">
          <LocationIcon className="shrink-0" />
          {location}
        </span>
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
