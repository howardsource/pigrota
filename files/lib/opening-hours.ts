// Regular opening hours for The Blue Pig
// Wednesday: 3-6pm
// Friday: 3-6pm
// Saturday: 3-6pm
// Sunday: 12-6pm (two shifts: 12-3 and 3-6)

export type RegularShift = "12-3" | "3-6" | "6-9" | "9-11"

export interface ExpectedShift {
  shiftType: RegularShift
  label: string
}

// Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
export const REGULAR_HOURS: Record<number, ExpectedShift[]> = {
  0: [  // Sunday: 12-6pm
    { shiftType: "12-3", label: "12-3pm" },
    { shiftType: "3-6", label: "3-6pm" },
  ],
  3: [  // Wednesday: 3-6pm
    { shiftType: "3-6", label: "3-6pm" },
  ],
  5: [  // Friday: 3-6pm
    { shiftType: "3-6", label: "3-6pm" },
  ],
  6: [  // Saturday: 3-6pm
    { shiftType: "3-6", label: "3-6pm" },
  ],
}

export function getExpectedShifts(dateString: string): ExpectedShift[] {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay()
  return REGULAR_HOURS[dayOfWeek] || []
}

export function getUnfilledShifts(
  dateString: string,
  filledShiftTypes: string[]
): ExpectedShift[] {
  const expected = getExpectedShifts(dateString)
  return expected.filter(
    (shift) => !filledShiftTypes.includes(shift.shiftType)
  )
}

export function hasRegularHours(dateString: string): boolean {
  return getExpectedShifts(dateString).length > 0
}

export function isRegularDay(dateString: string): boolean {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay()
  return dayOfWeek in REGULAR_HOURS
}
