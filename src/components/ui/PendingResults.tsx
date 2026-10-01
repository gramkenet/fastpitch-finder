'use client'

import type { ReactNode } from 'react'
import { useFilterTransition } from './FilterTransition'

export default function PendingResults({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) {
  const { isPending } = useFilterTransition()
  return <>{isPending ? skeleton : children}</>
}
