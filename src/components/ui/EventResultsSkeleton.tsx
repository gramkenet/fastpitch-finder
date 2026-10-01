import Skeleton from './Skeleton'
import CardGrid from './CardGrid'

export default function EventResultsSkeleton() {
  return (
    <CardGrid columns={1}>
      {Array.from({ length: 6 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </CardGrid>
  )
}

function EventCardSkeleton() {
  return (
    <div className="card flex flex-row gap-4 p-0 overflow-hidden">
      <div className="w-16 self-stretch shrink-0 flex items-start justify-center pt-10">
        <Skeleton className="w-10 h-10 rounded-full bg-neutral-200" />
      </div>
      <div className="flex flex-col gap-3 flex-1 min-w-0 py-4 pr-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-20 bg-neutral-200" />
          <Skeleton className="h-5 w-24 rounded-full bg-neutral-200" />
        </div>
        <Skeleton className="h-5 w-3/4 bg-neutral-200" />
        <Skeleton className="h-3 w-1/3 bg-neutral-200" />
        <Skeleton className="h-3 w-1/2 mt-auto bg-neutral-200" />
      </div>
    </div>
  )
}
