import { Bell, Calendar, Clock, RefreshCw, type LucideIcon } from 'lucide-react-native';
import { CategoryIcon } from '@/utils/categoryIcon';
import dayjs from "@/utils/dayjs";
import { formatKoreanDate, formatKoreanDateNoDay } from "@/utils/dayjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";

import { ScheduleDetailSkeleton } from "@/components/ui/Skeleton";
import { Typography } from "@/components/ui/Typography";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { REMINDER_OPTIONS } from "@/constants/Schedule";
import { useCategoryContext } from "@/contexts/CategoryContext";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/hooks/queryKeys";
import {
  completeSchedule,
  deleteScheduleAll,
  deleteScheduleThisAndFollowing,
  deleteScheduleThisOnly,
  getScheduleById,
  getScheduleCompletion,
  getScheduleExceptionByDate,
  uncompleteSchedule,
  updateSchedule,
  updateScheduleThisOnly,
} from "@/services/schedule";
import { isFirstOrLastOccurrence } from "@/utils/rrule";
import type { Schedule } from "@/types/schedule";
import { formatTime } from "@/utils/date";
import { formatRRuleLabel } from "@/utils/rrule";

export default function ScheduleDetailScreen() {
  const router = useRouter();
  const { id, occurrenceDate } = useLocalSearchParams<{ id: string; occurrenceDate?: string }>();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const { user } = useAuth();
  const { getCategoryMeta } = useCategoryContext();
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const { data: scheduleData, isPending: isLoading } = useQuery({
    queryKey: queryKeys.schedules.detail(id ?? ''),
    queryFn: async () => {
      const data = await getScheduleById(id!);
      const targetDate = occurrenceDate ?? data.start_date.split("T")[0];

      if (data.is_recurring && occurrenceDate) {
        const exception = await getScheduleExceptionByDate(id!, occurrenceDate);
        if (exception?.modified_fields) {
          Object.assign(data, exception.modified_fields);
        }
      }

      let completed = false;
      if (data.is_completable) {
        const completion = await getScheduleCompletion(id!, targetDate);
        completed = !!completion;
      }

      return { schedule: data, completionDate: targetDate, completed };
    },
    enabled: !!id,
    staleTime: 60 * 1000,
    meta: { onError: () => {
      Alert.alert("오류", "일정을 불러올 수 없습니다.");
      router.back();
    }},
  });

  const schedule = scheduleData?.schedule ?? null;
  const completionDate = scheduleData?.completionDate ?? '';

  // 서버에서 받아온 완료 상태로 초기화
  const serverCompleted = scheduleData?.completed ?? false;
  if (isCompleted !== serverCompleted && !isToggling) {
    setIsCompleted(serverCompleted);
  }

  const handleToggleComplete = async () => {
    if (!schedule || !user || isToggling) return;
    setIsToggling(true);
    try {
      if (isCompleted) {
        await uncompleteSchedule(schedule.id, completionDate);
        setIsCompleted(false);
      } else {
        await completeSchedule(schedule.id, completionDate, user.uid);
        setIsCompleted(true);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
    } catch (err) {
      console.error("[ScheduleDetail] toggle complete failed:", err);
      Alert.alert("오류", "완료 상태 변경에 실패했습니다.");
    } finally {
      setIsToggling(false);
    }
  };


  const handleEdit = () => {
    router.push({
      pathname: "/edit-schedule",
      params: {
        id: schedule!.id,
        ...(schedule?.is_recurring && occurrenceDate ? { occurrenceDate } : {}),
      },
    });
  };

  const handleDelete = () => {
    if (schedule?.is_recurring && schedule.rrule) {
      const date = occurrenceDate ?? completionDate;
      const { isFirst, isLast } = isFirstOrLastOccurrence(
        schedule.start_date,
        schedule.rrule,
        date,
        schedule.recurrence_end_date,
      );

      const buttons: { text: string; style?: "cancel" | "destructive" | "default"; onPress?: () => void }[] = [
        { text: "취소", style: "cancel" },
        {
          text: "이 일정만",
          onPress: async () => {
            try {
              await deleteScheduleThisOnly(id!, date);
              queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
              router.back();
            } catch (err) {
              console.error("[ScheduleDetail] delete single failed:", err);
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        },
      ];

      if (isFirst || isLast) {
        buttons.push({
          text: "모든 일정 삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteScheduleAll(id!);
              queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
              router.back();
            } catch (err) {
              console.error("[ScheduleDetail] delete all failed:", err);
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        });
      } else {
        buttons.push({
          text: "이후 모든 일정",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteScheduleThisAndFollowing(id!, date);
              queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
              router.back();
            } catch (err) {
              console.error("[ScheduleDetail] delete following failed:", err);
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        });
      }

      Alert.alert("반복 일정 삭제", "어떻게 삭제할까요?", buttons);
    } else {
      Alert.alert("일정 삭제", "이 일정을 삭제할까요?", [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteScheduleAll(id!);
              queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
              router.back();
            } catch (err) {
              console.error("[ScheduleDetail] delete failed:", err);
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        },
      ]);
    }
  };

  if (isLoading || !schedule) {
    return (
      <Screen>
        <ScheduleDetailSkeleton />
      </Screen>
    );
  }

  const meta = getCategoryMeta(schedule.category);
  const displayDate = occurrenceDate ?? schedule.start_date;
  const dateLabel = formatKoreanDate(displayDate);
  const timeLabel = schedule.is_all_day
    ? "종일"
    : formatTime(schedule.start_date);
  const reminderLabel =
    REMINDER_OPTIONS.find((r) => r.value === schedule.reminder)?.label ?? "없음";

  const endDateLabel = schedule.end_date
    ? formatKoreanDate(
        occurrenceDate && schedule.is_recurring
          ? dayjs(occurrenceDate)
              .add(dayjs(schedule.end_date).diff(dayjs(schedule.start_date), "day"), "day")
              .format("YYYY-MM-DD")
          : schedule.end_date,
      )
    : null;

  const recurrenceLabel =
    schedule.is_recurring && schedule.rrule
      ? formatRRuleLabel(schedule.rrule)
      : null;

  const recurrenceEndLabel =
    schedule.is_recurring && schedule.recurrence_end_date
      ? formatKoreanDateNoDay(schedule.recurrence_end_date)
      : null;

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        <Card>
          <CardContent>
            <View className="gap-4">
              {/* 카테고리 뱃지 + 제목 */}
              <View className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: meta.color + "20" }}
                >
                  <CategoryIcon
                    name={meta.icon}
                    size={18}
                    color={meta.color}
                  />
                </View>
                <View className="flex-1">
                  <Typography variant="body-xl" className="font-semibold">
                    {schedule.title}
                  </Typography>
                  <Typography
                    variant="small"
                    className="font-medium"
                    style={{ color: meta.color }}
                  >
                    {meta.name}
                  </Typography>
                </View>
              </View>

              {/* 구분선 */}
              <View className="border-b border-border" />

              {/* 날짜/시간 */}
              <DetailRow
                icon="calendar"
                label="날짜"
                value={dateLabel}
                colors={colors}
              />
              <DetailRow
                icon="clock-o"
                label="시간"
                value={timeLabel}
                colors={colors}
              />
              <DetailRow
                icon="bell-o"
                label="알림"
                value={reminderLabel}
                colors={colors}
              />

              {endDateLabel && (
                <DetailRow
                  icon="calendar"
                  label="종료"
                  value={endDateLabel}
                  colors={colors}
                />
              )}

              {recurrenceLabel && (
                <DetailRow
                  icon="refresh"
                  label="반복"
                  value={
                    recurrenceEndLabel
                      ? `${recurrenceLabel} (${recurrenceEndLabel}까지)`
                      : recurrenceLabel
                  }
                  colors={colors}
                />
              )}

              {/* 메모 */}
              {schedule.memo && (
                <>
                  <View className="border-b border-border" />
                  <View className="gap-1">
                    <Typography
                      variant="small"
                      className="text-muted-foreground font-medium"
                    >
                      메모
                    </Typography>
                    <Typography variant="body-md">{schedule.memo}</Typography>
                  </View>
                </>
              )}
            </View>
          </CardContent>
        </Card>

        {/* 완료 처리 */}
        {schedule.is_completable && (
          <Button
            onPress={handleToggleComplete}
            variant={isCompleted ? "outline" : "default"}
            disabled={isToggling}
          >
            {isCompleted ? "완료 취소" : "오늘 일정 완료"}
          </Button>
        )}

        {/* 액션 버튼 */}
        <View className="gap-3">
          <Button variant="outline" onPress={handleEdit}>
            수정
          </Button>
          <Button variant="outline" onPress={handleDelete}>
            삭제
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}

const DETAIL_ROW_ICONS: Record<string, LucideIcon> = {
  calendar: Calendar,
  'clock-o': Clock,
  'bell-o': Bell,
  refresh: RefreshCw,
};

function DetailRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: (typeof Colors)["light"] | (typeof Colors)["dark"];
}) {
  const Icon = DETAIL_ROW_ICONS[icon] ?? Calendar;
  return (
    <View className="flex-row items-center gap-3">
      <View style={{ width: 20, alignItems: "center" }}>
        <Icon size={16} color={colors.mutedForeground} />
      </View>
      <Typography
        variant="body-sm"
        style={{ color: colors.mutedForeground, width: 40 }}
      >
        {label}
      </Typography>
      <Typography variant="body-md" className="flex-1">
        {value}
      </Typography>
    </View>
  );
}
