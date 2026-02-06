"use server"

import { createClient } from "@/lib/supabase/server"
import type { Event } from "@/components/add-event-form"

export async function getEvents(): Promise<Event[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
  
  if (error) {
    console.error("Error fetching events:", error)
    return []
  }
  
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
  }))
}

export async function addEvent(event: Omit<Event, "id">): Promise<Event | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: event.title,
      date: event.date,
      start_time: event.startTime,
      end_time: event.endTime,
    })
    .select()
    .single()
  
  if (error) {
    console.error("Error adding event:", error)
    return null
  }
  
  return {
    id: data.id,
    title: data.title,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting event:", error)
    return false
  }
  
  return true
}
