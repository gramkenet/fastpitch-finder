import type { TeamClassOption, TeamRegionOption, TeamSeasonOption, UsssaTeam } from '@/types/team'

// Underlying API — the same Angular-driven service that powers usssa.com's
// own Team Search page (usssa.com/fastpitch/TeamSearch/).
const USSSA_API = 'https://usssa.com/api/'
const FASTPITCH_SPORT_ID = 16

async function usssaApiPost<T>(action: string, body: Record<string, string | number>): Promise<T> {
  const form = new URLSearchParams()
  for (const [key, value] of Object.entries(body)) form.set(key, String(value))

  const res = await fetch(`${USSSA_API}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`USSSA API error for action "${action}": ${res.status}`)
  return res.json()
}

interface TeamSearchFieldsResponse {
  states: { value: number; name: string }[]  // regions + individual states/provinces, used as regionID options
  seasons: { value: string; name: string }[]
}

interface TeamSearchFields {
  regions: TeamRegionOption[]
  seasons: TeamSeasonOption[]
}

export async function fetchTeamSearchFields(): Promise<TeamSearchFields> {
  const data = await usssaApiPost<TeamSearchFieldsResponse>('getBasicEventSearchFieldsV11', {
    sportID: FASTPITCH_SPORT_ID,
  })
  return { regions: data.states, seasons: data.seasons }
}

interface RawTeamClass {
  ClassID: number
  ClassName: string
}

export async function fetchTeamClasses(): Promise<TeamClassOption[]> {
  const data = await usssaApiPost<RawTeamClass[]>('StatsGetClass', { gdSport: FASTPITCH_SPORT_ID })
  return data.map((c) => ({ value: c.ClassID, name: c.ClassName }))
}

// USSSA fastpitch season IDs count years since 1996, offset by one since the
// season spans into the following calendar year (e.g. today's date falls in seasonID 31 = "2027").
export function currentTeamSeasonId(): string {
  return String(new Date().getFullYear() - 1996 + 1)
}

interface RawTeam {
  teamid: number
  teamname: string
  city: string | null
  state: string | null
  class: string | null
}

interface TeamSearchResponse {
  teams: RawTeam[]
}

interface TeamSearchParams {
  teamName: string
  regionId: string
  classId: string
  seasonId: string
}

export async function searchTeams({ teamName, regionId, classId, seasonId }: TeamSearchParams): Promise<UsssaTeam[]> {
  const data = await usssaApiPost<TeamSearchResponse>('teamSearchV11', {
    sportID: FASTPITCH_SPORT_ID,
    teamName,
    regionID: regionId,
    classID: classId,
    seasonID: seasonId,
  })
  return (data.teams ?? []).map((t) => ({
    teamId: t.teamid,
    teamName: t.teamname,
    city: t.city,
    state: t.state,
    className: t.class,
    href: `https://usssa.com/teamHome/?teamID=${t.teamid}`,
  }))
}
