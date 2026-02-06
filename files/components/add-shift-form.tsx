"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"

export interface Shift {
  id: string
  volunteerName: string
  subtitle?: string
  date: string
  shiftType: string
  customStartTime?: string
  customEndTime?: string
}

const PRESET_SHIFTS = [
  { value: "12-3", label: "12 - 3pm", time: "12:00 PM - 3:00 PM" },
  { value: "3-6", label: "3 - 6pm", time: "3:00 PM - 6:00 PM" },
  { value: "6-9", label: "6 - 9pm", time: "6:00 PM - 9:00 PM" },
  { value: "9-11", label: "9 - 11pm", time: "9:00 PM - 11:00 PM" },
  { value: "custom", label: "Custom Time", time: "Set your own hours" },
]

interface AddShiftFormProps {
  onAddShift: (shift: Shift) => void
  selectedDate: string
  compact?: boolean
}

export function AddShiftForm({ onAddShift, selectedDate, compact = false }: AddShiftFormProps) {
  const [open, setOpen] = useState(false)
  const [isUnfilledShift, setIsUnfilledShift] = useState(false)
  const [volunteerName, setVolunteerName] = useState("")
  const [roleType, setRoleType] = useState("bar-staff")
  const [customRole, setCustomRole] = useState("")
  const [shiftType, setShiftType] = useState("3-6")
  const [customStartTime, setCustomStartTime] = useState("09:00")
  const [customEndTime, setCustomEndTime] = useState("17:00")
  const [subtitle, setSubtitle] = useState(""); // Declare subtitle state

  const getRoleValue = () => {
    if (roleType === "custom") return customRole.trim() || undefined
    if (roleType === "bar-staff") return "Bar Staff"
    if (roleType === "bar-help") return "Bar Help"
    if (roleType === "line-cleaning") return "Line Cleaning"
    return undefined
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isUnfilledShift && !volunteerName.trim()) return

    const newShift: Shift = {
      id: Date.now().toString(),
      volunteerName: isUnfilledShift ? "" : volunteerName.trim(),
      subtitle: isUnfilledShift ? undefined : getRoleValue(),
      date: selectedDate,
      shiftType,
      customStartTime: shiftType === "custom" ? customStartTime : undefined,
      customEndTime: shiftType === "custom" ? customEndTime : undefined,
    }

    onAddShift(newShift)
    setIsUnfilledShift(false)
    setVolunteerName("")
    setRoleType("bar-staff")
    setCustomRole("")
    setShiftType("3-6")
    setCustomStartTime("09:00")
    setCustomEndTime("17:00")
    setOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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
            <Plus className="h-2.5 w-2.5" />
            Shift
          </Button>
        ) : (
          <Button className="gap-2 w-full">
            <Plus className="h-4 w-4" />
            Add Shift
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign Up for a Shift</DialogTitle>
          <DialogDescription>
            {formatDate(selectedDate)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Checkbox
              id="unfilledShift"
              checked={isUnfilledShift}
              onCheckedChange={(checked) => setIsUnfilledShift(checked === true)}
            />
            <Label htmlFor="unfilledShift" className="text-sm cursor-pointer">
              Mark as unfilled (volunteer needed)
            </Label>
          </div>

          {!isUnfilledShift && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="volunteerName">Your Name *</Label>
                <Input
                  id="volunteerName"
                  placeholder="Enter your name"
                  value={volunteerName}
                  onChange={(e) => setVolunteerName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select value={roleType} onValueChange={setRoleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar-staff">Bar Staff</SelectItem>
                    <SelectItem value="bar-help">Bar Help</SelectItem>
                    <SelectItem value="line-cleaning">Line Cleaning</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {roleType === "custom" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="customRole">Custom Role</Label>
                  <Input
                    id="customRole"
                    placeholder="Enter role"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-2">
            <Label>Select Shift</Label>
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a shift" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_SHIFTS.map((shift) => (
                  <SelectItem key={shift.value} value={shift.value}>
                    <span className="font-medium">{shift.label}</span>
                    <span className="ml-2 text-muted-foreground text-sm">
                      ({shift.time})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {shiftType === "custom" && (
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="mt-2">
            {isUnfilledShift ? "Add Unfilled Shift" : "Confirm Shift"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
