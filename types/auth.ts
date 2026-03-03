/** Supabase users 테이블 스키마 */
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  profile_image: string | null;
  provider: "email" | "google";
  email_verified: boolean;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}
