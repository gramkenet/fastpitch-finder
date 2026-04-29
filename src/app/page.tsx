import { fetchAllEventListings, enrichWithDetails } from '@/lib/scraper'
import EventsExplorer from '@/components/ui/EventsExplorer'
import { PAGE_SIZE } from '@/lib/constants'
import { geocodeZip, geocodeCityState, haversineDistanceMiles } from '@/lib/geocode'

// Standard FASA/TMVP/USSSA age groups — hardcoded so the sidebar doesn't require detail fetches
const AVAILABLE_AGES = [
  '4U','5U','6U','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U',
]

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const str = (key: string) => (typeof sp[key] === 'string' ? sp[key] : undefined)

  const selectedState    = str('state')    ?? 'all'
  const selectedAges     = str('ages')?.split(',').filter(Boolean) ?? []
  const selectedDateFrom = str('dateFrom') ?? ''
  const selectedDateTo   = str('dateTo')   ?? ''
  const selectedSanction = str('sanction') ?? 'all'
  const selectedSearch   = str('search')   ?? ''
  const selectedZip      = str('zip')      ?? ''
  const selectedDistance = str('distance') ?? ''
  const currentPage      = Math.max(1, parseInt(str('page') ?? '1', 10))

  const hasActiveFilters =
    selectedState !== 'all' ||
    selectedAges.length > 0 ||
    !!selectedDateFrom ||
    !!selectedDateTo ||
    selectedSanction !== 'all' ||
    selectedSearch.length >= 4 ||
    (!!selectedZip && !!selectedDistance)

  // Always fetch listings (fast — list API calls only, all cached 1h)
  const allListings = await fetchAllEventListings()

  // Sort once by start date
  const sorted = [...allListings].sort((a, b) =>
    a.eventStartDate.localeCompare(b.eventStartDate)
  )

  const availableStates = [
    ...new Set(
      sorted
        .flatMap((e) => e.states)
        .map((s) => s.trim().toUpperCase())
        .filter((s) => /^[A-Z]{2}$/.test(s))
    ),
  ].sort()

  const availableSanctions = [...new Set(sorted.map((e) => e.sanction))].filter((s) => s !== 'SoftballConnected')

  // Filter in-memory on the server
  let filtered = sorted
  if (selectedState !== 'all')
    filtered = filtered.filter((e) => e.states.includes(selectedState))
  if (selectedSanction !== 'all')
    filtered = filtered.filter((e) => e.sanction === selectedSanction)
  if (selectedAges.length > 0)
    filtered = filtered.filter((e) =>
      e.ageGroups.some((ag) => selectedAges.includes(ag.label))
    )
  if (selectedDateFrom)
    filtered = filtered.filter((e) => e.eventStartDate >= selectedDateFrom)
  if (selectedDateTo)
    filtered = filtered.filter((e) => e.eventStartDate <= selectedDateTo)
  if (selectedSearch.length >= 4) {
    const q = selectedSearch.toLowerCase()
    filtered = filtered.filter((e) =>
      [e.name, e.city, e.state, e.directorName, e.statureName, e.sanction]
        .some((f) => f?.toLowerCase().includes(q))
    )
  }

  // Distance filter: geocode user zip once, then geocode unique event city+state pairs
  if (selectedZip && selectedDistance) {
    const distMiles = parseInt(selectedDistance, 10)
    const origin = await geocodeZip(selectedZip)
    if (origin) {
      // Build a set of unique city+state keys to avoid redundant geocoding calls
      const cityKeys = [...new Set(
        filtered
          .filter((e) => e.city && e.state)
          .map((e) => `${e.city}|${e.state}`)
      )]

      const coordEntries = await Promise.all(
        cityKeys.map(async (key) => {
          const [city, state] = key.split('|')
          const coord = await geocodeCityState(city, state)
          return [key, coord] as const
        })
      )
      const coordMap = new Map(coordEntries)

      filtered = filtered.filter((e) => {
        if (!e.city || !e.state) return false
        const coord = coordMap.get(`${e.city}|${e.state}`)
        if (!coord) return false
        return haversineDistanceMiles(origin.lat, origin.lng, coord.lat, coord.lng) <= distMiles
      })
    }
  }

  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const safePage   = Math.min(currentPage, Math.max(1, totalPages))
  const pageSlice  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Enrich only the events on this page with per-event USSSA detail data
  const events = hasActiveFilters ? await enrichWithDetails(pageSlice) : []

  return (
    <EventsExplorer
      events={events}
      totalCount={totalCount}
      currentPage={safePage}
      availableStates={availableStates}
      availableAges={AVAILABLE_AGES}
      availableSanctions={availableSanctions}
      hasActiveFilters={hasActiveFilters}
      selectedState={selectedState}
      selectedAges={selectedAges}
      selectedDateFrom={selectedDateFrom}
      selectedDateTo={selectedDateTo}
      selectedSanction={selectedSanction}
      selectedSearch={selectedSearch}
      selectedZip={selectedZip}
      selectedDistance={selectedDistance}
    />
  )
}
