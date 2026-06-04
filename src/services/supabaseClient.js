// Optional Supabase client. The app defaults to the localStorage backend
// (see api.js). To go fully online:
//   1. Run supabase/schema.sql in your Supabase project.
//   2. Set VITE_DATA_BACKEND=supabase + VITE_SUPABASE_URL / ANON_KEY in .env
//   3. Implement the api.js function signatures against this client and
//      export them instead (the UI imports only from services/, so no
//      screen code changes).
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anon ? createClient(url, anon) : null
export const isSupabaseConfigured = Boolean(supabase)
