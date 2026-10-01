'use client'

import { createContext, useContext, useTransition } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface FilterTransitionValue {
  isPending: boolean
  navigate: (url: string) => void
}

const FilterTransitionContext = createContext<FilterTransitionValue | null>(null)

// Wraps filter/search navigations in a transition so `isPending` flips
// immediately, even though the destination is the same route (only
// searchParams differ) — a case where `loading.tsx`'s Suspense fallback
// does not retrigger, since the boundary already has committed content.
export function FilterTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function navigate(url: string) {
    startTransition(() => {
      router.push(url)
    })
  }

  return (
    <FilterTransitionContext.Provider value={{ isPending, navigate }}>
      {children}
    </FilterTransitionContext.Provider>
  )
}

export function useFilterTransition() {
  const ctx = useContext(FilterTransitionContext)
  if (!ctx) throw new Error('useFilterTransition must be used within a FilterTransitionProvider')
  return ctx
}
