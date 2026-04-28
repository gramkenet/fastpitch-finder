'use client'

import { useState } from 'react'
import type { AgeGroup, DivisionTeams } from '@/types/event'

function ageFromLabel(label: string): number | null {
  const m = label.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function ageFromDivisionName(name: string): number | null {
  const m = name.match(/(\d+)\s*(?:&\s*under|u\b)/i)
  return m ? parseInt(m[1], 10) : null
}

interface Props {
  location: string
  directorName: string | null
  ageGroups: AgeGroup[]
  eventId?: number  // absent for non-USSSA sources; disables team lookup
}

export default function CardFooter({ location, directorName, ageGroups, eventId }: Props) {
  const [activeAge, setActiveAge] = useState<string | null>(null)
  const [divisions, setDivisions] = useState<DivisionTeams[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function selectAge(label: string) {
    if (activeAge === label) {
      setActiveAge(null)
      return
    }
    setActiveAge(label)
    if (divisions !== null) return

    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/teams?eventId=${eventId}`)
      if (!res.ok) throw new Error()
      setDivisions(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const activeAgeNum = activeAge ? ageFromLabel(activeAge) : null
  const matchedDivisions = (divisions ?? []).filter(
    (div) => ageFromDivisionName(div.divisionName) === activeAgeNum
  )

  if (!location && !directorName && ageGroups.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mt-auto">
      {/* Footer row: location · director (left) | age tab buttons (right) */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        {(location || directorName) && (
          <div className="flex items-center gap-2 text-body-sm text-neutral-500 flex-wrap">
            {location && (
              <span className="flex items-center gap-1">
                <LocationIcon className="shrink-0" />
                {location}
              </span>
            )}
            {location && directorName && (
              <span className="text-neutral-300 select-none" aria-hidden="true">·</span>
            )}
            {directorName && (
              <span className="flex items-center gap-1">
                <PersonIcon className="shrink-0" />
                {directorName}
              </span>
            )}
          </div>
        )}

        {ageGroups.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1 shrink-0">
            {ageGroups.map((ag) =>
              eventId ? (
                <button
                  key={ag.label}
                  type="button"
                  onClick={() => selectAge(ag.label)}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs transition-colors duration-150 ${
                    activeAge === ag.label
                      ? 'border-navy-500 bg-navy-50 text-navy-700'
                      : 'border-silver-200 bg-silver-50 text-navy-700 hover:border-navy-300 hover:bg-navy-50/40'
                  }`}
                >
                  <span className="font-semibold">{ag.label}</span>
                  {ag.teamCount !== null && (
                    <span className={`font-medium ${activeAge === ag.label ? 'text-navy-500' : 'text-navy-400'}`}>
                      ·{ag.teamCount}
                    </span>
                  )}
                </button>
              ) : (
                <span
                  key={ag.label}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-silver-200 bg-silver-50 text-xs text-navy-700"
                >
                  <span className="font-semibold">{ag.label}</span>
                  {ag.teamCount !== null && (
                    <span className="font-medium text-navy-400">·{ag.teamCount}</span>
                  )}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* Expanded team list for the selected age tab */}
      {activeAge && (
        <div className="border-t border-silver-100 pt-2.5 pb-0.5">
          {loading && (
            <p className="text-xs text-neutral-400">Loading…</p>
          )}
          {error && (
            <p className="text-xs text-red-500">Could not load teams.</p>
          )}
          {!loading && !error && divisions && matchedDivisions.length === 0 && (
            <p className="text-xs text-neutral-400">No team data available.</p>
          )}
          <div className="flex flex-col gap-3">
            {matchedDivisions.map((div) => (
              <div key={div.divisionId}>
                {matchedDivisions.length > 1 && (
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
                    {div.divisionName}
                  </p>
                )}
                <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {div.teamsSummaryLwc.map((team) => (
                    <li
                      key={team.teamId}
                      className="flex items-center justify-between gap-1 text-xs text-neutral-700 min-w-0"
                    >
                      <span className="truncate">{team.teamName}</span>
                      <span className="text-neutral-400 shrink-0 ml-1">{team.stateABR}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
