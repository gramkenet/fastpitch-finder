import type { AgeGroup, ScrapedEvent } from '@/types/event'

// Affiliates whose pages we scrape. SID=1 (Girls Fastpitch) is always the first table.
const AFFILIATES = [
  { id: 13, state: 'MO', region: 'MO', filterStates: ['MO'] },
  { id: 10, state: 'KS', region: 'KS', filterStates: ['KS', 'MO'] },  // KC metro spans both states
  { id: 15, state: 'KS', region: 'KS', filterStates: ['KS'] },
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
  const same = text.match(/^(\w{3})\s+(\d{1,2})\s*-\s*(\d{1,2}),\s*(\d{4})/)
  if (same) {
    const [, mon, d1, d2, yr] = same
    const m = MONTH[mon]
    if (!m) return null
    return { start: `${yr}-${m}-${d1.padStart(2, '0')}`, end: `${yr}-${m}-${d2.padStart(2, '0')}` }
  }
  const cross = text.match(/^(\w{3})\s+(\d{1,2})\s*-\s*(\w{3})\s+(\d{1,2}),\s*(\d{4})/)
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

function parseAffiliatePage(html: string, aff: (typeof AFFILIATES)[0], now: Date): ScrapedEvent[] {
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/)
  if (!tableMatch) return []

  const events: ScrapedEvent[] = []

  for (const rowMatch of [...tableMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/g)]) {
    const rawRow = rowMatch[0]

    const cells = [...rawRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(c => stripTags(decodeHtml(c[1])))
    if (cells.length !== 6) continue

    const idMatch = rawRow.match(/tournament-registration\/(\d+)/)
    if (!idMatch) continue
    const tournamentId = parseInt(idMatch[1], 10)

    const dates = parseDateRange(cells[0].trim())
    if (!dates || new Date(dates.end) < now) continue

    const nameCell = cells[1]
    const dirIdx = nameCell.indexOf('Director:')
    const name = (dirIdx >= 0 ? nameCell.slice(0, dirIdx) : nameCell).trim()
    const directorName = dirIdx >= 0
      ? nameCell.slice(dirIdx + 'Director:'.length).trim() || null
      : null
    if (!name) continue

    events.push({
      id: `tmvp-${aff.id}::${tournamentId}`,
      tmvpId: tournamentId,
      name,
      href: `https://tournamentmvp.com/tournament-registration/${tournamentId}`,
      eventStartDate: dates.start,
      eventEndDate: dates.end,
      city: null,
      state: aff.state,
      states: aff.filterStates,
      statureName: null,
      maxAgeGroup: null,
      ageGroups: parseAgeGroups(cells[3]),
      teamCount: parseInt(cells[4], 10) || null,
      teamApprovedCount: null,
      divisionCount: null,
      logoUrl: `https://tournamentmvp.com/assets/img/logos/${aff.id}.png`,
      directorName,
      sourceId: `tmvp-${aff.id}`,
      sourceLabel: 'TMVP',
      sourceRegion: aff.region,
      sanction: 'USA Softball',
      entryFee: parseFee(cells[5]),
      registrationDeadline: null,
      venueName: cells[2].trim() || null,
    })
  }

  return events
}

async function fetchAffiliatePage(affId: number, page: number): Promise<string | null> {
  const url = page === 1
    ? `https://tournamentmvp.com/affiliate/${affId}`
    : `https://tournamentmvp.com/affiliate/${affId}?page=${page}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FastPitchFinder/1.0)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      console.error(`TMVP affiliate ${affId} page ${page}: HTTP ${res.status}`)
      return null
    }
    return res.text()
  } catch (err) {
    console.error(`TMVP affiliate ${affId} page ${page} fetch failed:`, err)
    return null
  }
}

function maxPageNumber(html: string): number {
  let max = 1
  for (const m of html.matchAll(/gotoPage\((\d+)/g)) {
    const n = parseInt(m[1], 10)
    if (n > max) max = n
  }
  return max
}

async function fetchAffiliate(
  aff: (typeof AFFILIATES)[0]
): Promise<ScrapedEvent[]> {
  const firstHtml = await fetchAffiliatePage(aff.id, 1)
  if (!firstHtml) return []

  const totalPages = maxPageNumber(firstHtml)
  const now = new Date()

  let allHtml = [firstHtml]
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchAffiliatePage(aff.id, i + 2))
    )
    allHtml = [firstHtml, ...rest.filter((h): h is string => h !== null)]
  }

  return allHtml.flatMap(html => parseAffiliatePage(html, aff, now))
}

export async function fetchTournamentMVPEvents(): Promise<ScrapedEvent[]> {
  const results = await Promise.all(AFFILIATES.map(fetchAffiliate))
  return results.flat()
}
