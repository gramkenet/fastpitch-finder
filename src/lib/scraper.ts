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
  totalResultCount: number
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
    const deadlines = divisions
      .map((d) => d.lastEntryDate)
      .filter((d): d is string => !!d)
      .sort()
    return {
      ageGroups: extractAgeGroups(divisions),
      entryFee: { min: data.minEntryFee ?? null, max: data.maxEntryFee ?? null },
      registrationDeadline: deadlines[0] ?? null,
      venueName: data.venues?.[0]?.name ?? null,
    }
  } catch {
    return EMPTY_DETAILS
  }
}

const SCORI_PAGE_SIZE = 500

async function fetchScoriPage(
  source: EventSourceConfig,
  page: number
): Promise<ScoriListResponse | null> {
  const res = await fetch(source.api.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      PageIndex: page,
      PageSize: SCORI_PAGE_SIZE,
      SportId: { FilterValue: source.api.sportId },
    }),
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    console.error(`Scori API error for source "${source.id}" page ${page}: ${res.status}`)
    return null
  }
  return res.json()
}

// Fetches all USSSA event list pages without per-event detail calls.
// ageGroups is approximated from maxAgeGroup; entryFee/venueName/registrationDeadline are null.
async function fetchSourceListings(source: EventSourceConfig): Promise<ScrapedEvent[]> {
  const firstPage = await fetchScoriPage(source, 1)
  if (!firstPage) return []

  const totalPages = Math.ceil(firstPage.totalResultCount / SCORI_PAGE_SIZE)
  const restPages = totalPages > 1
    ? await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) => fetchScoriPage(source, i + 2))
      )
    : []

  const allResults = [
    ...firstPage.currentPageResults,
    ...restPages.flatMap((p) => p?.currentPageResults ?? []),
  ]

  const now = new Date()
  const stateSet = new Set(source.api.states)

  return allResults
    .filter((e) => {
      if (stateSet.size > 0 && (!e.state || !stateSet.has(e.state))) return false
      return new Date(e.eventEndDate) >= now
    })
    .map((e) => ({
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
      // Approximate: maxAgeGroup is the ceiling division; used for listing-level age filtering
      ageGroups: e.maxAgeGroup ? [{ label: `${e.maxAgeGroup}U`, teamCount: null }] : [],
      teamCount: e.teamCount ?? null,
      teamApprovedCount: e.teamApprovedCount ?? null,
      divisionCount: e.divisionCount ?? null,
      logoUrl: e.logoUrl ?? null,
      directorName: e.eventDirectorContact?.name ?? null,
      sourceId: source.id,
      sourceLabel: source.label,
      sourceRegion: source.region,
      sanction: source.sanction,
      entryFee: { min: null, max: null },
      registrationDeadline: null,
      venueName: null,
    }))
}

// Fetches per-event detail data for the given events (USSSA only).
// Non-USSSA events are returned unchanged.
export async function enrichWithDetails(events: ScrapedEvent[]): Promise<ScrapedEvent[]> {
  const usssaEvents = events.filter((e) => e.usssaId !== undefined)
  if (usssaEvents.length === 0) return events

  const details = await Promise.all(usssaEvents.map((e) => fetchEventDetails(e.usssaId!)))
  const detailMap = new Map(usssaEvents.map((e, i) => [e.usssaId!, details[i]]))

  return events.map((e) => {
    if (e.usssaId === undefined) return e
    const d = detailMap.get(e.usssaId)
    if (!d) return e
    return {
      ...e,
      ageGroups: d.ageGroups,
      entryFee: d.entryFee,
      registrationDeadline: d.registrationDeadline,
      venueName: d.venueName,
    }
  })
}

function normalizeForDedup(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b20\d\d\b/g, '')       // strip years
    .replace(/[^a-z0-9\s]/g, ' ')     // strip punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

function deduplicateEvents(events: ScrapedEvent[]): ScrapedEvent[] {
  const kept: ScrapedEvent[] = []
  const keptNorms: Array<{ name: string; state: string; startMs: number }> = []

  for (const e of events) {
    const normName = normalizeForDedup(e.name)
    const state = e.state?.toUpperCase() ?? ''
    const startMs = new Date(e.eventStartDate).getTime()

    const isDup = keptNorms.some((k) => {
      if (k.state !== state) return false
      if (Math.abs(k.startMs - startMs) > 7 * 86_400_000) return false
      return k.name === normName
    })

    if (!isDup) {
      kept.push(e)
      keptNorms.push({ name: normName, state, startMs })
    }
  }

  return kept
}

// Returns all events from all sources without USSSA per-event detail enrichment.
// SC events are added last so primary-source events take precedence in deduplication.
export async function fetchAllEventListings(): Promise<ScrapedEvent[]> {
  const { fetchTournamentMVPEvents } = await import('./tournamentmvp')
  const { fetchFASAEvents } = await import('./fasa')
  const [usssaResults, tmvpEvents, fasaEvents] = await Promise.all([
    Promise.all(EVENT_SOURCES.map(fetchSourceListings)),
    fetchTournamentMVPEvents(),
    fetchFASAEvents(),
  ])
  const all = [...usssaResults.flat(), ...tmvpEvents, ...fasaEvents]
  return deduplicateEvents(all)
}
