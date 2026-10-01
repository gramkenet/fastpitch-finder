import Skeleton from '@/components/ui/Skeleton'
import EventResultsSkeleton from '@/components/ui/EventResultsSkeleton'

export default function Loading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="w-full bg-navy-900">
        <div className="container-page py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-32 bg-navy-700" />
              <Skeleton className="h-9 w-72 max-w-full bg-navy-700" />
              <Skeleton className="h-4 w-48 bg-navy-800" />
            </div>
            <Skeleton className="h-10 w-full sm:w-80 bg-navy-700 shrink-0" />
          </div>
        </div>
      </section>

      <div className="container-page section-gap-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Sidebar skeleton */}
          <aside className="card flex flex-col gap-5">
            <Skeleton className="h-3 w-16 bg-neutral-200" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20 bg-neutral-200" />
                <Skeleton className="h-10 w-full bg-neutral-200" />
              </div>
            ))}
          </aside>

          <section className="min-w-0">
            <EventResultsSkeleton />
          </section>
        </div>
      </div>
    </>
  )
}
