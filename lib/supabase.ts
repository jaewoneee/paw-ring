import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

console.log("[Supabase] URL:", JSON.stringify(supabaseUrl));
console.log("[Supabase] Key:", supabaseAnonKey ? "exists" : "missing");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env.local을 확인하고 Expo 서버를 재시작하세요."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
