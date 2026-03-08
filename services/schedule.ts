import dayjs, { formatISODate, toLocalISOString } from "@/utils/dayjs";
import { supabase } from "@/lib/supabase";
import type {
  CreateScheduleInput,
  Schedule,
  ScheduleCompletion,
  ScheduleException,
  UpdateScheduleInput,
} from "@/types/schedule";
import { expandRRule } from "@/utils/rrule";

/**
 * parent_schedule_id 기반 중복 제거
 *
 * keepLatestOnly = false (캘린더 뷰): 범위 내 occurrence가 있는 것만 남긴다 (날짜별 정확도 중요)
 * keepLatestOnly = true  (다가오는 일정): 같은 계열 중 가장 최신(자식) 하나만 남긴다
 */
function deduplicateByParent(
  schedules: Schedule[],
  rangeStart: string,
  rangeEnd: string,
  keepLatestOnly = false,
): Schedule[] {
  // 계열별로 그룹핑 (parent_schedule_id 또는 자기 id 기준)
  const familyMap = new Map<string, Schedule[]>();
  for (const s of schedules) {
    const rootId = s.parent_schedule_id ?? s.id;
    const group = familyMap.get(rootId) ?? [];
    group.push(s);
    familyMap.set(rootId, group);
  }

  const result: Schedule[] = [];
  for (const group of familyMap.values()) {
    if (group.length <= 1) {
      result.push(...group);
      continue;
    }

    if (keepLatestOnly) {
      // 다가오는 일정: 같은 계열 중 가장 늦게 생성된(자식) 스케줄만 표시
      const withOccurrences = group.filter((s) => {
        if (s.is_recurring && s.rrule) {
          return expandRRule(s.start_date, s.rrule, rangeStart, rangeEnd, s.recurrence_end_date).length > 0;
        }
        return true;
      });
      if (withOccurrences.length === 0) continue;
      // 자식(parent_schedule_id가 있는 것)을 우선, 동률이면 start_date가 가장 늦은 것
      withOccurrences.sort((a, b) => {
        const aIsChild = a.parent_schedule_id ? 1 : 0;
        const bIsChild = b.parent_schedule_id ? 1 : 0;
        if (aIsChild !== bIsChild) return bIsChild - aIsChild;
        return b.start_date.localeCompare(a.start_date);
      });
      result.push(withOccurrences[0]);
    } else {
      // 캘린더 뷰: 범위 내 occurrence가 있는 모든 스케줄 유지
      for (const s of group) {
        if (s.is_recurring && s.rrule) {
          const occurrences = expandRRule(
            s.start_date, s.rrule, rangeStart, rangeEnd, s.recurrence_end_date,
          );
          if (occurrences.length > 0) {
            result.push(s);
          }
        } else {
          result.push(s);
        }
      }
    }
  }
  return result;
}

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
    is_completable: data.is_completable ?? false,
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
  const [inRangeRes, recurringBeforeRes, multiDayBeforeRes] = await Promise.all([
    // 1) 범위 내 start_date를 가진 스케줄
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .gte("start_date", `${startDate}T00:00:00`)
      .lte("start_date", `${endDate}T23:59:59`)
      .order("start_date", { ascending: true }),
    // 2) 범위 이전에 시작된 반복 스케줄 (아직 종료되지 않은 것)
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .eq("is_recurring", true)
      .lt("start_date", `${startDate}T00:00:00`)
      .or(`recurrence_end_date.gte.${startDate}T00:00:00,recurrence_end_date.is.null`),
    // 3) 범위 이전에 시작되어 범위까지 이어지는 다일(multi-day) 스케줄
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .eq("is_recurring", false)
      .lt("start_date", `${startDate}T00:00:00`)
      .gte("end_date", `${startDate}T00:00:00`),
  ]);

  if (inRangeRes.error) throw inRangeRes.error;
  if (recurringBeforeRes.error) throw recurringBeforeRes.error;
  if (multiDayBeforeRes.error) throw multiDayBeforeRes.error;

  // id 기준 중복 제거 후 병합
  const map = new Map<string, Schedule>();
  for (const s of [...(inRangeRes.data ?? []), ...(recurringBeforeRes.data ?? []), ...(multiDayBeforeRes.data ?? [])]) {
    map.set(s.id, s as Schedule);
  }
  return deduplicateByParent(Array.from(map.values()), startDate, endDate);
}

