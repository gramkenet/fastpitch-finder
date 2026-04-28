import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId || !/^\d+$/.test(eventId)) {
    return NextResponse.json({ error: 'Invalid eventId' }, { status: 400 })
  }

  const res = await fetch(
    `https://sportsvc.usssa.com/api/Event/teamsSummaryLwc?eventId=${eventId}`,
    { next: { revalidate: 3600 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
