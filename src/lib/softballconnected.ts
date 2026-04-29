import type { AgeGroup, ScrapedEvent } from '@/types/event'

const STATE_CODES: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
}

// "MM-DD-YYYY" → "YYYY-MM-DD"
function parseSCDate(s: string): string | null {
  const m = s.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/)
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null
}

function parseAgeGroups(text: string): AgeGroup[] {
  const ages = new Set<number>()
  for (const m of text.matchAll(/(\d+)U/gi)) ages.add(parseInt(m[1], 10))
  return [...ages].sort((a, b) => a - b).map(age => ({ label: `${age}U`, teamCount: null }))
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function detectSanction(orgName: string): string {
  const lower = orgName.toLowerCase()
  if (lower.includes('usa softball')) return 'USA Softball'
  if (lower.includes('usssa')) return 'USSSA'
  if (lower.includes(' nsa ') || lower.startsWith('nsa ') || lower.endsWith(' nsa')) return 'NSA'
  if (lower.includes('fasa')) return 'FASA'
  return 'SoftballConnected'
}

function getCell(rowHtml: string, title: string): string | null {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = rowHtml.match(new RegExp(`data-title='${escaped}'>([\\s\\S]*?)<\\/td>`))
  return m ? m[1].trim() : null
}

function totalPages(html: string): number {
  const m = html.match(/of\s+([\d,]+)\s+results?/i)
  if (!m) return 1
  return Math.ceil(parseInt(m[1].replace(/,/g, ''), 10) / 50)
}

function parsePage(html: string, now: Date): ScrapedEvent[] {
  const events: ScrapedEvent[] = []
  const rowMatches = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]

  for (const row of rowMatches) {
    const rowHtml = row[1]

    // Must have a /tournaments/ link
    const tournamentCell = getCell(rowHtml, 'Tournament')
    if (!tournamentCell) continue
    const hrefMatch = tournamentCell.match(/href='(https:\/\/www\.softballconnected\.com\/tournaments\/[^']+)'/)
    if (!hrefMatch) continue
    const href = hrefMatch[1]

    const name = stripTags(tournamentCell)
    if (!name) continue

    // Slug used as stable ID
    const slugMatch = href.match(/\/tournaments\/(.+)$/)
    if (!slugMatch) continue
    const slug = slugMatch[1]

    // Dates
    const startRaw = getCell(rowHtml, 'Start Date')
    const endRaw   = getCell(rowHtml, 'End Date')
    const startDate = parseSCDate(startRaw ?? '')
    const endDate   = parseSCDate(endRaw ?? '')
    if (!startDate || !endDate) continue
    if (new Date(endDate) < now) continue

    // Location: "City, Full State Name"
    const locationText = getCell(rowHtml, 'Location') ?? ''
    const locMatch = locationText.match(/^(.+),\s*(.+)$/)
    const city  = locMatch ? locMatch[1].trim() : null
    const stateFullName = locMatch ? locMatch[2].trim() : ''
    const state = STATE_CODES[stateFullName] ?? (/^[A-Z]{2}$/.test(stateFullName) ? stateFullName : null)

    // Organization → sanction
    const orgCell = getCell(rowHtml, 'Organization') ?? ''
    const orgName = stripTags(orgCell)
    const sanction = detectSanction(orgName)

    // Age groups
    const ageText = getCell(rowHtml, 'Age Groups') ?? ''
    const ageGroups = parseAgeGroups(ageText)

    events.push({
      id: `sc::${slug}`,
      name,
      href,
      eventStartDate: startDate,
      eventEndDate: endDate,
      city,
      state,
      states: state ? [state] : [],
      statureName: null,
      maxAgeGroup: null,
      ageGroups,
      teamCount: null,
      teamApprovedCount: null,
      divisionCount: null,
      logoUrl: null,
      directorName: null,
      sourceId: 'softballconnected',
      sourceLabel: 'SoftballConnected',
      sourceRegion: state ?? 'National',
      sanction,
      entryFee: { min: null, max: null },
      registrationDeadline: null,
      venueName: city ?? null,
    })
  }

  return events
}

async function fetchPage(page: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.softballconnected.com/tournaments?page=${page}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FastPitchFinder/1.0)',
          'Accept': 'text/html',
        },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

export async function fetchSoftballConnectedEvents(): Promise<ScrapedEvent[]> {
  const now = new Date()
  const firstHtml = await fetchPage(1)
  if (!firstHtml) return []

  const pages = Math.min(totalPages(firstHtml), 20)

  const restHtmls = pages > 1
    ? await Promise.all(Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2)))
    : []

  const allHtmls = [firstHtml, ...restHtmls.filter((h): h is string => h !== null)]
  return allHtmls.flatMap(html => parsePage(html, now))
}
