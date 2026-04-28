'use client'

import { useRouter } from 'next/navigation'

const STATE_LABELS: Record<string, string> = {
  MO: 'Missouri',
  IL: 'Illinois',
  KS: 'Kansas',
}

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
}

type FilterUpdate = {
  state?: string
  ages?: string[]
  dateFrom?: string
  dateTo?: string
  sanction?: string
  search?: string
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
}: Props) {
  const router = useRouter()

  function buildUrl(updates: FilterUpdate) {
    const next = {
      state: updates.state ?? selectedState,
      ages: updates.ages ?? selectedAges,
      dateFrom: 'dateFrom' in updates ? (updates.dateFrom ?? '') : selectedDateFrom,
      dateTo: 'dateTo' in updates ? (updates.dateTo ?? '') : selectedDateTo,
      sanction: updates.sanction ?? selectedSanction,
      search: 'search' in updates ? (updates.search ?? '') : selectedSearch,
    }

    const params = new URLSearchParams()
    if (next.state !== 'MO') params.set('state', next.state)
    if (next.ages.length > 0) params.set('ages', next.ages.join(','))
    if (next.dateFrom) params.set('dateFrom', next.dateFrom)
    if (next.dateTo) params.set('dateTo', next.dateTo)
    if (next.sanction !== 'all') params.set('sanction', next.sanction)
    if (next.search.length >= 4) params.set('search', next.search)

    const qs = params.toString()
    return qs ? `/?${qs}` : '/'
  }

  function navigate(updates: FilterUpdate) {
    router.push(buildUrl(updates))
  }

  const hasActiveFilters =
    selectedState !== 'MO' ||
    selectedAges.length > 0 ||
    !!selectedDateFrom ||
    !!selectedDateTo ||
    selectedSanction !== 'all' ||
    selectedSearch.length >= 4

  const SANCTION_COLORS: Record<string, string> = {
    USSSA: 'var(--color-columbia-500)',
    'USA Softball': 'var(--color-error-500)',
  }

  const sanctionOptions = [
    { value: 'all', label: 'All', color: undefined },
    ...availableSanctions.map((s) => ({ value: s, label: s, color: SANCTION_COLORS[s] })),
  ]

  return (
    <div className="card flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-label-sm text-neutral-400">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-xs text-navy-600 hover:text-navy-800 font-medium transition-colors duration-150"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sanction */}
      <FilterSection label="Sanction">
        {sanctionOptions.map((opt) => (
          <RadioItem
            key={opt.value}
            label={opt.label}
            color={opt.color}
            isSelected={opt.value === selectedSanction}
            onClick={() => navigate({ sanction: opt.value })}
          />
        ))}
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
            <option key={code} value={code}>
              {STATE_LABELS[code] ?? code}
            </option>
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

function RadioItem({
  label,
  color,
  isSelected,
  onClick,
}: {
  label: string
  color?: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-body-sm transition-colors duration-150 text-left w-full ${
        isSelected
          ? 'text-navy-700 font-semibold'
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-silver-100'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
          isSelected ? 'border-navy-600' : 'border-neutral-300'
        }`}
      >
        {isSelected && <span className="w-2 h-2 rounded-full bg-navy-600" />}
      </span>
      {color && (
        <span
          className="w-[3px] h-[14px] rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  )
}
