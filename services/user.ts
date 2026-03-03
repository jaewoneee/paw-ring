import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types/auth";

/** 사용자 프로필 생성 (회원가입 시) */
export async function createUserProfile(
  id: string,
  data: {
    email: string;
    nickname: string;
    provider: "email" | "google";
    profile_image?: string;
  }
): Promise<void> {
  const { error } = await supabase.from("users").upsert({
    id,
    email: data.email,
    nickname: data.nickname,
    profile_image: data.profile_image ?? null,
    provider: data.provider,
    email_verified: false,
    notification_enabled: true,
  });

  if (error) throw error;
}

/** 사용자 프로필 조회 */
export async function getUserProfile(
  id: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // row not found
    throw error;
  }

  return data as UserProfile;
}

/** 사용자 프로필 업데이트 */
export async function updateUserProfile(
  id: string,
  data: Partial<
    Pick<UserProfile, "nickname" | "profile_image" | "email_verified" | "notification_enabled">
  >
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** 사용자 관련 모든 데이터 삭제 (회원 탈퇴 시) — CASCADE로 pets 자동 삭제 */
export async function deleteUserData(id: string): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) throw error;
}
