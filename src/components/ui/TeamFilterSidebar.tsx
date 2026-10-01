'use client'

import { useState } from 'react'
import { useFilterTransition } from './FilterTransition'
import type { TeamClassOption, TeamRegionOption, TeamSeasonOption } from '@/types/team'

interface Props {
  availableRegions: TeamRegionOption[]
  availableClasses: TeamClassOption[]
  availableSeasons: TeamSeasonOption[]
  selectedTeamName: string
  selectedRegion: string
  selectedClass: string
  selectedSeason: string
}

type FilterUpdate = {
  teamName?: string
  region?: string
  class?: string
  season?: string
}

export default function TeamFilterSidebar({
  availableRegions,
  availableClasses,
  availableSeasons,
  selectedTeamName,
  selectedRegion,
  selectedClass,
  selectedSeason,
}: Props) {
  const { isPending, navigate: navigateTo } = useFilterTransition()
  const [mobileOpen, setMobileOpen] = useState(false)

  function buildUrl(updates: FilterUpdate) {
    const next = {
      teamName: 'teamName' in updates ? (updates.teamName ?? '') : selectedTeamName,
      region: updates.region ?? selectedRegion,
      class: updates.class ?? selectedClass,
      season: updates.season ?? selectedSeason,
    }

    const params = new URLSearchParams()
    if (next.teamName.length >= 2) params.set('q', next.teamName)
    if (next.region !== 'all') params.set('region', next.region)
    if (next.class !== 'all') params.set('class', next.class)
    if (next.season) params.set('season', next.season)

    const qs = params.toString()
    return qs ? `/teams?${qs}` : '/teams'
  }

  function navigate(updates: FilterUpdate) {
    navigateTo(buildUrl(updates))
  }

  const hasActiveFilters =
    selectedTeamName.length >= 2 || selectedRegion !== 'all' || selectedClass !== 'all'

  const activeFilterCount = [
    selectedTeamName.length >= 2,
    selectedRegion !== 'all',
    selectedClass !== 'all',
  ].filter(Boolean).length

  return (
    <div className="card flex flex-col gap-5">
      {/* Header — toggle on mobile, static label on desktop */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          className="flex items-center gap-2 lg:pointer-events-none"
        >
          <h2 className="text-label-sm text-neutral-400">Filters</h2>
          {!mobileOpen && activeFilterCount > 0 && (
            <span className="lg:hidden badge badge-navy px-1.5 py-0.5 text-[10px]">
              {activeFilterCount}
            </span>
          )}
          <ChevronDownIcon
            className={`lg:hidden text-neutral-400 transition-transform duration-200 ${
              mobileOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => navigateTo('/teams')}
            className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors duration-150 shrink-0"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter sections — collapsed on mobile by default, always open on lg+ */}
      <div className={`flex-col gap-5 transition-opacity duration-150 ${mobileOpen ? 'flex' : 'hidden lg:flex'} ${isPending ? 'opacity-60' : ''}`}>
        {/* Team Name */}
        <FilterSection label="Team Name">
          <input
            key={`name-${selectedTeamName}`}
            type="search"
            defaultValue={selectedTeamName}
            placeholder="Enter a team name…"
            className="input"
            onBlur={(e) => navigate({ teamName: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate({ teamName: (e.target as HTMLInputElement).value })
            }}
          />
        </FilterSection>

        {/* Region / State */}
        <FilterSection label="Region / State">
          <select
            value={selectedRegion}
            onChange={(e) => navigate({ region: e.target.value })}
            className="input"
          >
            <option value="all">All Regions</option>
            {availableRegions.map((r) => (
              <option key={r.value} value={String(r.value)}>{r.name}</option>
            ))}
          </select>
        </FilterSection>

        {/* Classification */}
        <FilterSection label="Classification">
          <select
            value={selectedClass}
            onChange={(e) => navigate({ class: e.target.value })}
            className="input"
          >
            <option value="all">All Classifications</option>
            {availableClasses.map((c) => (
              <option key={c.value} value={String(c.value)}>{c.name}</option>
            ))}
          </select>
        </FilterSection>

        {/* Season */}
        <FilterSection label="Season">
          <select
            value={selectedSeason}
            onChange={(e) => navigate({ season: e.target.value })}
            className="input"
          >
            {availableSeasons.map((s) => (
              <option key={s.value} value={s.value}>{s.name}</option>
            ))}
          </select>
        </FilterSection>
      </div>
    </div>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-label-sm text-neutral-500">{label}</h3>
      {children}
    </section>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2.5 5L7 9.5L11.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
