import Link from 'next/link'

interface Props {
  currentPage: number
  totalPages: number
  /** Base path — pagination appends ?page=N */
  basePath?: string
}

function pageUrl(basePath: string, page: number) {
  if (page === 1) return basePath
  const sep = basePath.includes('?') ? '&' : '?'
  return `${basePath}${sep}page=${page}`
}

export default function Pagination({ currentPage, totalPages, basePath = '/' }: Props) {
  if (totalPages <= 1) return null

  const pages = buildPageList(currentPage, totalPages)

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 flex-wrap">
      {/* Prev */}
      {currentPage > 1 ? (
        <Link href={pageUrl(basePath, currentPage - 1)} className="btn btn-ghost btn-sm" aria-label="Previous page">
          <ChevronLeft />
        </Link>
      ) : (
        <span className="btn btn-ghost btn-sm opacity-30 cursor-not-allowed" aria-disabled="true">
          <ChevronLeft />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-neutral-400 select-none">…</span>
        ) : (
          <Link
            key={p}
            href={pageUrl(basePath, p as number)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={
              p === currentPage
                ? 'btn btn-sm bg-navy-700 text-white border-navy-700 hover:bg-navy-800'
                : 'btn btn-ghost btn-sm text-neutral-700'
            }
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link href={pageUrl(basePath, currentPage + 1)} className="btn btn-ghost btn-sm" aria-label="Next page">
          <ChevronRight />
        </Link>
      ) : (
        <span className="btn btn-ghost btn-sm opacity-30 cursor-not-allowed" aria-disabled="true">
          <ChevronRight />
        </span>
      )}
    </nav>
  )
}

/** Returns a compact page list with ellipses, e.g. [1, '…', 4, 5, 6, '…', 12] */
function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const delta = 1
  const left = current - delta
  const right = current + delta

  const pages: (number | '…')[] = []
  let prev: number | null = null

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i <= right)) {
      if (prev !== null && i - prev > 1) pages.push('…')
      pages.push(i)
      prev = i
    }
  }

  return pages
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
