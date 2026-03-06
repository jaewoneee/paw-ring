import { supabase } from "@/lib/supabase";
import type { ScheduleCategoryItem } from "@/types/schedule";

const TABLE = "schedule_categories";

/** 사용자의 카테고리 목록 조회 (기본 + 커스텀) */
export async function getCategories(
  ownerId: string
): Promise<ScheduleCategoryItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .or(`owner_id.eq.__system__,owner_id.eq.${ownerId}`)
    .order("is_default", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data as ScheduleCategoryItem[];
}

/** 카테고리 단건 조회 */
export async function getCategoryById(
  id: string
): Promise<ScheduleCategoryItem | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as ScheduleCategoryItem | null;
}

/** 커스텀 카테고리 생성 */
export async function createCategory(input: {
  owner_id: string;
  name: string;
  color: string;
  icon?: string;
}): Promise<ScheduleCategoryItem> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      id: crypto.randomUUID(),
      owner_id: input.owner_id,
      name: input.name,
      color: input.color,
      icon: input.icon ?? "tag",
      is_default: false,
      sort_order: 100,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ScheduleCategoryItem;
}

/** 카테고리 수정 (이름, 색상, 아이콘) */
export async function updateCategory(
  id: string,
  input: { name?: string; color?: string; icon?: string }
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** 커스텀 카테고리 삭제 + 해당 스케줄 카테고리를 'other'로 변경 */
export async function deleteCategory(id: string): Promise<void> {
  // 해당 카테고리를 사용 중인 스케줄을 'other'로 변경
  const { error: updateError } = await supabase
    .from("schedules")
    .update({ category: "other" })
    .eq("category", id);

  if (updateError) throw updateError;

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) throw error;
}
