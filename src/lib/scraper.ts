import { EVENT_SOURCES, type EventSourceConfig } from '@/config/sources'
import type { AgeGroup, ScrapedEvent } from '@/types/event'

interface ScoriListEvent {
  id: number
  name: string
  eventStartDate: string
  eventEndDate: string
  city: string | null
  state: string | null
  statureName: string | null
  maxAgeGroup: number
  teamCount: number | null
  teamApprovedCount: number | null
  divisionCount: number | null
  logoUrl: string | null
  eventDirectorContact?: { name?: string | null } | null
}

interface ScoriListResponse {
  currentPageResults: ScoriListEvent[]
}

interface ScoriDivision {
  competitiveClassShortName: string | null
  teamApprovedCount: number | null
  teamCount: number | null
  lastEntryDate: string | null
}

interface ScoriVenue {
  name: string
}

interface ScoriDetailEvent {
  minEntryFee?: number | null
  maxEntryFee?: number | null
  venues?: ScoriVenue[]
  divisions?: ScoriDivision[]
}

interface EventDetails {
  ageGroups: AgeGroup[]
  entryFee: { min: number | null; max: number | null }
  registrationDeadline: string | null
  venueName: string | null
}

const EMPTY_DETAILS: EventDetails = {
  ageGroups: [],
  entryFee: { min: null, max: null },
  registrationDeadline: null,
  venueName: null,
}

function extractAgeGroups(divisions: ScoriDivision[]): AgeGroup[] {
  const ageMap = new Map<number, { sum: number; hasData: boolean }>()
  for (const div of divisions) {
    const m = div.competitiveClassShortName?.match(/^(\d+)/)
    if (!m) continue
    const age = parseInt(m[1], 10)
    const count = div.teamApprovedCount ?? div.teamCount
    const entry = ageMap.get(age) ?? { sum: 0, hasData: false }
    if (count != null) {
      entry.sum += count
      entry.hasData = true
    }
    ageMap.set(age, entry)
  }
  return Array.from(ageMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([age, { sum, hasData }]) => ({
      label: `${age}U`,
      teamCount: hasData ? sum : null,
    }))
}

async function fetchEventDetails(eventId: number): Promise<EventDetails> {
  try {
    const res = await fetch(
      `https://sportsvc.usssa.com/api/event/${eventId}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return EMPTY_DETAILS
    const data: ScoriDetailEvent = await res.json()

    const divisions = data.divisions ?? []

    // Soonest registration deadline across all divisions
    const deadlines = divisions
      .map((d) => d.lastEntryDate)
      .filter((d): d is string => !!d)
      .sort()
    const registrationDeadline = deadlines[0] ?? null

    return {
      ageGroups: extractAgeGroups(divisions),
      entryFee: {
        min: data.minEntryFee ?? null,
        max: data.maxEntryFee ?? null,
      },
      registrationDeadline,
      venueName: data.venues?.[0]?.name ?? null,
    }
  } catch {
    return EMPTY_DETAILS
  }
}

async function fetchSource(source: EventSourceConfig): Promise<ScrapedEvent[]> {
  const res = await fetch(source.api.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      PageIndex: 1,
      PageSize: 5000,
      SportId: { FilterValue: source.api.sportId },
    }),
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    console.error(`Scori API error for source "${source.id}": ${res.status}`)
    return []
  }

  const data: ScoriListResponse = await res.json()
  const now = new Date()
  const stateSet = new Set(source.api.states)

  const filtered = data.currentPageResults.filter((e) => {
    if (!e.state || !stateSet.has(e.state)) return false
    return new Date(e.eventEndDate) >= now
  })

  // Sort first so detail-fetch index aligns with final map index
  const sorted = [...filtered].sort((a, b) =>
    a.eventStartDate.localeCompare(b.eventStartDate)
  )

  // Fetch details for all events in parallel (each cached 1h)
  const details = await Promise.all(sorted.map((e) => fetchEventDetails(e.id)))

  return sorted.map((e, i) => ({
    id: `${source.id}::${e.id}`,
    usssaId: e.id,
    name: e.name,
    href: `https://www.usssa.com/fastpitch/event_home/?eventID=${e.id}`,
    eventStartDate: e.eventStartDate,
    eventEndDate: e.eventEndDate,
    city: e.city ?? null,
    state: e.state ?? null,
    states: e.state ? [e.state] : [],
    statureName: e.statureName ?? null,
    maxAgeGroup: e.maxAgeGroup || null,
    ageGroups: details[i].ageGroups,
    teamCount: e.teamCount ?? null,
    teamApprovedCount: e.teamApprovedCount ?? null,
    divisionCount: e.divisionCount ?? null,
    logoUrl: e.logoUrl ?? null,
    directorName: e.eventDirectorContact?.name ?? null,
    sourceId: source.id,
    sourceLabel: source.label,
    sourceRegion: source.region,
    sanction: source.sanction,
    entryFee: details[i].entryFee,
    registrationDeadline: details[i].registrationDeadline,
    venueName: details[i].venueName,
  }))
}

export async function fetchAllEvents(): Promise<ScrapedEvent[]> {
  const { fetchTournamentMVPEvents } = await import('./tournamentmvp')
  const [usssaResults, tmvpEvents] = await Promise.all([
    Promise.all(EVENT_SOURCES.map(fetchSource)),
    fetchTournamentMVPEvents(),
  ])
  return [...usssaResults.flat(), ...tmvpEvents]
}
