import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types/auth";
import { initUserCategories } from "@/services/category";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

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

  // 초기 카테고리 4개 생성 (산책, 식사, 병원, 목욕)
  await initUserCategories(id);
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

/** 사용자 프로필 이미지 업로드 */
export async function uploadUserProfileImage(
  userId: string,
  localUri: string
): Promise<string> {
  const ext = localUri.split(".").pop() ?? "jpg";
  const fileName = `${userId}/${Date.now()}.${ext}`;

  // eslint-disable-next-line deprecation/deprecation
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: "base64",
  });

  const { error } = await supabase.storage
    .from("user-profiles")
    .upload(fileName, decode(base64), { contentType: `image/${ext}`, upsert: true });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("user-profiles").getPublicUrl(fileName);

  return publicUrl;
}

/** 사용자 프로필 이미지 삭제 (Storage에서 제거) */
export async function deleteUserProfileImage(
  imageUrl: string
): Promise<void> {
  // publicUrl에서 파일 경로 추출: .../user-profiles/{userId}/{filename}
  const match = imageUrl.match(/user-profiles\/(.+)$/);
  if (!match) return;

  const filePath = match[1];
  const { error } = await supabase.storage
    .from("user-profiles")
    .remove([filePath]);

  if (error) throw error;
}

/** 사용자 관련 모든 데이터 삭제 (회원 탈퇴 시) — CASCADE로 pets 자동 삭제 */
export async function deleteUserData(id: string): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) throw error;
}
