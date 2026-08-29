// src/lib/supabaseClient.js
// Shared Supabase client for the Parish 25 Initiative pages (public + admin).
// Matches the pattern used elsewhere in the Meckury AI codebase.
//
// Expects env vars (Vite):
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//
// Table this connects to: `parish_enquiries`
//   id            uuid, pk, default gen_random_uuid()
//   created_at    timestamptz, default now()
//   parish_name   text
//   location      text
//   contact_name  text
//   phone         text
//   email         text, nullable
//   message       text, nullable
//   status        text  -- 'enquiry' | 'contacted' | 'confirmed' | 'executed'
//   completed_at  timestamptz, nullable
//
// RLS: public INSERT allowed (anon can submit the request form).
// SELECT/UPDATE restricted to authenticated admin users only.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
