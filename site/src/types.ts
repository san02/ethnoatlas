export type Society = {
  id: string
  name: string
  lat: number | null
  lon: number | null
  region: string | null
  year: string | null
  dataset: string
  answers: Record<string, string>
}