import type { TeamClassOption, TeamRegionOption, TeamSeasonOption, UsssaTeam } from '@/types/team'
import { PAGE_SIZE } from '@/lib/constants'
import TeamFilterSidebar from './TeamFilterSidebar'
import CardGrid from './CardGrid'
import TeamCard from './TeamCard'
import Pagination from './Pagination'
import { FilterTransitionProvider } from './FilterTransition'
import PendingResults from './PendingResults'
import TeamResultsSkeleton from './TeamResultsSkeleton'

interface Props {
  teams: UsssaTeam[]
  totalCount: number
  currentPage: number
  availableRegions: TeamRegionOption[]
  availableClasses: TeamClassOption[]
  availableSeasons: TeamSeasonOption[]
  hasActiveFilters: boolean
  selectedTeamName: string
  selectedRegion: string
  selectedClass: string
  selectedSeason: string
}

export default function TeamsExplorer({
  teams,
  totalCount,
  currentPage,
  availableRegions,
  availableClasses,
  availableSeasons,
  hasActiveFilters,
  selectedTeamName,
  selectedRegion,
  selectedClass,
  selectedSeason,
}: Props) {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const paginationParams = new URLSearchParams()
  if (selectedTeamName.length >= 2) paginationParams.set('q', selectedTeamName)
  if (selectedRegion !== 'all') paginationParams.set('region', selectedRegion)
  if (selectedClass !== 'all') paginationParams.set('class', selectedClass)
  if (selectedSeason) paginationParams.set('season', selectedSeason)
  const paginationBase = paginationParams.toString() ? `/teams?${paginationParams}` : '/teams'

  return (
    <FilterTransitionProvider>
      <div className="container-page section-gap-sm">
        <header className="mb-8">
          <p className="text-label-lg text-primary-600 dark:text-primary-400 mb-2">Team Directory</p>
          <h1 className="text-display-md text-neutral-900">Find a Team</h1>
          {hasActiveFilters && totalCount > 0 && (
            <p className="text-body-lg text-neutral-600 mt-3">
              {totalCount} {totalCount === 1 ? 'team' : 'teams'} found
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          <aside className="lg:sticky lg:top-28">
            <TeamFilterSidebar
              availableRegions={availableRegions}
              availableClasses={availableClasses}
              availableSeasons={availableSeasons}
              selectedTeamName={selectedTeamName}
              selectedRegion={selectedRegion}
              selectedClass={selectedClass}
              selectedSeason={selectedSeason}
            />
          </aside>

          <section className="min-w-0">
            <PendingResults skeleton={<TeamResultsSkeleton />}>
              {!hasActiveFilters ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <p className="text-body-lg text-neutral-500">
                    Use the filters to find a team.
                  </p>
                  <p className="text-body-sm text-neutral-400">
                    Search by team name, region/state, or classification.
                  </p>
                </div>
              ) : teams.length === 0 ? (
                <p className="text-body-lg text-neutral-500 py-16 text-center">
                  No teams match your search.
                </p>
              ) : (
                <>
                  <CardGrid columns={3}>
                    {teams.map((team) => (
                      <TeamCard key={team.teamId} team={team} />
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
            </PendingResults>
          </section>
        </div>
      </div>
    </FilterTransitionProvider>
  )
}
