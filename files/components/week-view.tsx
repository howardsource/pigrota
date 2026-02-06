"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShiftCard } from "./shift-card"
import { AddShiftForm, type Shift } from "./add-shift-form"
import { AddEventForm, type Event } from "./add-event-form"
import { EventCard } from "./event-card"
import { UnfilledShifts } from "./unfilled-shifts"
import { getUnfilledShifts, isRegularDay } from "@/lib/opening-hours"
import { isPastDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface WeekViewProps {
  weekDates: string[]
  shifts: Shift[]
  events: Event[]
  onAddShift: (shift: Shift) => void
  onRemoveShift: (id: string) => void
  onAddEvent: (event: Event) => void
  onRemoveEvent: (id: string) => void
}

export function WeekView({ weekDates, shifts, events, onAddShift, onRemoveShift, onAddEvent, onRemoveEvent }: WeekViewProps) {
  const formatDayName = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", { weekday: "short" })
  }

  const formatDayNumber = (dateString: string) => {
    const date = new Date(dateString)
    return date.getDate()
  }

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", { month: "short" })
  }

  const isToday = (dateString: string) => {
    const today = new Date()
    const date = new Date(dateString)
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    )
  }

  const getShiftsForDate = (date: string) => {
    return shifts.filter((shift) => shift.date === date)
  }

  const getEventsForDate = (date: string) => {
    return events.filter((event) => event.date === date)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
      {weekDates.map((date) => {
        const dayShifts = getShiftsForDate(date)
        const dayEvents = getEventsForDate(date)
        const today = isToday(date)
        const isPast = isPastDate(date)
        const filledTypes = dayShifts.map((s) => s.shiftType)
        const unfilledShifts = getUnfilledShifts(date, filledTypes)
        const isRegular = isRegularDay(date)

        return (
          <Card
            key={date}
            className={cn(
              "min-h-[180px] lg:min-h-[200px] flex flex-col",
              today && "ring-2 ring-primary",
              isRegular && "border-l-4 border-l-accent",
              isPast && "opacity-60"
            )}
          >
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-0">
                  <span className={cn(
                    "text-sm sm:text-xs uppercase tracking-wide",
                    today ? "text-primary" : "text-muted-foreground"
                  )}>
                    {formatDayName(date)}
                  </span>
                  <span className={cn(
                    "text-xl sm:text-2xl font-bold",
                    today && "text-primary"
                  )}>
                    {formatDayNumber(date)}
                  </span>
                  <span className="text-sm sm:text-xs text-muted-foreground">
                    {formatMonth(date)}
                  </span>
                </div>
                {today && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex flex-col gap-2 flex-1">
              {dayEvents.length > 0 && (
                <div className="flex flex-col gap-2 mb-1">
                  {dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} onRemove={onRemoveEvent} locked={isPast} />
                  ))}
                </div>
              )}
              <UnfilledShifts unfilledShifts={unfilledShifts} />
              <div className="flex flex-col gap-2 flex-1">
                {dayShifts.length === 0 && unfilledShifts.length === 0 && dayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2 sm:py-4">
                    Not a regular day
                  </p>
                ) : dayShifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No volunteers yet
                  </p>
                ) : (
                  dayShifts.map((shift) => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      onRemove={onRemoveShift}
                      locked={isPast}
                    />
                  ))
                )}
              </div>
              {!isPast && (
                <div className="flex flex-col gap-2 mt-auto">
                  <AddShiftForm onAddShift={onAddShift} selectedDate={date} />
                  <AddEventForm onAddEvent={onAddEvent} selectedDate={date} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
