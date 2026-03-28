import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nqzwpflisrbjqbgldekx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xendwZmxpc3JianFiZ2xkZWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjE5ODcsImV4cCI6MjA5MDIzNzk4N30.Dr-UgLwlU35HjTB2U49_j9J3-OHgpCZ79wt1Rv2224A";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
