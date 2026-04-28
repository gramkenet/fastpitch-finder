import type { ScrapedEvent } from '@/types/event'

const STORAGE_KEY = 'my-tournaments'
export const UPDATE_EVENT = 'my-tournaments-updated'

function read(): ScrapedEvent[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function write(events: ScrapedEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT))
}

export function getSavedEvents(): ScrapedEvent[] {
  return read()
}

export function isSaved(id: string): boolean {
  return read().some((e) => e.id === id)
}

export function toggleSaved(event: ScrapedEvent): boolean {
  const current = read()
  const exists = current.some((e) => e.id === event.id)
  write(exists ? current.filter((e) => e.id !== event.id) : [...current, event])
  return !exists
}
