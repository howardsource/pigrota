"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { jsPDF } from "jspdf"
import type { Shift } from "./add-shift-form"
import type { Event } from "./add-event-form"

const SHIFT_LABELS: Record<string, string> = {
  "12-3": "12-3pm",
  "3-6": "3-6pm",
  "6-9": "6-9pm",
  "9-11": "9-11pm",
  custom: "Custom",
}

interface ExportPdfButtonProps {
  monthStart: Date
  shifts: Shift[]
  events: Event[]
}

export function ExportPdfButton({ monthStart, shifts, events }: ExportPdfButtonProps) {
  const generatePDF = () => {
    try {
      // Landscape A4
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })
    
      const pageWidth = 297
      const pageHeight = 210
      const margin = 10
      const headerHeight = 25
      const dayHeaderHeight = 8
      const cellWidth = (pageWidth - margin * 2) / 7
      const gridHeight = pageHeight - margin * 2 - headerHeight - dayHeaderHeight
      
      const monthName = monthStart.toLocaleDateString("en-GB", { 
        month: "long", 
        year: "numeric" 
      })

      // Title
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("The Blue Pig - Volunteer Rota", pageWidth / 2, margin + 8, { align: "center" })
    
      doc.setFontSize(14)
      doc.setFont("helvetica", "normal")
      doc.text(monthName, pageWidth / 2, margin + 16, { align: "center" })

      // Week day headers
      const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      const headerY = margin + headerHeight
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, headerY, pageWidth - margin * 2, dayHeaderHeight, "F")
      
      weekDays.forEach((day, i) => {
        const x = margin + i * cellWidth + cellWidth / 2
        doc.text(day, x, headerY + 5.5, { align: "center" })
      })

      // Get month grid
      const year = monthStart.getFullYear()
      const month = monthStart.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      let startDayOfWeek = firstDay.getDay() - 1
      if (startDayOfWeek < 0) startDayOfWeek = 6
      
      const days: { date: string; isCurrentMonth: boolean }[] = []
      
      // Previous month padding
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month, -i)
        days.push({ date: date.toISOString().split("T")[0], isCurrentMonth: false })
      }
      
      // Current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i)
        days.push({ date: date.toISOString().split("T")[0], isCurrentMonth: true })
      }
      
      // Next month padding
      const remainingDays = 42 - days.length
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i)
        days.push({ date: date.toISOString().split("T")[0], isCurrentMonth: false })
      }

      // Calculate number of rows needed
      const numRows = Math.ceil(days.length / 7)
      const cellHeight = gridHeight / numRows
      const gridStartY = headerY + dayHeaderHeight

      // Draw calendar grid
      days.forEach((dayData, index) => {
        const col = index % 7
        const row = Math.floor(index / 7)
        const x = margin + col * cellWidth
        const y = gridStartY + row * cellHeight
        
        const dayShifts = shifts.filter((s) => s.date === dayData.date)
        const dayEvents = events.filter((e) => e.date === dayData.date)
        const dateObj = new Date(dayData.date)
        const dayNum = dateObj.getDate()
        
        // Cell background
        if (dayData.isCurrentMonth) {
          doc.setFillColor(255, 255, 255)
        } else {
          doc.setFillColor(248, 248, 248)
        }
        doc.rect(x, y, cellWidth, cellHeight, "F")
        
        // Cell border
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.2)
        doc.rect(x, y, cellWidth, cellHeight, "S")
        
        // Day number
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        if (dayData.isCurrentMonth) {
          doc.setTextColor(40, 40, 40)
        } else {
          doc.setTextColor(180, 180, 180)
        }
        doc.text(String(dayNum), x + 2, y + 5)
        
        if (!dayData.isCurrentMonth) return
        
        let contentY = y + 9
        const maxContentY = y + cellHeight - 2
        const lineHeight = 4.5
        
        // Events (golden/accent color)
        if (dayEvents.length > 0 && contentY < maxContentY) {
          doc.setFontSize(7)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(180, 130, 40)
          
          for (const event of dayEvents) {
            if (contentY >= maxContentY) break
            const eventTitle = event.title
            const eventTime = `${event.startTime}-${event.endTime}`
            
            // Print title on first line
            doc.text(eventTitle, x + 2, contentY)
            contentY += lineHeight * 0.8
            
            // Print time on second line if space
            if (contentY < maxContentY) {
              doc.setFont("helvetica", "normal")
              doc.text(eventTime, x + 2, contentY)
              doc.setFont("helvetica", "bold")
              contentY += lineHeight
            }
          }
        }
        
        // Shifts
        if (dayShifts.length > 0 && contentY < maxContentY) {
          doc.setFontSize(8)
          
          for (const shift of dayShifts) {
            if (contentY >= maxContentY) {
              doc.setFont("helvetica", "italic")
              doc.setTextColor(128, 128, 128)
              doc.text(`+${dayShifts.length - dayShifts.indexOf(shift)} more`, x + 2, contentY)
              break
            }
            
            const shiftLabel = SHIFT_LABELS[shift.shiftType] || shift.shiftType
            
            if (shift.volunteerName) {
              doc.setFont("helvetica", "normal")
              doc.setTextColor(60, 60, 60)
              const text = `${shiftLabel}: ${shift.volunteerName}`
              const truncated = text.length > 22 ? text.substring(0, 19) + "..." : text
              doc.text(truncated, x + 2, contentY)
              contentY += lineHeight * 0.8
              
              // Print subtitle/role on second line if exists
              if (shift.subtitle && contentY < maxContentY) {
                doc.setFontSize(7)
                doc.setTextColor(128, 128, 128)
                const subtitleTruncated = shift.subtitle.length > 24 ? shift.subtitle.substring(0, 21) + "..." : shift.subtitle
                doc.text(subtitleTruncated, x + 4, contentY)
                doc.setFontSize(8)
                contentY += lineHeight * 0.8
              } else {
                contentY += lineHeight * 0.2
              }
            } else {
              doc.setFont("helvetica", "bold")
              doc.setTextColor(180, 60, 60)
              doc.text(`${shiftLabel}: NEEDED`, x + 2, contentY)
              contentY += lineHeight
            }
          }
        }
      })
    
      // Footer
      doc.setFontSize(7)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(128, 128, 128)
      doc.text(
        `Generated on ${new Date().toLocaleDateString("en-GB")}`,
        pageWidth / 2,
        pageHeight - 3,
        { align: "center" }
      )
    
      // Open in new window
      const pdfBlob = doc.output("blob")
      const blobUrl = URL.createObjectURL(pdfBlob)
      window.open(blobUrl, "_blank")
    } catch (error) {
      console.error("[v0] PDF generation error:", error)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generatePDF}
      className="gap-2 bg-transparent"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Download PDF</span>
      <span className="sm:hidden">PDF</span>
    </Button>
  )
}
