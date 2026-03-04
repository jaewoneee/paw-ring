import { supabase } from "@/lib/supabase";
import type {
  CreateScheduleInput,
  Schedule,
  UpdateScheduleInput,
} from "@/types/schedule";

/** 스케줄 생성 */
export async function createSchedule(
  data: CreateScheduleInput
): Promise<Schedule> {
  const row: Record<string, unknown> = {
    pet_id: data.pet_id,
    owner_id: data.owner_id,
    title: data.title,
    category: data.category,
    memo: data.memo ?? null,
    start_date: data.start_date,
    is_all_day: data.is_all_day ?? false,
    reminder: data.reminder ?? "none",
  };
  if (data.end_date) row.end_date = data.end_date;
  if (data.is_recurring) {
    row.is_recurring = true;
    if (data.rrule) row.rrule = data.rrule;
    if (data.recurrence_end_date) row.recurrence_end_date = data.recurrence_end_date;
  }

  const { data: schedule, error } = await supabase
    .from("schedules")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return schedule as Schedule;
}

/** 날짜 범위 내 스케줄 조회 (월간 뷰용) — 반복 스케줄 포함 */
export async function getSchedulesByRange(
  petId: string,
  startDate: string,
  endDate: string
): Promise<Schedule[]> {
  // 1) 범위 내 start_date를 가진 스케줄
  const { data: inRange, error: err1 } = await supabase
    .from("schedules")
    .select("*")
    .eq("pet_id", petId)
    .gte("start_date", `${startDate}T00:00:00`)
    .lte("start_date", `${endDate}T23:59:59`)
    .order("start_date", { ascending: true });

  // 2) 범위 이전에 시작된 반복 스케줄 (아직 종료되지 않은 것)
  const { data: recurringBefore, error: err2 } = await supabase
    .from("schedules")
    .select("*")
    .eq("pet_id", petId)
    .eq("is_recurring", true)
    .lt("start_date", `${startDate}T00:00:00`)
    .or(`recurrence_end_date.gte.${startDate}T00:00:00,recurrence_end_date.is.null`);

  if (err1) throw err1;
  if (err2) throw err2;

  // id 기준 중복 제거 후 병합
  const map = new Map<string, Schedule>();
  for (const s of [...(inRange ?? []), ...(recurringBefore ?? [])]) {
    map.set(s.id, s as Schedule);
  }
  return Array.from(map.values());
}

/** 다가오는 스케줄 조회 (홈 화면용) */
export async function getUpcomingSchedules(
  petId: string,
  limit: number = 5
): Promise<Schedule[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("pet_id", petId)
    .gte("start_date", now)
    .order("start_date", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Schedule[];
}

/** 단건 스케줄 조회 */
export async function getScheduleById(id: string): Promise<Schedule> {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Schedule;
}

/** 스케줄 수정 */
export async function updateSchedule(
  id: string,
  data: UpdateScheduleInput
): Promise<void> {
  const { error } = await supabase
    .from("schedules")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** 스케줄 삭제 */
export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) throw error;
}
