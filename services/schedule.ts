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
  const { data: schedule, error } = await supabase
    .from("schedules")
    .insert({
      pet_id: data.pet_id,
      owner_id: data.owner_id,
      title: data.title,
      category: data.category,
      memo: data.memo ?? null,
      start_date: data.start_date,
      end_date: data.end_date ?? null,
      is_all_day: data.is_all_day ?? false,
      reminder: data.reminder ?? "none",
    })
    .select()
    .single();

  if (error) throw error;
  return schedule as Schedule;
}

/** 날짜 범위 내 스케줄 조회 (월간 뷰용) */
export async function getSchedulesByRange(
  petId: string,
  startDate: string,
  endDate: string
): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("pet_id", petId)
    .gte("start_date", `${startDate}T00:00:00`)
    .lte("start_date", `${endDate}T23:59:59`)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Schedule[];
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
