"use server"

import { createClient } from "@/lib/supabase/server"
import type { Shift } from "@/components/add-shift-form"

export async function getShifts(): Promise<Shift[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .order("date", { ascending: true })
  
  if (error) {
    console.error("Error fetching shifts:", error)
    return []
  }
  
  return data.map((row) => ({
    id: row.id,
    volunteerName: row.volunteer_name || "",
    subtitle: row.subtitle || undefined,
    date: row.date,
    shiftType: row.shift_type,
    customStartTime: row.custom_start_time || undefined,
    customEndTime: row.custom_end_time || undefined,
  }))
}

export async function addShift(shift: Omit<Shift, "id">): Promise<Shift | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("shifts")
    .insert({
      volunteer_name: shift.volunteerName || null,
      subtitle: shift.subtitle || null,
      date: shift.date,
      shift_type: shift.shiftType,
      custom_start_time: shift.customStartTime || null,
      custom_end_time: shift.customEndTime || null,
    })
    .select()
    .single()
  
  if (error) {
    console.error("Error adding shift:", error)
    return null
  }
  
  return {
    id: data.id,
    volunteerName: data.volunteer_name || "",
    subtitle: data.subtitle || undefined,
    date: data.date,
    shiftType: data.shift_type,
    customStartTime: data.custom_start_time || undefined,
    customEndTime: data.custom_end_time || undefined,
  }
}

export async function deleteShift(id: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("shifts")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting shift:", error)
    return false
  }
  
  return true
}
