import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ihtxottwqppqtwdoqtpa.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodHhvdHR3cXBwcXR3ZG9xdHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNzQ2NzQsImV4cCI6MjA2Njc1MDY3NH0.-tk36dhVro2GbeK9f3JXESWjNBiXYFYZZRUi1cxcwrw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
