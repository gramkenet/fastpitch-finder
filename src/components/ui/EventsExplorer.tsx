import type { ScrapedEvent } from '@/types/event'
import { PAGE_SIZE } from '@/lib/constants'
import HomeHero from './HomeHero'
import FilterSidebar from './FilterSidebar'
import CardGrid from './CardGrid'
import EventCard from './EventCard'
import Pagination from './Pagination'

interface Props {
  events: ScrapedEvent[]
  totalCount: number
  currentPage: number
  availableStates: string[]
  availableAges: string[]
  availableSanctions: string[]
  hasActiveFilters: boolean
  selectedState: string
  selectedAges: string[]
  selectedDateFrom: string
  selectedDateTo: string
  selectedSanction: string
  selectedSearch: string
  selectedZip: string
  selectedDistance: string
}

export default function EventsExplorer({
  events,
  totalCount,
  currentPage,
  availableStates,
  availableAges,
  availableSanctions,
  hasActiveFilters,
  selectedState,
  selectedAges,
  selectedDateFrom,
  selectedDateTo,
  selectedSanction,
  selectedSearch,
  selectedZip,
  selectedDistance,
}: Props) {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const filterParams = new URLSearchParams()
  if (selectedState !== 'all') filterParams.set('state', selectedState)
  if (selectedAges.length > 0) filterParams.set('ages', selectedAges.join(','))
  if (selectedDateFrom) filterParams.set('dateFrom', selectedDateFrom)
  if (selectedDateTo) filterParams.set('dateTo', selectedDateTo)
  if (selectedSanction !== 'all') filterParams.set('sanction', selectedSanction)
  if (selectedZip) filterParams.set('zip', selectedZip)
  if (selectedDistance) filterParams.set('distance', selectedDistance)
  const searchBase = filterParams.toString() ? `/?${filterParams}` : '/'

  const paginationParams = new URLSearchParams(filterParams)
  if (selectedSearch.length >= 4) paginationParams.set('search', selectedSearch)
  const paginationBase = paginationParams.toString() ? `/?${paginationParams}` : '/'

  return (
    <>
      <HomeHero
        filteredCount={totalCount}
        hasActiveFilters={hasActiveFilters}
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
              selectedZip={selectedZip}
              selectedDistance={selectedDistance}
            />
          </aside>

          <section className="min-w-0">
            {!hasActiveFilters ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <p className="text-body-lg text-neutral-500">
                  Use the filters to find upcoming tournaments.
                </p>
                <p className="text-body-sm text-neutral-400">
                  Filter by state, sanction, age division, date range, or search by name.
                </p>
              </div>
            ) : events.length === 0 ? (
              <p className="text-body-lg text-neutral-500 py-16 text-center">
                No events match your filters.
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
                      currentPage={currentPage}
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
