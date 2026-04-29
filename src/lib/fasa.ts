import type { AgeGroup, ScrapedEvent } from '@/types/event'

const FASA_LOGO = 'https://playfasa.com/IMAGES/logo/FASANew%20Logo.png'

const STATURE_LABELS: Record<string, string> = {
  SQ:   'State Qualifier',
  NIT:  'NIT',
  RQ:   'Regional Qualifier',
  SC:   'Showcase',
  MVP:  'MVP Event',
  SMVP: 'State MVP',
  ST:   'State Tournament',
  NT:   'National Tournament',
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// MM/DD/YYYY → YYYY-MM-DD
function parseFASADate(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null
}

// Extract numeric age values from age=XU URL params in the cell HTML
function parseAgeGroups(cellHtml: string): AgeGroup[] {
  const ages = new Map<number, true>()
  for (const m of cellHtml.matchAll(/age=(\d+)U/gi)) {
    ages.set(parseInt(m[1], 10), true)
  }
  return [...ages.keys()].sort((a, b) => a - b).map((age) => ({
    label: `${age}U`,
    teamCount: null,
  }))
}

function parseFee(s: string): { min: number | null; max: number | null } {
  const m = s.match(/\$(\d+)/)
  if (m) { const v = parseInt(m[1], 10); return { min: v, max: v } }
  return { min: null, max: null }
}

export async function fetchFASAEvents(): Promise<ScrapedEvent[]> {
  let html: string
  try {
    const res = await fetch('https://playfasa.com/search.asp', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FastPitchFinder/1.0)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      console.error(`FASA search: HTTP ${res.status}`)
      return []
    }
    html = await res.text()
  } catch (err) {
    console.error('FASA search fetch failed:', err)
    return []
  }

  // Find the events table by locating the header row that contains "TOURNAMENT NAME"
  const tableStarts = [...html.matchAll(/<table/gi)].map((m) => m.index as number)
  const tableEnds   = [...html.matchAll(/<\/table>/gi)].map((m) => m.index as number)

  let eventsTable = ''
  for (let i = 0; i < tableStarts.length; i++) {
    const slice = html.slice(tableStarts[i], tableEnds[i] + 8)
    if (/TOURNAMENT NAME/i.test(slice)) {
      eventsTable = slice
      break
    }
  }
  if (!eventsTable) return []

  const rows = [...eventsTable.matchAll(/<tr[\s\S]*?<\/tr>/g)]
  const now = new Date()
  const events: ScrapedEvent[] = []

  for (const rowMatch of rows) {
    const rawRow = rowMatch[0]

    // Extract raw cell HTML (before stripping, so we can parse links from age cell)
    const rawCells = [...rawRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1])
    if (rawCells.length < 15) continue

    // Column 0: tournament ID from jointrny.asp?ID=...
    const idMatch = rawCells[0].match(/[?&]ID=(\d+)/i)
    if (!idMatch) continue
    const tournamentId = parseInt(idMatch[1], 10)

    const cells = rawCells.map((c) => stripTags(decodeHtml(c)))

    const start = parseFASADate(cells[2].trim())
    const end   = parseFASADate(cells[3].trim())
    if (!start || !end || new Date(end) < now) continue

    const name = cells[1].trim()
    if (!name) continue

    const registrationDeadline = parseFASADate(cells[4].trim())
    const city  = cells[5].trim() || null
    const rawState = cells[6].trim()
    const state = /^[A-Z]{2}$/.test(rawState) ? rawState : null
    const typeCode = cells[9].trim()
    const teamCount = parseInt(cells[15], 10) || null

    events.push({
      id: `fasa::${tournamentId}`,
      name,
      href: `https://playfasa.com/profile.asp?ID=${tournamentId}`,
      eventStartDate: start,
      eventEndDate: end,
      city,
      state,
      states: state ? [state] : [],
      statureName: (STATURE_LABELS[typeCode] ?? typeCode) || null,
      maxAgeGroup: null,
      ageGroups: parseAgeGroups(rawCells[7]),
      teamCount,
      teamApprovedCount: null,
      divisionCount: null,
      logoUrl: FASA_LOGO,
      directorName: cells[12].trim() || null,
      sourceId: 'fasa',
      sourceLabel: 'FASA',
      sourceRegion: state ?? 'National',
      sanction: 'FASA',
      entryFee: parseFee(cells[11]),
      registrationDeadline,
      venueName: null,
    })
  }

  return events
}
