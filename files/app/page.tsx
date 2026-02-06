"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { RotaHeader } from "@/components/rota-header"
import { WeekView } from "@/components/week-view"
import { ListView } from "@/components/list-view"
import { MonthView } from "@/components/month-view"
import type { ViewMode } from "@/components/view-toggle"
import type { Shift } from "@/components/add-shift-form"
import type { Event } from "@/components/add-event-form"
import { getShifts, addShift, deleteShift } from "@/lib/db/shifts"
import { getEvents, addEvent, deleteEvent } from "@/lib/db/events"

function getWeekDates(startDate: Date): string[] {
  const dates: string[] = []
  const monday = new Date(startDate)
  
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    dates.push(date.toISOString().split("T")[0])
  }
  
  return dates
}

function getMonthDates(monthStart: Date): string[] {
  const dates: string[] = []
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  
  for (let i = 1; i <= lastDay; i++) {
    const date = new Date(year, month, i)
    dates.push(date.toISOString().split("T")[0])
  }
  
  return dates
}

function getMonday(date: Date): Date {
  const monday = new Date(date)
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getFirstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export default function RotaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(() => new Date())

  // Fetch shifts and events from Supabase
  const { data: shifts = [], mutate: mutateShifts } = useSWR<Shift[]>("shifts", getShifts)
  const { data: events = [], mutate: mutateEvents } = useSWR<Event[]>("events", getEvents)

  const weekDates = getWeekDates(getMonday(currentDate))

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleAddShift = useCallback(async (shift: Shift) => {
    // Optimistic update
    mutateShifts([...shifts, shift], false)
    
    // Save to database
    const savedShift = await addShift({
      volunteerName: shift.volunteerName,
      subtitle: shift.subtitle,
      date: shift.date,
      shiftType: shift.shiftType,
      customStartTime: shift.customStartTime,
      customEndTime: shift.customEndTime,
    })
    
    // Revalidate to get the actual data
    mutateShifts()
  }, [shifts, mutateShifts])

  const handleRemoveShift = useCallback(async (id: string) => {
    // Optimistic update
    mutateShifts(shifts.filter((s) => s.id !== id), false)
    
    // Delete from database
    await deleteShift(id)
    
    // Revalidate
    mutateShifts()
  }, [shifts, mutateShifts])

  const handleAddEvent = useCallback(async (event: Event) => {
    // Optimistic update
    mutateEvents([...events, event], false)
    
    // Save to database
    await addEvent({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
    })
    
    // Revalidate
    mutateEvents()
  }, [events, mutateEvents])

  const handleRemoveEvent = useCallback(async (id: string) => {
    // Optimistic update
    mutateEvents(events.filter((e) => e.id !== id), false)
    
    // Delete from database
    await deleteEvent(id)
    
    // Revalidate
    mutateEvents()
  }, [events, mutateEvents])

  const renderView = () => {
    switch (viewMode) {
      case "list":
        return (
          <ListView
            dates={weekDates}
            shifts={shifts}
            events={events}
            onAddShift={handleAddShift}
            onRemoveShift={handleRemoveShift}
            onAddEvent={handleAddEvent}
            onRemoveEvent={handleRemoveEvent}
          />
        )
      case "month":
        return (
          <MonthView
            monthStart={getFirstOfMonth(currentDate)}
            shifts={shifts}
            events={events}
            onAddShift={handleAddShift}
            onRemoveShift={handleRemoveShift}
            onAddEvent={handleAddEvent}
            onRemoveEvent={handleRemoveEvent}
          />
        )
      case "week":
      default:
        return (
          <WeekView
            weekDates={weekDates}
            shifts={shifts}
            events={events}
            onAddShift={handleAddShift}
            onRemoveShift={handleRemoveShift}
            onAddEvent={handleAddEvent}
            onRemoveEvent={handleRemoveEvent}
          />
        )
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <RotaHeader
        currentDate={currentDate}
        viewMode={viewMode}
        shifts={shifts}
        events={events}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onViewChange={setViewMode}
      />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 p-3 sm:p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Tap "Add Shift" on any day to sign up as a volunteer. All volunteers are welcome!
          </p>
        </div>
        
        {renderView()}
      </div>
    </main>
  )
}
