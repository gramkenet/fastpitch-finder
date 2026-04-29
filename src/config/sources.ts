// Underlying data API — the Scori service that powers USSSA event searches.
// State filtering is not enforced server-side; the scraper filters client-side
// using the `states` list derived from each source's region parameter.
const SCORI_API = 'https://sportsvc.usssa.com/api/event/filter'

export interface EventSourceConfig {
  id: string
  label: string
  region: string
  sanction: string   // governing body, e.g. "USSSA" or "USA Softball"
  /** Human-facing reference URL (the page a user would visit) */
  url: string
  api: {
    endpoint: string
    sportId: number
    /** State codes to include; maps the USSSA regionID to actual states */
    states: string[]
  }
}

export const EVENT_SOURCES: EventSourceConfig[] = [
  {
    id: 'usssa-mo-fastpitch',
    label: 'USSSA Fastpitch',
    region: 'Missouri',
    sanction: 'USSSA',
    url: 'https://www.usssa.com/fastpitch/eventSearch/?sportID=16&seasonID=30&region=690&period=0',
    api: {
      endpoint: SCORI_API,
      sportId: 16, // Fastpitch
      // Empty = no state restriction; all states returned by the API are included.
      states: [],
    },
  },
]
