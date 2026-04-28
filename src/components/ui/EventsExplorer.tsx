'use client'

import { useSearchParams } from 'next/navigation'
import type { ScrapedEvent } from '@/types/event'
import HomeHero from './HomeHero'
import FilterSidebar from './FilterSidebar'
import CardGrid from './CardGrid'
import EventCard from './EventCard'
import Pagination from './Pagination'

const PAGE_SIZE = 24

interface Props {
  allEvents: ScrapedEvent[]
  availableStates: string[]
  availableAges: string[]
  availableSanctions: string[]
}

export default function EventsExplorer({
  allEvents,
  availableStates,
  availableAges,
  availableSanctions,
}: Props) {
  const searchParams = useSearchParams()

  const selectedState    = searchParams.get('state')   ?? 'MO'
  const selectedAges     = searchParams.get('ages')?.split(',').filter(Boolean) ?? []
  const selectedDateFrom = searchParams.get('dateFrom') ?? ''
  const selectedDateTo   = searchParams.get('dateTo')   ?? ''
  const selectedSanction = searchParams.get('sanction') ?? 'all'
  const selectedSearch   = searchParams.get('search')   ?? ''
  const currentPage      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  let filtered = selectedState === 'all'
    ? allEvents
    : allEvents.filter((e) => e.state === selectedState)

  if (selectedAges.length > 0) {
    filtered = filtered.filter((e) =>
      e.ageGroups.some((ag) => selectedAges.includes(ag.label))
    )
  }
  if (selectedDateFrom) filtered = filtered.filter((e) => e.eventStartDate >= selectedDateFrom)
  if (selectedDateTo)   filtered = filtered.filter((e) => e.eventStartDate <= selectedDateTo)
  if (selectedSanction !== 'all') filtered = filtered.filter((e) => e.sanction === selectedSanction)

  if (selectedSearch.length >= 4) {
    const q = selectedSearch.toLowerCase()
    filtered = filtered.filter((e) =>
      [e.name, e.city, e.state, e.venueName, e.directorName, e.statureName, e.sanction,
        ...e.ageGroups.map((ag) => ag.label)]
        .some((field) => field?.toLowerCase().includes(q))
    )
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage   = Math.min(currentPage, Math.max(1, totalPages))
  const events     = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const filterParams = new URLSearchParams()
  if (selectedState !== 'MO') filterParams.set('state', selectedState)
  if (selectedAges.length > 0) filterParams.set('ages', selectedAges.join(','))
  if (selectedDateFrom) filterParams.set('dateFrom', selectedDateFrom)
  if (selectedDateTo)   filterParams.set('dateTo', selectedDateTo)
  if (selectedSanction !== 'all') filterParams.set('sanction', selectedSanction)
  const searchBase = filterParams.toString() ? `/?${filterParams}` : '/'

  const paginationParams = new URLSearchParams(filterParams)
  if (selectedSearch.length >= 4) paginationParams.set('search', selectedSearch)
  const paginationBase = paginationParams.toString() ? `/?${paginationParams}` : '/'

  return (
    <>
      <HomeHero
        filteredCount={filtered.length}
        selectedSearch={selectedSearch}
        searchBase={searchBase}
      />

      <div className="container-page section-gap-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          <aside className="lg:sticky lg:top-28">
            <FilterSidebar
              availableStates={availableStates}
              availableAges={availableAges}
              availableSanctions={availableSanctions}
              selectedState={selectedState}
              selectedAges={selectedAges}
              selectedDateFrom={selectedDateFrom}
              selectedDateTo={selectedDateTo}
              selectedSanction={selectedSanction}
              selectedSearch={selectedSearch}
            />
          </aside>

          <section className="min-w-0">
            {filtered.length === 0 ? (
              <p className="text-body-lg text-neutral-500">
                No events found. Try adjusting your filters.
              </p>
            ) : (
              <>
                <CardGrid columns={1}>
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </CardGrid>

                {totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination
                      currentPage={safePage}
                      totalPages={totalPages}
                      basePath={paginationBase}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
