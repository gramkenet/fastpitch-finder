import { currentTeamSeasonId, fetchTeamClasses, fetchTeamSearchFields, searchTeams } from '@/lib/usssaTeams'
import TeamsExplorer from '@/components/ui/TeamsExplorer'
import { PAGE_SIZE } from '@/lib/constants'

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const str = (key: string) => (typeof sp[key] === 'string' ? sp[key] : undefined)

  const selectedTeamName = str('q') ?? ''
  const selectedRegion   = str('region') ?? 'all'
  const selectedClass    = str('class') ?? 'all'
  const selectedSeason   = str('season') ?? currentTeamSeasonId()
  const currentPage      = Math.max(1, parseInt(str('page') ?? '1', 10))

  const hasActiveFilters =
    selectedTeamName.length >= 2 ||
    selectedRegion !== 'all' ||
    selectedClass !== 'all'

  const [{ regions, seasons }, classes] = await Promise.all([
    fetchTeamSearchFields(),
    fetchTeamClasses(),
  ])

  const teams = hasActiveFilters
    ? await searchTeams({
        teamName: selectedTeamName,
        regionId: selectedRegion === 'all' ? '0' : selectedRegion,
        classId: selectedClass === 'all' ? '0' : selectedClass,
        seasonId: selectedSeason,
      })
    : []

  const totalCount = teams.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const safePage   = Math.min(currentPage, Math.max(1, totalPages))
  const pageSlice  = teams.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <TeamsExplorer
      teams={pageSlice}
      totalCount={totalCount}
      currentPage={safePage}
      availableRegions={regions}
      availableClasses={classes}
      availableSeasons={seasons}
      hasActiveFilters={hasActiveFilters}
      selectedTeamName={selectedTeamName}
      selectedRegion={selectedRegion}
      selectedClass={selectedClass}
      selectedSeason={selectedSeason}
    />
  )
}
