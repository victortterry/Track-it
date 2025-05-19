import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

// This ensures we have only one instance of the Supabase client
let supabaseInstance: SupabaseClient<Database> | null = null

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>()
  }
  return supabaseInstance
}
