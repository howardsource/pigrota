"use client"

import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, X } from "lucide-react"
import type { Event } from "./add-event-form"

interface EventCardProps {
  event: Event
  onRemove: (id: string) => void
  compact?: boolean
  locked?: boolean
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":")
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? "pm" : "am"
  const hour12 = hour % 12 || 12
  return `${hour12}${minutes !== "00" ? `:${minutes}` : ""}${ampm}`
}

export function EventCard({ event, onRemove, compact = false, locked = false }: EventCardProps) {
  if (compact) {
    return (
      <div className="bg-accent/20 border border-accent/30 rounded-md p-1.5">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <CalendarDays className="h-3 w-3 text-accent shrink-0" />
            <span className="text-[10px] font-medium text-foreground truncate">
              {event.title}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-accent/15 border border-accent/30 rounded-md p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent shrink-0" />
            <span className="font-medium text-sm text-foreground truncate">
              {event.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6">
            <Clock className="h-3 w-3 shrink-0" />
            <span>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          </div>
        </div>
        {!locked && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(event.id)}
            aria-label={`Remove ${event.title}`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
