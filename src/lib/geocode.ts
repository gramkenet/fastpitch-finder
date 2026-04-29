interface ZippopotamPlace {
  latitude: string
  longitude: string
}

interface ZippopotamResponse {
  places: ZippopotamPlace[]
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
}

interface PhotonResponse {
  features: PhotonFeature[]
}

// Geocodes a US zip code → lat/lng using zippopotam.us (free, no API key, no rate limit)
export async function geocodeZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data: ZippopotamResponse = await res.json()
    const place = data.places?.[0]
    if (!place) return null
    return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) }
  } catch {
    return null
  }
}

// Geocodes a city+state → lat/lng using Photon (OSM-based, free, no rate limit, no API key)
export async function geocodeCityState(
  city: string,
  state: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${city} ${state}`)
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${q}&limit=1&lang=en`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data: PhotonResponse = await res.json()
    const coords = data.features?.[0]?.geometry?.coordinates
    if (!coords) return null
    // Photon returns [lng, lat]
    return { lat: coords[1], lng: coords[0] }
  } catch {
    return null
  }
}

export function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
