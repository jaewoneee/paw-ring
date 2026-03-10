import { supabase } from "@/lib/supabase";
import type {
  CalendarShareWithDetails,
  ShareRole,
} from "@/types/sharing";

/** 캘린더의 공유 멤버 목록 조회 (소유자용) */
export async function getCalendarMembers(
  petId: string
): Promise<CalendarShareWithDetails[]> {
  const { data, error } = await supabase
    .from("calendar_shares")
    .select(
      `
      *,
      pet:pets!pet_id(name, profile_image),
      owner:users!owner_id(nickname, profile_image),
      shared_user:users!shared_user_id(nickname, profile_image)
      `
    )
    .eq("pet_id", petId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarShareWithDetails[];
}

/** 나에게 온 공유 초대 목록 (pending 상태) */
export async function getPendingInvitations(
  userId: string
): Promise<CalendarShareWithDetails[]> {
  const { data, error } = await supabase
    .from("calendar_shares")
    .select(
      `
      *,
      pet:pets!pet_id(name, profile_image),
      owner:users!owner_id(nickname, profile_image),
      shared_user:users!shared_user_id(nickname, profile_image)
      `
    )
    .eq("shared_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CalendarShareWithDetails[];
}

/** 초대 수락 */
export async function acceptInvitation(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("calendar_shares")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", shareId);

  if (error) throw error;
}

/** 초대 거절 (레코드 삭제) */
export async function rejectInvitation(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("calendar_shares")
    .delete()
    .eq("id", shareId);

  if (error) throw error;
}

/** 공유받은 캘린더(반려동물) 목록 조회 */
export async function getSharedPets(
  userId: string
): Promise<CalendarShareWithDetails[]> {
  const { data, error } = await supabase
    .from("calendar_shares")
    .select(
      `
      *,
      pet:pets!pet_id(name, profile_image),
      owner:users!owner_id(nickname, profile_image),
      shared_user:users!shared_user_id(nickname, profile_image)
      `
    )
    .eq("shared_user_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarShareWithDetails[];
}

/** 멤버 권한 변경 (소유자만) */
export async function updateMemberRole(
  shareId: string,
  role: ShareRole
): Promise<void> {
  const { error } = await supabase
    .from("calendar_shares")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", shareId);

  if (error) throw error;
}

/** 멤버 내보내기 / 공유 나가기 */
export async function removeShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("calendar_shares")
    .delete()
    .eq("id", shareId);

  if (error) throw error;
}

/** 특정 반려동물에 대한 나의 공유 권한 조회 */
export async function getMyShareRole(
  petId: string,
  userId: string
): Promise<ShareRole | null> {
  const { data, error } = await supabase
    .from("calendar_shares")
    .select("role")
    .eq("pet_id", petId)
    .eq("shared_user_id", userId)
    .eq("status", "accepted")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data.role as ShareRole;
}
