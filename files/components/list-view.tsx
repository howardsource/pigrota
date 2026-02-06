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

interface ListViewProps {
  dates: string[]
  shifts: Shift[]
  events: Event[]
  onAddShift: (shift: Shift) => void
  onRemoveShift: (id: string) => void
  onAddEvent: (event: Event) => void
  onRemoveEvent: (id: string) => void
}

export function ListView({ dates, shifts, events, onAddShift, onRemoveShift, onAddEvent, onRemoveEvent }: ListViewProps) {
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
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

  // Filter to only show dates that have shifts or are today/future
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const relevantDates = dates.filter((date) => {
    const dateObj = new Date(date)
    const hasShifts = getShiftsForDate(date).length > 0
    const hasEvents = getEventsForDate(date).length > 0
    return hasShifts || hasEvents || dateObj >= today
  })

  return (
    <div className="flex flex-col gap-3">
      {relevantDates.map((date) => {
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
              "flex flex-col",
              today && "ring-2 ring-primary",
              isRegular && "border-l-4 border-l-accent",
              isPast && "opacity-60"
            )}
          >
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className={cn(
                  "text-lg font-semibold",
                  today && "text-primary"
                )}>
                  {formatFullDate(date)}
                </span>
                {today && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {dayEvents.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                  {dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} onRemove={onRemoveEvent} locked={isPast} />
                  ))}
                </div>
              )}
              <UnfilledShifts unfilledShifts={unfilledShifts} />
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <div className="flex-1">
                  {dayShifts.length === 0 && unfilledShifts.length === 0 && dayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Not a regular day
                    </p>
                  ) : dayShifts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No volunteers yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {dayShifts.map((shift) => (
                        <ShiftCard
                          key={shift.id}
                          shift={shift}
                          onRemove={onRemoveShift}
                          locked={isPast}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {!isPast && (
                  <div className="flex flex-col gap-2 sm:w-auto">
                    <AddShiftForm onAddShift={onAddShift} selectedDate={date} />
                    <AddEventForm onAddEvent={onAddEvent} selectedDate={date} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
