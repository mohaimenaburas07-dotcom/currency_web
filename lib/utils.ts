import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(m: any) {
  if (!m) return ""
  const path = m.filePath || m.file_path || m.filePathInStore
  if (!path) return m.url || ""
  
  // Clean backslashes for URL compatibility
  const cleanPath = path.replace(/\\/g, "/")
  
  if (cleanPath.startsWith("/uploads/")) return cleanPath
  return `/uploads/${cleanPath}`
}
