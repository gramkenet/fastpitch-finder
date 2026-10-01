import Skeleton from './Skeleton'
import CardGrid from './CardGrid'

export default function TeamResultsSkeleton() {
  return (
    <CardGrid columns={3}>
      {Array.from({ length: 9 }).map((_, i) => (
        <TeamCardSkeleton key={i} />
      ))}
    </CardGrid>
  )
}

function TeamCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3">
      <Skeleton className="h-5 w-3/4 bg-neutral-200" />
      <Skeleton className="h-5 w-20 rounded-full bg-neutral-200" />
      <Skeleton className="h-3 w-1/2 bg-neutral-200" />
    </div>
  )
}
