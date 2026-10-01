import Skeleton from '@/components/ui/Skeleton'
import TeamResultsSkeleton from '@/components/ui/TeamResultsSkeleton'

export default function Loading() {
  return (
    <div className="container-page section-gap-sm">
      <header className="mb-8 flex flex-col gap-3">
        <Skeleton className="h-3 w-28 bg-neutral-200" />
        <Skeleton className="h-9 w-56 max-w-full bg-neutral-200" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Sidebar skeleton */}
        <aside className="card flex flex-col gap-5">
          <Skeleton className="h-3 w-16 bg-neutral-200" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24 bg-neutral-200" />
              <Skeleton className="h-10 w-full bg-neutral-200" />
            </div>
          ))}
        </aside>

        <section className="min-w-0">
          <TeamResultsSkeleton />
        </section>
      </div>
    </div>
  )
}
