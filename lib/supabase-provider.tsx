"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/auth-helpers-nextjs"
import { getSupabaseClient } from "./supabase-singleton"
import { SupabaseClient } from "@supabase/supabase-js" // add this

type SupabaseContextType = {
  supabase: SupabaseClient
  user: User | null
  loading: boolean
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    // Check for initial session
    const initializeUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    initializeUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <SupabaseContext.Provider value={{ supabase, user, loading }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}
