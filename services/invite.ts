import { supabase } from "@/lib/supabase";
import type { Invite, InviteWithDetails, ShareRole } from "@/types/sharing";

/** 초대 링크 생성 (7일 유효, 항상 viewer 권한) */
export async function createInviteLink(
  petId: string,
  ownerId: string
): Promise<Invite> {
  const role: ShareRole = "viewer";
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("invites")
    .insert({
      pet_id: petId,
      owner_id: ownerId,
      role,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Invite;
}

/** 초대 정보 조회 (딥링크 진입 시) */
export async function getInviteById(
  inviteId: string
): Promise<InviteWithDetails | null> {
  const { data, error } = await supabase
    .from("invites")
    .select(
      `
      *,
      pet:pets!pet_id(name, profile_image),
      owner:users!owner_id(nickname)
      `
    )
    .eq("id", inviteId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as InviteWithDetails;
}

/** 초대 링크로 공유 수락 */
export async function acceptInviteLink(
  inviteId: string,
  userId: string
): Promise<void> {
  // 1. 초대 정보 조회
  const { data: invite, error: fetchError } = await supabase
    .from("invites")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (fetchError) throw fetchError;
  if (!invite) throw new Error("존재하지 않는 초대입니다");

  const inv = invite as Invite;

  // 2. 유효성 검증
  if (new Date(inv.expires_at) < new Date()) {
    throw new Error("초대가 만료되었습니다. 소유자에게 새 초대를 요청해주세요");
  }
  if (inv.max_uses > 0 && inv.use_count >= inv.max_uses) {
    throw new Error("초대 링크가 더 이상 유효하지 않습니다");
  }
  if (inv.owner_id === userId) {
    throw new Error("본인의 캘린더에는 초대를 수락할 수 없습니다");
  }

  // 3. calendar_shares에 추가 (accepted 상태로 바로 추가)
  const { error: shareError } = await supabase
    .from("calendar_shares")
    .upsert(
      {
        pet_id: inv.pet_id,
        owner_id: inv.owner_id,
        shared_user_id: userId,
        role: inv.role,
        status: "accepted",
      },
      { onConflict: "pet_id,shared_user_id" }
    );

  if (shareError) throw shareError;

  // 4. 사용 횟수 증가
  const { error: updateError } = await supabase
    .from("invites")
    .update({ use_count: inv.use_count + 1 })
    .eq("id", inviteId);

  if (updateError) throw updateError;
}

/** 초대 링크 삭제 */
export async function deleteInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from("invites")
    .delete()
    .eq("id", inviteId);

  if (error) throw error;
}
