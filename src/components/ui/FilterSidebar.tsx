'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  availableStates: string[]
  availableAges: string[]
  availableSanctions: string[]
  selectedState: string
  selectedAges: string[]
  selectedDateFrom: string
  selectedDateTo: string
  selectedSanction: string
  selectedSearch: string
  selectedZip: string
  selectedDistance: string
}

type FilterUpdate = {
  state?: string
  ages?: string[]
  dateFrom?: string
  dateTo?: string
  sanction?: string
  search?: string
  zip?: string
  distance?: string
}

export default function FilterSidebar({
  availableStates,
  availableAges,
  availableSanctions,
  selectedState,
  selectedAges,
  selectedDateFrom,
  selectedDateTo,
  selectedSanction,
  selectedSearch,
  selectedZip,
  selectedDistance,
}: Props) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [zipInput, setZipInput] = useState(selectedZip)
  const [geoLoading, setGeoLoading] = useState(false)

  // Sync zip input when URL param changes (e.g. Clear all)
  useEffect(() => { setZipInput(selectedZip) }, [selectedZip])

  // Auto-populate zip from geolocation on mount if not already set
  useEffect(() => {
    if (selectedZip || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        setGeoLoading(true)
        const { latitude, longitude } = pos.coords
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        )
        const data = await res.json()
        const zip: string = data.address?.postcode?.replace(/\D/g, '').slice(0, 5) ?? ''
        if (zip.length === 5) setZipInput(zip)
      } catch {
        // silent failure
      } finally {
        setGeoLoading(false)
      }
    }, () => {}) // silent failure if denied
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function buildUrl(updates: FilterUpdate) {
    const next = {
      state: updates.state ?? selectedState,
      ages: updates.ages ?? selectedAges,
      dateFrom: 'dateFrom' in updates ? (updates.dateFrom ?? '') : selectedDateFrom,
      dateTo: 'dateTo' in updates ? (updates.dateTo ?? '') : selectedDateTo,
      sanction: updates.sanction ?? selectedSanction,
      search: 'search' in updates ? (updates.search ?? '') : selectedSearch,
      zip: 'zip' in updates ? (updates.zip ?? '') : selectedZip,
      distance: 'distance' in updates ? (updates.distance ?? '') : selectedDistance,
    }

    const params = new URLSearchParams()
    if (next.state !== 'all') params.set('state', next.state)
    if (next.ages.length > 0) params.set('ages', next.ages.join(','))
    if (next.dateFrom) params.set('dateFrom', next.dateFrom)
    if (next.dateTo) params.set('dateTo', next.dateTo)
    if (next.sanction !== 'all') params.set('sanction', next.sanction)
    if (next.search.length >= 4) params.set('search', next.search)
    if (next.zip) params.set('zip', next.zip)
    if (next.distance) params.set('distance', next.distance)

    const qs = params.toString()
    return qs ? `/?${qs}` : '/'
  }

  function navigate(updates: FilterUpdate) {
    router.push(buildUrl(updates))
  }

  const hasActiveFilters =
    selectedState !== 'all' ||
    selectedAges.length > 0 ||
    !!selectedDateFrom ||
    !!selectedDateTo ||
    selectedSanction !== 'all' ||
    selectedSearch.length >= 4 ||
    (!!selectedZip && !!selectedDistance)

  const activeFilterCount = [
    selectedState !== 'all',
    selectedAges.length > 0,
    !!selectedDateFrom || !!selectedDateTo,
    selectedSanction !== 'all',
    selectedSearch.length >= 4,
    !!selectedZip && !!selectedDistance,
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
            onClick={() => router.push('/')}
            className="text-xs text-navy-600 hover:text-navy-800 font-medium transition-colors duration-150 shrink-0"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter sections — collapsed on mobile by default, always open on lg+ */}
      <div className={`flex-col gap-5 ${mobileOpen ? 'flex' : 'hidden lg:flex'}`}>
        {/* Sanction */}
        <FilterSection label="Sanction">
          <select
            value={selectedSanction}
            onChange={(e) => navigate({ sanction: e.target.value })}
            className="input"
          >
            <option value="all">All Sanctions</option>
            {availableSanctions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FilterSection>

        {/* State */}
        <FilterSection label="State">
          <select
            value={selectedState}
            onChange={(e) => navigate({ state: e.target.value })}
            className="input"
          >
            <option value="all">All States</option>
            {availableStates.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </FilterSection>

        {/* Age Division */}
        <FilterSection label="Age Division">
          <select
            value={selectedAges.length === 1 ? selectedAges[0] : 'all'}
            onChange={(e) => {
              const val = e.target.value
              navigate({ ages: val === 'all' ? [] : [val] })
            }}
            className="input"
          >
            <option value="all">All Ages</option>
            {availableAges.map((age) => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </FilterSection>

        {/* Date Range */}
        <FilterSection label="Date Range">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500 font-medium">From</label>
              <input
                key={`from-${selectedDateFrom}`}
                type="date"
                defaultValue={selectedDateFrom}
                onBlur={(e) => navigate({ dateFrom: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500 font-medium">To</label>
              <input
                key={`to-${selectedDateTo}`}
                type="date"
                defaultValue={selectedDateTo}
                onBlur={(e) => navigate({ dateTo: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </FilterSection>

        {/* Location */}
        <FilterSection label="Location">
          <div className="flex gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              placeholder={geoLoading ? 'Detecting…' : 'Zip code'}
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onBlur={(e) => {
                const v = e.target.value
                if (v.length === 5) navigate({ zip: v })
                else if (!v) navigate({ zip: '' })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && zipInput.length === 5) navigate({ zip: zipInput })
              }}
              maxLength={5}
              className="input flex-1 min-w-0"
              disabled={geoLoading}
            />
            <button
              type="button"
              title="Use my location"
              disabled={geoLoading}
              onClick={async () => {
                if (!navigator.geolocation) return
                setGeoLoading(true)
                try {
                  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                    navigator.geolocation.getCurrentPosition(resolve, reject)
                  )
                  const { latitude, longitude } = pos.coords
                  const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                  )
                  const data = await res.json()
                  const zip: string = data.address?.postcode?.replace(/\D/g, '').slice(0, 5) ?? ''
                  if (zip.length === 5) {
                    setZipInput(zip)
                    navigate({ zip })
                  }
                } catch {
                  // silent
                } finally {
                  setGeoLoading(false)
                }
              }}
              className="shrink-0 w-10 flex items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-500 hover:text-navy-700 hover:border-navy-500 transition-colors duration-150 disabled:opacity-50"
            >
              <LocationPinIcon />
            </button>
          </div>
          <select
            value={selectedDistance}
            onChange={(e) => navigate({ distance: e.target.value })}
            className="input"
          >
            <option value="">All distances</option>
            {[50, 100, 150, 200, 250, 300].map((mi) => (
              <option key={mi} value={String(mi)}>{mi} miles</option>
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


function LocationPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3.5-4.5 8.5-4.5 8.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
    </svg>
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
