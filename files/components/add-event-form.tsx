"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarPlus } from "lucide-react"

export interface Event {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
}

interface AddEventFormProps {
  onAddEvent: (event: Event) => void
  selectedDate: string
  compact?: boolean
}

export function AddEventForm({ onAddEvent, selectedDate, compact = false }: AddEventFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [startTime, setStartTime] = useState("12:00")
  const [endTime, setEndTime] = useState("18:00")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const newEvent: Event = {
      id: Date.now().toString(),
      title: title.trim(),
      date: selectedDate,
      startTime,
      endTime,
    }

    onAddEvent(newEvent)
    setTitle("")
    setStartTime("12:00")
    setEndTime("18:00")
    setOpen(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="sm" className="h-5 flex-1 text-[8px] gap-0.5 px-1">
            <CalendarPlus className="h-2.5 w-2.5" />
            Event
          </Button>
        ) : (
          <Button variant="outline" className="gap-2 w-full bg-transparent">
            <CalendarPlus className="h-4 w-4" />
            Add Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <p className="text-sm text-muted-foreground">{formatDate(selectedDate)}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="eventTitle">Event Title *</Label>
            <Input
              id="eventTitle"
              placeholder="e.g., Live Music, Quiz Night"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="eventStartTime">Start Time</Label>
              <Input
                id="eventStartTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="eventEndTime">End Time</Label>
              <Input
                id="eventEndTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="mt-2">
            Add Event
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
