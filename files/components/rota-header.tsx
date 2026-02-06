"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { ViewToggle, type ViewMode } from "./view-toggle"
import { ExportPdfButton } from "./export-pdf-button"
import type { Shift } from "./add-shift-form"
import type { Event } from "./add-event-form"

interface RotaHeaderProps {
  currentDate: Date
  viewMode: ViewMode
  shifts: Shift[]
  events: Event[]
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (view: ViewMode) => void
}

export function RotaHeader({
  currentDate,
  viewMode,
  shifts,
  events,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
}: RotaHeaderProps) {
  const formatDateDisplay = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-GB", { 
        month: "long", 
        year: "numeric" 
      })
    }
    
    // Week view - show week range
    const weekStart = new Date(currentDate)
    const day = weekStart.getDay()
    const diff = day === 0 ? -6 : 1 - day
    weekStart.setDate(weekStart.getDate() + diff)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const startMonth = weekStart.toLocaleDateString("en-GB", { month: "short" })
    const endMonth = weekEnd.toLocaleDateString("en-GB", { month: "short" })
    const startDay = weekStart.getDate()
    const endDay = weekEnd.getDate()
    const year = weekEnd.getFullYear()

    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth} ${year}`
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
  }

  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground font-serif">
              The Blue Pig
            </h1>
            <p className="text-muted-foreground mt-1">
              Volunteer Rota
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <ViewToggle currentView={viewMode} onViewChange={onViewChange} />
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onPrevious}
                aria-label={viewMode === "month" ? "Previous month" : "Previous week"}
                className="bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-[180px] sm:min-w-[200px] justify-center">
                <span className="text-base sm:text-lg font-medium text-center">{formatDateDisplay()}</span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={onNext}
                aria-label={viewMode === "month" ? "Next month" : "Next week"}
                className="bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onToday}
              className="gap-1 bg-transparent"
            >
              <Calendar className="h-4 w-4" />
              Today
            </Button>
            
            {viewMode === "month" && (
              <ExportPdfButton
                monthStart={new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)}
                shifts={shifts}
                events={events}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
