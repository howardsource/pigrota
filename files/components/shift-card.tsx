"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Shift } from "./add-shift-form"

const SHIFT_TIMES: Record<string, string> = {
  "12-3": "12:00 PM - 3:00 PM",
  "3-6": "3:00 PM - 6:00 PM",
  "6-9": "6:00 PM - 9:00 PM",
  "9-11": "9:00 PM - 11:00 PM",
}

const SHIFT_LABELS: Record<string, string> = {
  "12-3": "12-3pm",
  "3-6": "3-6pm",
  "6-9": "6-9pm",
  "9-11": "9-11pm",
  custom: "Custom",
}

interface ShiftCardProps {
  shift: Shift
  onRemove: (id: string) => void
  locked?: boolean
}

export function ShiftCard({ shift, onRemove, locked = false }: ShiftCardProps) {
  const getRoleColor = () => {
    if (shift.subtitle === "Bar Staff") return "bg-bar-staff/10 border-bar-staff/30"
    if (shift.subtitle === "Line Cleaning") return "bg-line-cleaning/10 border-line-cleaning/30"
    return "bg-card border-border"
  }

  const getRoleIconColor = () => {
    if (shift.subtitle === "Bar Staff") return "text-bar-staff"
    if (shift.subtitle === "Line Cleaning") return "text-line-cleaning"
    return "text-primary"
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getShiftTime = () => {
    if (shift.shiftType === "custom" && shift.customStartTime && shift.customEndTime) {
      return `${formatTime(shift.customStartTime)} - ${formatTime(shift.customEndTime)}`
    }
    return SHIFT_TIMES[shift.shiftType] || ""
  }

  const isUnfilled = !shift.volunteerName

  if (isUnfilled) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">Volunteer needed</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded">
                {SHIFT_LABELS[shift.shiftType]}
              </span>
            </div>
          </div>
          {!locked && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 text-destructive/60 hover:text-destructive"
              onClick={() => onRemove(shift.id)}
              aria-label="Remove unfilled shift"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("border", getRoleColor())}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className={cn("h-4 w-4 shrink-0", getRoleIconColor())} />
              <span className="font-medium text-sm">{shift.volunteerName}</span>
            </div>
            {shift.subtitle && (
              <span className="text-xs text-muted-foreground pl-6">
                {shift.subtitle}
              </span>
            )}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0 mt-0.5" />
              <span>
                {shift.shiftType === "custom" ? getShiftTime() : SHIFT_LABELS[shift.shiftType]}
              </span>
            </div>
          </div>
          {!locked && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(shift.id)}
              aria-label={`Remove ${shift.volunteerName}'s shift`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
