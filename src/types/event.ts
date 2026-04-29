export interface AgeGroup {
  label: string        // e.g. "12U"
  teamCount: number | null  // sum of approved/registered teams across all divisions for this age
}

export interface TeamSummary {
  teamId: number
  teamName: string
  stateABR: string
}

export interface DivisionTeams {
  divisionId: number
  divisionName: string
  classId: number
  teamsSummaryLwc: TeamSummary[]
}

export interface ScrapedEvent {
  id: string           // "{sourceId}::{eventId}"
  usssaId?: number     // numeric USSSA event ID; undefined for non-USSSA sources
  tmvpId?: number      // TournamentMVP tournament ID; undefined for non-TMVP sources
  name: string
  href: string         // https://www.usssa.com/fastpitch/event-details/?id={usssaEventId}
  eventStartDate: string  // ISO 8601
  eventEndDate: string    // ISO 8601
  city: string | null
  state: string | null
  states: string[]          // all states this event is visible under in the filter
  statureName: string | null   // "Tournament", "League", "Non Qualifier", etc.
  maxAgeGroup: number | null   // 0 = open / all ages; 14 = 14U and under
  ageGroups: AgeGroup[]        // from divisions endpoint, grouped by age number
  teamCount: number | null
  teamApprovedCount: number | null
  divisionCount: number | null
  logoUrl: string | null
  directorName: string | null
  sourceId: string
  sourceLabel: string
  sourceRegion: string
  sanction: string          // governing body, e.g. "USSSA" or "USA Softball"
  entryFee: { min: number | null; max: number | null }
  registrationDeadline: string | null  // ISO 8601 — soonest lastEntryDate across divisions
  venueName: string | null             // first venue name from detail endpoint
}
