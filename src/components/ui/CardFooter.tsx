'use client'

import { useState } from 'react'
import type { AgeGroup, DivisionTeams } from '@/types/event'
import type { TMVPDivision } from '@/app/api/tmvp-teams/route'

type ParsedDivision = {
  divisionName: string
  teams: { name: string; meta: string | null }[]
}

function ageFromLabel(label: string): number | null {
  const m = label.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function ageFromDivisionName(name: string): number | null {
  const m = name.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

interface Props {
  href: string
  ageGroups: AgeGroup[]
  eventId?: number
  tmvpId?: number
}

export default function CardFooter({ href, ageGroups, eventId, tmvpId }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [activeAge, setActiveAge] = useState<string | null>(null)
  const [divisions, setDivisions] = useState<ParsedDivision[] | null>(null)
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
      if (eventId !== undefined) {
        const res = await fetch(
          `https://sportsvc.usssa.com/api/Event/teamsSummaryLwc?eventId=${eventId}`
        )
        if (!res.ok) throw new Error()
        const data: DivisionTeams[] = await res.json()
        setDivisions(data.map((div) => ({
          divisionName: div.divisionName,
          teams: div.teamsSummaryLwc.map((t) => ({ name: t.teamName, meta: t.stateABR })),
        })))
      } else if (tmvpId !== undefined) {
        const res = await fetch(`/api/tmvp-teams?id=${tmvpId}`)
        if (!res.ok) throw new Error()
        const data: { divisions: TMVPDivision[] } = await res.json()
        setDivisions(data.divisions.map((div) => ({
          divisionName: div.divisionName,
          teams: div.teams.map((t) => ({ name: t.teamName, meta: t.coach })),
        })))
      }
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

  return (
    <div className="border-t border-silver-100">
      {/* Action row: View details (left) + Register (right) */}
      <div className="flex">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 hover:bg-silver-50 border-r border-silver-100 transition-colors duration-150"
        >
          {expanded ? 'Hide details' : 'View details'}
          <ChevronDownIcon className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors duration-150"
        >
          Register
          <ChevronRightIcon />
        </a>
      </div>

      {/* Expanded: Who's coming? */}
      {expanded && (
        <div className="border-t border-silver-100 px-4 pb-4 pt-3 flex flex-col gap-3">
          <p className="text-label-sm text-neutral-400">Who&rsquo;s coming?</p>

          {ageGroups.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ageGroups.map((ag) => (
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
              ))}
            </div>
          )}

          {activeAge && (
            <div>
              {loading && <p className="text-xs text-neutral-400">Loading…</p>}
              {error && <p className="text-xs text-red-500">Could not load teams.</p>}
              {!loading && !error && divisions && matchedDivisions.length === 0 && (
                <p className="text-xs text-neutral-400">No team data available.</p>
              )}
              <div className="flex flex-col gap-3">
                {matchedDivisions.map((div) => (
                  <div key={div.divisionName}>
                    {matchedDivisions.length > 1 && (
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
                        {div.divisionName}
                      </p>
                    )}
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {div.teams.map((team, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-1 text-xs text-neutral-700 min-w-0"
                        >
                          <span className="truncate">{team.name}</span>
                          {team.meta && (
                            <span className="text-neutral-400 shrink-0 ml-1">{team.meta}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
