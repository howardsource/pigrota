"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShiftCard } from "./shift-card"
import { AddShiftForm, type Shift } from "./add-shift-form"
import { AddEventForm, type Event } from "./add-event-form"
import { EventCard } from "./event-card"
import { UnfilledShifts } from "./unfilled-shifts"
import { getUnfilledShifts, isRegularDay } from "@/lib/opening-hours"
import { isPastDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface MonthViewProps {
  monthStart: Date
  shifts: Shift[]
  events: Event[]
  onAddShift: (shift: Shift) => void
  onRemoveShift: (id: string) => void
  onAddEvent: (event: Event) => void
  onRemoveEvent: (id: string) => void
}

export function MonthView({ monthStart, shifts, events, onAddShift, onRemoveShift, onAddEvent, onRemoveEvent }: MonthViewProps) {
  // Get all days in the month grid (including padding days from prev/next months)
  const getMonthGrid = () => {
    const year = monthStart.getFullYear()
    const month = monthStart.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    
    // Get the day of week for the first day (0 = Sunday, we want Monday = 0)
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6
    
    const days: { date: string; isCurrentMonth: boolean }[] = []
    
    // Add padding days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({
        date: date.toISOString().split("T")[0],
        isCurrentMonth: false,
      })
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({
        date: date.toISOString().split("T")[0],
        isCurrentMonth: true,
      })
    }
    
    // Add padding days from next month to complete the grid
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({
        date: date.toISOString().split("T")[0],
        isCurrentMonth: false,
      })
    }
    
    return days
  }

  const formatDayNumber = (dateString: string) => {
    const date = new Date(dateString)
    return date.getDate()
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

  const monthGrid = getMonthGrid()
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="flex flex-col gap-2">
      {/* Desktop Grid View */}
      <div className="hidden md:block">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {monthGrid.map(({ date, isCurrentMonth }) => {
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
                  "min-h-[110px] flex flex-col overflow-hidden",
                  !isCurrentMonth && "opacity-40",
                  today && "ring-2 ring-primary",
                  isRegular && isCurrentMonth && "border-l-2 border-l-accent",
                  isPast && isCurrentMonth && "opacity-60"
                )}
              >
                <div className="px-1 pt-0.5 flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-medium leading-none",
                    today && "text-primary"
                  )}>
                    {formatDayNumber(date)}
                    {today && <span className="ml-1 text-[8px] bg-primary text-primary-foreground px-1 rounded-full">Today</span>}
                  </span>
                </div>
                
                <div className="flex-1 px-1 py-0.5 overflow-y-auto">
                  {dayEvents.length > 0 && dayEvents.slice(0, 1).map((event) => (
                    <EventCard key={event.id} event={event} onRemove={onRemoveEvent} compact locked={isPast} />
                  ))}
                  {dayShifts.map((shift) => {
                    const isBarStaff = shift.subtitle === "Bar Staff"
                    const isLineCleaning = shift.subtitle === "Line Cleaning"
                    return (
                      <div
                        key={shift.id}
                        className={cn(
                          "text-[9px] p-0.5 rounded mb-0.5",
                          isBarStaff && "bg-bar-staff/15 text-bar-staff",
                          isLineCleaning && "bg-line-cleaning/15 text-line-cleaning",
                          !isBarStaff && !isLineCleaning && "bg-secondary"
                        )}
                        title={`${shift.volunteerName}${shift.subtitle ? ` (${shift.subtitle})` : ""} - ${shift.shiftType}`}
                      >
                        <span className="block truncate font-medium">{shift.volunteerName || "Needed"}</span>
                        <span className="block truncate opacity-75">{shift.shiftType === "custom" ? `${shift.customStartTime}-${shift.customEndTime}` : shift.shiftType}</span>
                      </div>
                    )
                  })}
                  {unfilledShifts.length > 0 && (
                    <UnfilledShifts unfilledShifts={unfilledShifts} compact />
                  )}
                </div>
                
                {isCurrentMonth && !isPast && (
                  <div className="flex gap-0.5 px-1 pb-0.5">
                    <AddShiftForm
                      onAddShift={onAddShift}
                      selectedDate={date}
                      compact
                    />
                    <AddEventForm
                      onAddEvent={onAddEvent}
                      selectedDate={date}
                      compact
                    />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Mobile List View for Month */}
      <div className="md:hidden flex flex-col gap-2">
        {monthGrid
          .filter(({ isCurrentMonth }) => isCurrentMonth)
          .map(({ date }) => {
            const dayShifts = getShiftsForDate(date)
            const dayEvents = getEventsForDate(date)
            const today = isToday(date)
            const isPast = isPastDate(date)
            const dateObj = new Date(date)
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
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-lg font-bold",
                        today && "text-primary"
                      )}>
                        {formatDayNumber(date)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {dateObj.toLocaleDateString("en-GB", { weekday: "short", month: "short" })}
                      </span>
                    </div>
                    {today && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {dayEvents.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {dayEvents.map((event) => (
                          <EventCard key={event.id} event={event} onRemove={onRemoveEvent} locked={isPast} />
                        ))}
                      </div>
                    )}
                    <UnfilledShifts unfilledShifts={unfilledShifts} />
                    {dayShifts.length === 0 && unfilledShifts.length === 0 && dayEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Not a regular day</p>
                    ) : dayShifts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No volunteers yet</p>
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
                    {!isPast && (
                      <div className="flex flex-col gap-2">
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
    </div>
  )
}
