export interface UsssaTeam {
  teamId: number
  teamName: string
  city: string | null
  state: string | null
  className: string | null
  href: string
}

export interface TeamRegionOption {
  value: number
  name: string
}

export interface TeamClassOption {
  value: number
  name: string
}

export interface TeamSeasonOption {
  value: string
  name: string
}
