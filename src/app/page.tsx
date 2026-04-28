import { Suspense } from 'react'
import { fetchAllEvents } from '@/lib/scraper'
import EventsExplorer from '@/components/ui/EventsExplorer'

export default async function HomePage() {
  const allEvents = await fetchAllEvents()

  const sorted = [...allEvents].sort((a, b) =>
    a.eventStartDate.localeCompare(b.eventStartDate)
  )

  const availableStates = [
    ...new Set(sorted.map((e) => e.state).filter(Boolean)),
  ] as string[]

  const availableSanctions = [...new Set(sorted.map((e) => e.sanction))]

  const availableAges = [
    ...new Set(sorted.flatMap((e) => e.ageGroups.map((ag) => ag.label))),
  ].sort((a, b) => parseInt(a) - parseInt(b))

  return (
    <Suspense>
      <EventsExplorer
        allEvents={sorted}
        availableStates={availableStates}
        availableAges={availableAges}
        availableSanctions={availableSanctions}
      />
    </Suspense>
  )
}
