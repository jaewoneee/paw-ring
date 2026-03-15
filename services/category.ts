import { randomUUID } from "expo-crypto";
import { supabase } from "@/lib/supabase";
import type { ScheduleCategoryItem } from "@/types/schedule";

const TABLE = "schedule_categories";

/** 초기 카테고리 템플릿 (캘린더 생성 시 유저 소유로 복사) */
const INITIAL_CATEGORIES = [
  { name: "산책", color: "#F59E0B", icon: "paw", sort_order: 0 },
  { name: "식사", color: "#22C55E", icon: "cutlery", sort_order: 1 },
  { name: "병원", color: "#EF4444", icon: "hospital-o", sort_order: 2 },
  { name: "목욕", color: "#3B82F6", icon: "tint", sort_order: 3 },
  { name: "기타", color: "#6B7280", icon: "tag", sort_order: 4 },
];

/** 유저의 카테고리가 없으면 초기 카테고리를 생성 */
export async function initUserCategories(
  ownerId: string
): Promise<ScheduleCategoryItem[]> {
  // 이미 유저 소유 카테고리가 있는지 확인
  const { data: existing, error: checkError } = await supabase
    .from(TABLE)
    .select("id")
    .eq("owner_id", ownerId)
    .limit(1);

  if (checkError) throw checkError;
  if (existing && existing.length > 0) return [];

  const rows = INITIAL_CATEGORIES.map((cat) => ({
    id: randomUUID(),
    owner_id: ownerId,
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
    is_default: false,
    sort_order: cat.sort_order,
  }));

  const { data, error } = await supabase.from(TABLE).insert(rows).select();

  if (error) throw error;
  return data as ScheduleCategoryItem[];
}

/** 사용자의 카테고리 목록 조회 (유저 소유만) */
export async function getCategories(
  ownerId: string
): Promise<ScheduleCategoryItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("owner_id", ownerId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data as ScheduleCategoryItem[];
}

/** 여러 사용자의 카테고리 목록 조회 (공유 캘린더 오너 포함) */
export async function getCategoriesByOwnerIds(
  ownerIds: string[]
): Promise<ScheduleCategoryItem[]> {
  if (ownerIds.length === 0) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .in("owner_id", ownerIds)
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

/** 카테고리 생성 */
export async function createCategory(input: {
  owner_id: string;
  name: string;
  color: string;
  icon?: string;
}): Promise<ScheduleCategoryItem> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      id: randomUUID(),
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

/** 카테고리 삭제 (해당 스케줄의 카테고리는 orphan 처리 — fallback 표시) */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) throw error;
}
