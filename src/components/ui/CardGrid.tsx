import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
}

const colClasses: Record<NonNullable<Props['columns']>, string> = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function CardGrid({ children, columns = 3 }: Props) {
  return (
    <div className={`grid grid-cols-1 ${colClasses[columns]} gap-6`}>
      {children}
    </div>
  )
}