/** 다가오는 스케줄 조회 (홈 화면용, 일주일 이내, 완료된 것 제외) */
export async function getUpcomingSchedules(
  petId: string
): Promise<Schedule[]> {
  // dayjs로 로컬 타임존 기준 날짜 계산 (UTC 오프셋 문제 방지)
  const todayDateStr = formatISODate(dayjs());
  const oneWeekLater = dayjs().add(7, "day");
  const oneWeekLaterDateStr = formatISODate(oneWeekLater);
  const startOfToday = `${todayDateStr}T00:00:00`;
  const endOfWeek = `${oneWeekLaterDateStr}T23:59:59`;

  const [schedulesRes, recurringRes, completionsRes] = await Promise.all([
    // 1) 범위 내 start_date를 가진 일반 스케줄
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .gte("start_date", startOfToday)
      .lte("start_date", endOfWeek)
      .order("start_date", { ascending: true }),
    // 2) 오늘 이전에 시작된 반복 스케줄 (아직 종료되지 않은 것)
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .eq("is_recurring", true)
      .lt("start_date", startOfToday)
      .or(`recurrence_end_date.gte.${todayDateStr},recurrence_end_date.is.null`),
    supabase
      .from("schedule_completions")
      .select("schedule_id, completion_date")
      .gte("completion_date", todayDateStr)
      .lte("completion_date", oneWeekLaterDateStr),
  ]);

  if (schedulesRes.error) throw schedulesRes.error;
  if (recurringRes.error) throw recurringRes.error;
  if (completionsRes.error) throw completionsRes.error;

  // schedule_id + completion_date 조합으로 완료 여부 판별
  const completedSet = new Set(
    (completionsRes.data ?? []).map((c) => `${c.schedule_id}_${c.completion_date}`)
  );

  // 반복 스케줄을 occurrence 단위로 확장하여 각 날짜별 완료 여부 체크
  const recurringSchedules = (recurringRes.data ?? []) as Schedule[];
  const result: Schedule[] = [];

  // 일반 스케줄: 각 날짜별 완료 여부 체크
  for (const s of (schedulesRes.data ?? []) as Schedule[]) {
    if (!s.is_completable) {
      result.push(s);
      continue;
    }
    const scheduleDate = s.start_date.split("T")[0];
    if (!completedSet.has(`${s.id}_${scheduleDate}`)) {
      result.push(s);
    }
  }

  // 반복 스케줄: 범위 내 occurrence 중 하나라도 미완료면 포함
  for (const s of recurringSchedules) {
    if (!s.rrule) continue;
    const occurrences = expandRRule(
      s.start_date,
      s.rrule,
      todayDateStr,
      oneWeekLaterDateStr,
      s.recurrence_end_date,
    );
    if (occurrences.length === 0) continue;

    if (!s.is_completable) {
      result.push(s);
      continue;
    }
    // 하나라도 미완료 occurrence가 있으면 표시
    const hasIncomplete = occurrences.some(
      (date) => !completedSet.has(`${s.id}_${date}`)
    );
    if (hasIncomplete) {
      result.push(s);
    }
  }

  // id 기준 중복 제거
  const map = new Map<string, Schedule>();
  for (const s of result) map.set(s.id, s);

  // parent_schedule_id 기반 중복 제거:
  // 같은 계열 중 가장 최신(자식) 스케줄만 표시
  return deduplicateByParent(Array.from(map.values()), todayDateStr, oneWeekLaterDateStr, true);
}

/** 특정 스케줄의 특정 날짜 완료 여부 조회 */
export async function getScheduleCompletion(
  scheduleId: string,
  completionDate: string
): Promise<ScheduleCompletion | null> {
  const { data, error } = await supabase
    .from("schedule_completions")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("completion_date", completionDate)
    .maybeSingle();

  if (error) throw error;
  return data as ScheduleCompletion | null;
}

/** 스케줄 완료 처리 */
export async function completeSchedule(
  scheduleId: string,
  completionDate: string,
  userId: string
): Promise<ScheduleCompletion> {
  const { data, error } = await supabase
    .from("schedule_completions")
    .upsert(
      {
        schedule_id: scheduleId,
        completion_date: completionDate,
        completed_by: userId,
      },
      { onConflict: "schedule_id,completion_date" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as ScheduleCompletion;
}

/** 스케줄 완료 취소 */
export async function uncompleteSchedule(
  scheduleId: string,
  completionDate: string
): Promise<void> {
  const { error } = await supabase
    .from("schedule_completions")
    .delete()
    .eq("schedule_id", scheduleId)
    .eq("completion_date", completionDate);

  if (error) throw error;
}

/** 기간 내 completion 상태 일괄 조회 */
export async function getCompletionsByRange(
  scheduleIds: string[],
  startDate: string,
  endDate: string
): Promise<ScheduleCompletion[]> {
  if (scheduleIds.length === 0) return [];
  const { data, error } = await supabase
    .from("schedule_completions")
    .select("*")
    .in("schedule_id", scheduleIds)
    .gte("completion_date", startDate)
    .lte("completion_date", endDate);

  if (error) throw error;
  return (data ?? []) as ScheduleCompletion[];
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

/** 특정 날짜의 스케줄 예외 조회 (반복 스케줄의 "이 일정만" 수정 데이터) */
export async function getScheduleExceptionByDate(
  scheduleId: string,
  exceptionDate: string
): Promise<ScheduleException | null> {
  const { data, error } = await supabase
    .from("schedule_exceptions")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("exception_date", exceptionDate)
    .eq("type", "modified")
    .maybeSingle();

  if (error) throw error;
  return data as ScheduleException | null;
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

  // 원본(루트) 스케줄의 제목/카테고리 변경 시 파생 스케줄에도 전파
  if (data.title !== undefined || data.category !== undefined) {
    const cascadeFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) cascadeFields.title = data.title;
    if (data.category !== undefined) cascadeFields.category = data.category;

    await supabase
      .from("schedules")
      .update(cascadeFields)
      .eq("parent_schedule_id", id);
  }
}

/** 스케줄 삭제 (전체) */
export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) throw error;
}

