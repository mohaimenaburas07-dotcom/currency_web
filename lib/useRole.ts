// lib/useRole.ts
// Client-side hook to read the current user's role from localStorage.
// Returns helpers isAdmin, isOperator, user, and roles array.

import { useEffect, useState } from "react"

export interface StoredUser {
  id: string
  username: string
  email: string
  roles: string[]
  branch_code?: string | null
}

export function useRole() {
  const [user, setUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("alwaha_user")
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // ignore parse errors
    }
  }, [])

  const roles: string[] = user?.roles ?? []
  const isAdmin = roles.some(r =>
    ["ADMIN", "admin", "ROLE_ADMIN", "Administrator"].includes(r)
  )
  const isOperator = !isAdmin

  return { user, roles, isAdmin, isOperator }
}
