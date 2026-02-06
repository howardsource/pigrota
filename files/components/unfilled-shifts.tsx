"use client"

import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { type ExpectedShift } from "@/lib/opening-hours"

interface UnfilledShiftsProps {
  unfilledShifts: ExpectedShift[]
  compact?: boolean
}

export function UnfilledShifts({ unfilledShifts, compact = false }: UnfilledShiftsProps) {
  if (unfilledShifts.length === 0) return null

  if (compact) {
    return (
      <div className="flex flex-col gap-0.5">
        {unfilledShifts.map((shift) => (
          <div key={shift.shiftType} className="flex items-center gap-1 text-destructive">
            <AlertCircle className="h-2.5 w-2.5 shrink-0" />
            <span className="text-[9px] font-medium">{shift.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2">
      <div className="flex items-center gap-1.5 text-destructive mb-1">
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Volunteers needed</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {unfilledShifts.map((shift) => (
          <span
            key={shift.shiftType}
            className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded"
          >
            {shift.label}
          </span>
        ))}
      </div>
    </div>
  )
}
