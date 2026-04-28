'use client'

import { useRouter } from 'next/navigation'

interface Props {
  selectedSearch: string
  searchBase: string  // current URL with all other filters, no search or page param
  className?: string
}

export default function SearchInput({ selectedSearch, searchBase, className }: Props) {
  const router = useRouter()

  function navigate(value: string) {
    const trimmed = value.trim()
    if (trimmed === selectedSearch) return
    if (trimmed.length === 0 || trimmed.length >= 4) {
      const sep = searchBase.includes('?') ? '&' : '?'
      const url = trimmed.length >= 4
        ? `${searchBase}${sep}search=${encodeURIComponent(trimmed)}`
        : searchBase
      router.push(url)
    }
  }

  return (
    <div className={`relative ${className ?? 'w-64'}`}>
      <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-neutral-400">
        <SearchIcon />
      </span>
      <input
        key={`search-${selectedSearch}`}
        type="search"
        defaultValue={selectedSearch}
        placeholder="Search events…"
        className="input pl-8 w-full"
        onBlur={(e) => navigate(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') navigate((e.target as HTMLInputElement).value)
        }}
      />
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}
