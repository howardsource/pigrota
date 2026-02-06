"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { List, CalendarDays, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewMode = "list" | "week" | "month"

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "list", label: "List", icon: <List className="h-4 w-4" /> },
    { id: "week", label: "Week", icon: <CalendarDays className="h-4 w-4" /> },
    { id: "month", label: "Month", icon: <Calendar className="h-4 w-4" /> },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {views.map((view) => (
        <Button
          key={view.id}
          variant="ghost"
          size="sm"
          onClick={() => onViewChange(view.id)}
          className={cn(
            "gap-2 transition-colors",
            currentView === view.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {view.icon}
          <span className="hidden sm:inline">{view.label}</span>
        </Button>
      ))}
    </div>
  )
}
