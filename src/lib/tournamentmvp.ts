import type { AgeGroup, ScrapedEvent } from '@/types/event'

// Affiliates whose pages we scrape. SID=1 (Girls Fastpitch) is always the first table.
const AFFILIATES = [
  { id: 13, state: 'MO', region: 'MO' },  // USA Softball of Missouri
  { id: 10, state: 'KS', region: 'KS' },  // USA Softball of Kansas City
  { id: 15, state: 'KS', region: 'KS' },  // USA Softball of Kansas
]

const MONTH: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Handles "May 02 - 03, 2026" and "May 30 - Jun 01, 2026"
function parseDateRange(text: string): { start: string; end: string } | null {
  const same = text.match(/^(\w{3})\s+(\d{1,2})\s*-\s*(\d{1,2}),\s*(\d{4})$/)
  if (same) {
    const [, mon, d1, d2, yr] = same
    const m = MONTH[mon]
    if (!m) return null
    return { start: `${yr}-${m}-${d1.padStart(2, '0')}`, end: `${yr}-${m}-${d2.padStart(2, '0')}` }
  }
  const cross = text.match(/^(\w{3})\s+(\d{1,2})\s*-\s*(\w{3})\s+(\d{1,2}),\s*(\d{4})$/)
  if (cross) {
    const [, mon1, d1, mon2, d2, yr] = cross
    const m1 = MONTH[mon1], m2 = MONTH[mon2]
    if (!m1 || !m2) return null
    return { start: `${yr}-${m1}-${d1.padStart(2, '0')}`, end: `${yr}-${m2}-${d2.padStart(2, '0')}` }
  }
  return null
}

function parseFee(text: string): { min: number | null; max: number | null } {
  const m = text.match(/\$(\d+)/)
  if (m) { const v = parseInt(m[1], 10); return { min: v, max: v } }
  return { min: null, max: null }
}

// Handles "8U-C", "10U-Open", "12U-C/Open", "16-18U-C", etc.
function parseAgeGroups(text: string): AgeGroup[] {
  const ages = new Map<number, true>()
  for (const part of text.trim().split(/\s+/)) {
    const m = part.match(/^(\d+)(?:-\d+)?[Uu]/)
    if (m) ages.set(parseInt(m[1], 10), true)
  }
  return [...ages.keys()].sort((a, b) => a - b).map(age => ({ label: `${age}U`, teamCount: null }))
}

async function fetchAffiliate(
  aff: (typeof AFFILIATES)[0]
): Promise<ScrapedEvent[]> {
  let html: string
  try {
    const res = await fetch(`https://tournamentmvp.com/affiliate/${aff.id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FastPitchFinder/1.0)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      console.error(`TMVP affiliate ${aff.id}: HTTP ${res.status}`)
      return []
    }
    html = await res.text()
  } catch (err) {
    console.error(`TMVP affiliate ${aff.id} fetch failed:`, err)
    return []
  }

  // First <table> on the page is always the SID=1 (Girls Fastpitch) listing.
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/)
  if (!tableMatch) return []

  const rows = [...tableMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/g)]
  const now = new Date()
  const events: ScrapedEvent[] = []

  for (const rowMatch of rows) {
    const rawRow = rowMatch[0]

    // Desktop rows have exactly 6 <td> cells; mobile card rows have 1 — skip the rest.
    const cells = [...rawRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(c => stripTags(decodeHtml(c[1])))
    if (cells.length !== 6) continue

    // Tournament ID lives in the link inside the date cell (cell 0).
    const idMatch = rawRow.match(/tournament-registration\/(\d+)/)
    if (!idMatch) continue
    const tournamentId = parseInt(idMatch[1], 10)

    const dates = parseDateRange(cells[0].trim())
    if (!dates || new Date(dates.end) < now) continue

    // Cell 1: "Tournament Name Director: Director Name"
    const nameCell = cells[1]
    const dirIdx = nameCell.indexOf('Director:')
    const name = (dirIdx >= 0 ? nameCell.slice(0, dirIdx) : nameCell).trim()
    const directorName = dirIdx >= 0
      ? nameCell.slice(dirIdx + 'Director:'.length).trim() || null
      : null
    if (!name) continue

    const venueName = cells[2].trim() || null
    const ageGroups = parseAgeGroups(cells[3])
    const teamCount = parseInt(cells[4], 10) || null
    const entryFee = parseFee(cells[5])

    events.push({
      id: `tmvp-${aff.id}::${tournamentId}`,
      name,
      href: `https://tournamentmvp.com/tournament-registration/${tournamentId}`,
      eventStartDate: dates.start,
      eventEndDate: dates.end,
      city: null,
      state: aff.state,
      statureName: null,
      maxAgeGroup: null,
      ageGroups,
      teamCount,
      teamApprovedCount: null,
      divisionCount: null,
      logoUrl: `https://tournamentmvp.com/assets/img/logos/${aff.id}.png`,
      directorName,
      sourceId: `tmvp-${aff.id}`,
      sourceLabel: 'TMVP',
      sourceRegion: aff.region,
      sanction: 'USA Softball',
      entryFee,
      registrationDeadline: null,
      venueName,
    })
  }

  return events
}

export async function fetchTournamentMVPEvents(): Promise<ScrapedEvent[]> {
  const results = await Promise.all(AFFILIATES.map(fetchAffiliate))
  return results.flat()
}
