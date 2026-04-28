import SearchInput from './SearchInput'

interface Props {
  filteredCount: number
  selectedSearch: string
  searchBase: string
}

export default function HomeHero({ filteredCount, selectedSearch, searchBase }: Props) {
  return (
    <section
      id="page-hero"
      className="w-full bg-navy-900"
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.045) 1.5px, transparent 1.5px)',
        backgroundSize: '26px 26px',
      }}
    >
      <div className="container-page py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label-lg text-primary-400 mb-2">Upcoming Events</p>
            <h1 className="text-display-md text-white mb-1.5">Find Your Next Tournament</h1>
            <p className="text-body-md text-navy-300 min-h-[1.5rem]">
              {filteredCount > 0 ? `${filteredCount} events available` : ''}
            </p>
          </div>
          <div className="shrink-0">
            <SearchInput
              selectedSearch={selectedSearch}
              searchBase={searchBase}
              className="w-full sm:w-80"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
