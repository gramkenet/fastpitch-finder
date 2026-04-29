import { NextRequest, NextResponse } from 'next/server'

export interface TMVPDivision {
  divisionName: string
  teams: { teamName: string; coach: string | null }[]
}

function parseTMVPTeams(html: string): TMVPDivision[] {
  const divisions: TMVPDivision[] = []
  let current: TMVPDivision | null = null

  // Walk the HTML in document order, picking up division headers (h6.bg-secondary)
  // and team links (/team-details/) to build the structure sequentially.
  const pattern = /(?:<h6[^>]*bg-secondary[^>]*>([\s\S]*?)<\/h6>)|(?:<a[^>]*href="\/team-details\/[^"]*"[^>]*>([\s\S]*?)<\/a>)/g

  for (const m of html.matchAll(pattern)) {
    if (m[1] !== undefined) {
      if (current) divisions.push(current)
      current = { divisionName: m[1].replace(/<[^>]+>/g, '').trim(), teams: [] }
    } else if (m[2] !== undefined && current) {
      const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const pipeIdx = text.indexOf('|')
      const namePart = (pipeIdx >= 0 ? text.slice(0, pipeIdx) : text).trim()
      const teamName = namePart.replace(/\s*\([^)]+\)\s*$/, '').trim()
      const coach = pipeIdx >= 0 ? text.slice(pipeIdx + 1).trim() || null : null
      if (teamName) current.teams.push({ teamName, coach })
    }
  }
  if (current) divisions.push(current)

  return divisions
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  let html: string
  try {
    const res = await fetch(`https://tournamentmvp.com/tournament-registration/${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FastPitchFinder/1.0)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
    }
    html = await res.text()
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 })
  }

  const divisions = parseTMVPTeams(html)
  return NextResponse.json({ divisions })
}