// ─── 반복 스케줄 예외 처리 ───

/** 특정 스케줄의 예외 목록 조회 */
export async function getScheduleExceptions(
  scheduleIds: string[]
): Promise<ScheduleException[]> {
  if (scheduleIds.length === 0) return [];
  const { data, error } = await supabase
    .from("schedule_exceptions")
    .select("*")
    .in("schedule_id", scheduleIds);

  if (error) throw error;
  return (data ?? []) as ScheduleException[];
}

/** 반복 스케줄 - 이 일정만 수정 (예외 생성) */
export async function updateScheduleThisOnly(
  scheduleId: string,
  exceptionDate: string,
  modifiedFields: ScheduleException["modified_fields"]
): Promise<void> {
  const { error } = await supabase.from("schedule_exceptions").upsert(
    {
      schedule_id: scheduleId,
      exception_date: exceptionDate,
      type: "modified",
      modified_fields: modifiedFields,
    },
    { onConflict: "schedule_id,exception_date" }
  );

  if (error) throw error;
}

/** 반복 스케줄 - 이후 모든 일정 수정 (원본 종료 + 새 스케줄 생성) */
export async function updateScheduleThisAndFollowing(
  originalScheduleId: string,
  fromDate: string,
  newData: CreateScheduleInput
): Promise<void> {
  const original = await getScheduleById(originalScheduleId);
  const originalStartDate = original.start_date.split("T")[0];

  if (fromDate <= originalStartDate) {
    // fromDate가 시작일과 같거나 이전이면 원본 자체를 업데이트
    await updateSchedule(originalScheduleId, {
      title: newData.title,
      category: newData.category,
      memo: newData.memo ?? null,
      start_date: newData.start_date,
      end_date: newData.end_date ?? null,
      is_all_day: newData.is_all_day,
      is_completable: newData.is_completable,
      reminder: newData.reminder,
      is_recurring: newData.is_recurring,
      rrule: newData.rrule ?? null,
      recurrence_end_date: newData.recurrence_end_date ?? null,
    });
  } else {
    // 중간 날짜부터 변경: 원본 종료 + 새 스케줄 생성 (parent_schedule_id로 연결)
    const dayBefore = dayjs(fromDate).subtract(1, "day").endOf("day");
    await updateSchedule(originalScheduleId, {
      recurrence_end_date: toLocalISOString(dayBefore),
    });
    // 파생 스케줄의 start_date는 fromDate 기준으로 보정 (form의 원래 시작일이 아님)
    const newStartDate = newData.is_all_day
      ? toLocalISOString(dayjs(fromDate).startOf("day"))
      : toLocalISOString(
          dayjs(fromDate)
            .hour(dayjs(newData.start_date).hour())
            .minute(dayjs(newData.start_date).minute())
            .second(0)
        );
    // 원본의 parent_schedule_id가 있으면 그것을 사용, 없으면 원본 id를 parent로 설정
    const rootId = original.parent_schedule_id ?? originalScheduleId;
    const { data: newSchedule, error } = await supabase
      .from("schedules")
      .insert({
        ...newData,
        start_date: newStartDate,
        parent_schedule_id: rootId,
      })
      .select()
      .single();
    if (error) throw error;
  }
}

/** 반복 스케줄 - 이 일정만 삭제 (예외 등록) */
export async function deleteScheduleThisOnly(
  scheduleId: string,
  exceptionDate: string
): Promise<void> {
  const { error } = await supabase.from("schedule_exceptions").upsert(
    {
      schedule_id: scheduleId,
      exception_date: exceptionDate,
      type: "deleted",
      modified_fields: null,
    },
    { onConflict: "schedule_id,exception_date" }
  );

  if (error) throw error;
}

/** 반복 스케줄 - 이후 모든 일정 삭제 (반복 종료일 변경) */
export async function deleteScheduleThisAndFollowing(
  scheduleId: string,
  fromDate: string
): Promise<void> {
  const schedule = await getScheduleById(scheduleId);
  const startDateStr = schedule.start_date.split("T")[0];

  // fromDate가 시작일과 같으면 스케줄 자체를 삭제
  if (fromDate <= startDateStr) {
    await deleteSchedule(scheduleId);
    return;
  }

  // 그렇지 않으면 전날까지로 반복 종료
  const dayBefore = dayjs(fromDate).subtract(1, "day").endOf("day");
  await updateSchedule(scheduleId, {
    recurrence_end_date: toLocalISOString(dayBefore),
  });
}
