export function isPastDate(dateString: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)
  return date < today
}
