import { supabase } from "@/lib/supabase";

export interface PetNotificationSetting {
  id: string;
  pet_id: string;
  user_id: string;
  enabled: boolean;
}

/**
 * 특정 반려동물의 알림 설정을 조회한다.
 * 설정이 없으면 null을 반환한다 (기본값은 enabled=true로 간주).
 */
export async function getPetNotificationSetting(
  petId: string,
  userId: string,
): Promise<PetNotificationSetting | null> {
  const { data, error } = await supabase
    .from("pet_notification_settings")
    .select("*")
    .eq("pet_id", petId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as PetNotificationSetting | null;
}

/**
 * 유저의 모든 반려동물 알림 설정을 조회한다.
 */
export async function getAllPetNotificationSettings(
  userId: string,
): Promise<PetNotificationSetting[]> {
  const { data, error } = await supabase
    .from("pet_notification_settings")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []) as PetNotificationSetting[];
}

/**
 * 반려동물 알림 설정을 upsert한다 (없으면 생성, 있으면 수정).
 */
export async function upsertPetNotificationSetting(
  petId: string,
  userId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("pet_notification_settings")
    .upsert(
      { pet_id: petId, user_id: userId, enabled },
      { onConflict: "pet_id,user_id" },
    );

  if (error) throw error;
}

/**
 * 특정 반려동물의 알림이 활성화되어 있는지 확인한다.
 * 설정 레코드가 없으면 기본값 true (알림 활성)로 간주한다.
 */
export async function isPetNotificationEnabled(
  petId: string,
  userId: string,
): Promise<boolean> {
  const setting = await getPetNotificationSetting(petId, userId);
  return setting?.enabled ?? true;
}
