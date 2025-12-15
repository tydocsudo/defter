import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// <CHANGE> Added date formatting helper for Turkish format (dd.mm.yyyy)
export function formatDateTurkish(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${day}.${month}.${year}`
}

// <CHANGE> Added function to convert Turkish date format back to ISO
export function parseTurkishDate(dateStr: string): string {
  const [day, month, year] = dateStr.split(".")
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}
