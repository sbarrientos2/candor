import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// TODO: Replace with your Supabase project credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://stbzvkylipcrtmrnyzhg.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Ynp2a3lsaXBjcnRtcm55emhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Mjg5MzgsImV4cCI6MjA4NjIwNDkzOH0.H06ycOSE74OW1JlMwGrTwUsJo966zhoatoUOJIjwgYE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const PHOTOS_BUCKET = "photos";
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
