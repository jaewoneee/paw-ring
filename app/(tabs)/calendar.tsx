import dayjs, { formatISODate } from "@/utils/dayjs";
import { AlertCircle, Bell, BellOff, Calendar, Plus, Share2, Tag } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { DayScheduleList } from "@/components/calendar/DayScheduleList";
import { DayTimeGrid } from "@/components/calendar/DayTimeGrid";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { Card, CardContent } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { usePets } from "@/contexts/PetContext";
import { useAuth } from "@/hooks/useAuth";
import { useMonthSchedules } from "@/hooks/useSchedules";
import {
  completeSchedule,
  uncompleteSchedule,
  getSchedulesByRange,
} from "@/services/schedule";
import {
  isPetNotificationEnabled,
  upsertPetNotificationSetting,
} from "@/services/petNotification";
import {
  cancelScheduleNotifications,
  refreshAllNotifications,
} from "@/utils/notificationScheduler";
import type { ScheduleInstance } from "@/types/schedule";

type CalendarViewMode = "month" | "week";

export default function CalendarScreen() {
  const router = useRouter();
  const { selectedPet } = usePets();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month());
  const [selectedDate, setSelectedDate] = useState(formatISODate(dayjs()));
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [petNotificationEnabled, setPetNotificationEnabled] = useState(true);

  const { schedules, error: scheduleError, refresh, updateCompletionStatus } = useMonthSchedules(
    selectedPet?.id,
    year,
    month,
  );

  // 반려동물 알림 설정 로드
  const togglingRef = useRef(false);
  useEffect(() => {
    if (!selectedPet || !user || togglingRef.current) return;
    isPetNotificationEnabled(selectedPet.id, user.uid)
      .then(setPetNotificationEnabled)
      .catch((err) => console.warn("[calendar] 알림 설정 로드 실패:", err));
  }, [selectedPet?.id, user?.uid]);

  const handleTogglePetNotification = useCallback(async () => {
    if (!selectedPet || !user) return;
    const newValue = !petNotificationEnabled;
    togglingRef.current = true;
    setPetNotificationEnabled(newValue);
    try {
      await upsertPetNotificationSetting(selectedPet.id, user.uid, newValue);
      const today = formatISODate(dayjs());
      const rangeEnd = formatISODate(dayjs().add(7, "day"));
      const schedules = await getSchedulesByRange(selectedPet.id, today, rangeEnd);
      if (newValue) {
        await refreshAllNotifications(schedules);
      } else {
        await Promise.all(schedules.map((s) => cancelScheduleNotifications(s.id)));
      }
    } catch {
      setPetNotificationEnabled(!newValue);
    } finally {
      togglingRef.current = false;
    }
  }, [selectedPet, user, petNotificationEnabled]);

  // 화면 복귀 시 데이터 refresh
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // 선택 날짜의 스케줄 (월간 데이터에서 필터링)
  const daySchedules = useMemo(
    () => schedules.filter((s) => s.occurrenceDate === selectedDate),
    [schedules, selectedDate],
  );

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = dayjs();
    setYear(now.year());
    setMonth(now.month());
    setSelectedDate(formatISODate(now));
  };

  const handlePrevWeek = () => {
    const prev = dayjs(selectedDate).subtract(7, "day");
    setSelectedDate(formatISODate(prev));
    setYear(prev.year());
    setMonth(prev.month());
  };

  const handleNextWeek = () => {
    const next = dayjs(selectedDate).add(7, "day");
    setSelectedDate(formatISODate(next));
    setYear(next.year());
    setMonth(next.month());
  };

  const handleSelectDateInWeek = (date: string) => {
    setSelectedDate(date);
    const d = dayjs(date);
    setYear(d.year());
    setMonth(d.month());
  };

  const handleToggleComplete = useCallback(
    async (instance: ScheduleInstance) => {
      if (!user) return;
      const { schedule, occurrenceDate, completionStatus } = instance;
      const wasCompleted = completionStatus === "completed";
      const newStatus = wasCompleted ? null : ("completed" as const);

      // 낙관적 업데이트
      updateCompletionStatus(schedule.id, occurrenceDate, newStatus);

      try {
        if (wasCompleted) {
          await uncompleteSchedule(schedule.id, occurrenceDate);
        } else {
          await completeSchedule(schedule.id, occurrenceDate, user.uid);
        }
      } catch (err) {
        // 실패 시 롤백
        updateCompletionStatus(
          schedule.id,
          occurrenceDate,
          completionStatus ?? null,
        );
        console.error("[CalendarScreen] toggle complete failed:", err);
        Alert.alert("오류", "완료 상태 변경에 실패했습니다.");
      }
    },
    [user, updateCompletionStatus],
  );

  const isShared = selectedPet && 'isShared' in selectedPet && selectedPet.isShared;
  const isOwner = !isShared;

  const handleShareSettings = () => {
    if (!selectedPet) return;
    router.push({
      pathname: "/pet/sharing",
      params: { petId: selectedPet.id, petName: selectedPet.name },
    });
  };


  const handleAddSchedule = () => {
    router.push({ pathname: "/add-schedule", params: { date: selectedDate } });
  };

  const handlePressSchedule = (s: {
    schedule: { id: string };
    occurrenceDate: string;
  }) => {
    router.push({
      pathname: "/schedule-detail",
      params: { id: s.schedule.id, occurrenceDate: s.occurrenceDate },
    });
  };

  // 반려동물 미등록
  if (!selectedPet) {
    return (
      <Screen edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="p-4 gap-4">
            <Typography variant="h2">캘린더</Typography>
            <Card>
              <CardContent>
                <View className="items-center py-8 gap-3">
                  <Calendar size={32} color={colors.mutedForeground} />
                  <Typography
                    variant="body-sm"
                    className="text-muted-foreground text-center"
                  >
                    반려동물을 등록하면{"\n"}일정을 관리할 수 있어요
                  </Typography>
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  const canEdit = isOwner || ('isShared' in selectedPet && selectedPet.isShared && selectedPet.shareRole === 'editor');

  // 주간 뷰: WeekCalendar(고정) + DayTimeGrid(스크롤)
  if (viewMode === "week") {
    return (
      <Screen edges={["top", "bottom"]}>
        <View className="flex-1">
          {/* 뷰 모드 토글 */}
          <ViewModeToggle
            viewMode={viewMode}
            onChangeMode={setViewMode}
            onCategoryManage={() => router.push("/category-manage")}
            onToggleNotification={handleTogglePetNotification}
            onShareSettings={handleShareSettings}
            notificationEnabled={petNotificationEnabled}
            isOwner={isOwner}
            colors={colors}
          />

          <WeekCalendar
            selectedDate={selectedDate}
            schedules={schedules}
            onSelectDate={handleSelectDateInWeek}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onGoToday={handleGoToday}
          />

          {/* 에러 배너 */}
          {scheduleError && (
            <Pressable
              onPress={refresh}
              className="mx-4 mt-2 p-3 rounded-xl flex-row items-center gap-2"
              style={{ backgroundColor: colors.error + '15' }}
            >
              <AlertCircle size={16} color={colors.error} />
              <Typography variant="body-sm" style={{ color: colors.error, flex: 1 }}>
                {scheduleError}
              </Typography>
              <Typography variant="body-sm" style={{ color: colors.error }} className="font-medium">
                다시 시도
              </Typography>
            </Pressable>
          )}

          <DayTimeGrid
            date={selectedDate}
            schedules={daySchedules}
            onPressSchedule={handlePressSchedule}
          />
        </View>

        {/* FAB - 편집 권한 있을 때만 */}
        {canEdit && <FAB onPress={handleAddSchedule} colors={colors} />}
      </Screen>
    );
  }

  // 월간 뷰: MonthCalendar + DayScheduleList (기존)
  return (
    <Screen edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 뷰 모드 토글 */}
        <ViewModeToggle
          viewMode={viewMode}
          onChangeMode={setViewMode}
          onCategoryManage={() => router.push("/category-manage")}
          onToggleNotification={handleTogglePetNotification}
          onShareSettings={handleShareSettings}
          notificationEnabled={petNotificationEnabled}
          isOwner={isOwner}
          colors={colors}
        />

        <MonthCalendar
          year={year}
          month={month}
          selectedDate={selectedDate}
          schedules={schedules}
          onSelectDate={setSelectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onGoToday={handleGoToday}
        />

        {/* 에러 배너 */}
        {scheduleError && (
          <Pressable
            onPress={refresh}
            className="mx-4 mt-2 p-3 rounded-xl flex-row items-center gap-2"
            style={{ backgroundColor: colors.error + '15' }}
          >
            <AlertCircle size={16} color={colors.error} />
            <Typography variant="body-sm" style={{ color: colors.error, flex: 1 }}>
              {scheduleError}
            </Typography>
            <Typography variant="body-sm" style={{ color: colors.error }} className="font-medium">
              다시 시도
            </Typography>
          </Pressable>
        )}

        {/* 구분선 */}
        <View className="mx-4 border-b border-border" />

        <DayScheduleList
          date={selectedDate}
          schedules={daySchedules}
          onPressSchedule={handlePressSchedule}
          onPressAdd={handleAddSchedule}
          onToggleComplete={handleToggleComplete}
        />
      </ScrollView>

      {/* FAB - 편집 권한 있을 때만 */}
      {canEdit && <FAB onPress={handleAddSchedule} colors={colors} />}
    </Screen>
  );
}

function ViewModeToggle({
  viewMode,
  onChangeMode,
  onCategoryManage,
  onToggleNotification,
  onShareSettings,
  notificationEnabled,
  isOwner,
  colors,
}: {
  viewMode: CalendarViewMode;
  onChangeMode: (mode: CalendarViewMode) => void;
  onCategoryManage: () => void;
  onToggleNotification: () => void;
  onShareSettings: () => void;
  notificationEnabled: boolean;
  isOwner: boolean;
  colors: (typeof Colors)["light"] | (typeof Colors)["dark"];
}) {
  return (
    <View className="flex-row justify-between items-center px-4 pt-2">
      <View className="flex-row gap-2">
        <Pressable
          onPress={onCategoryManage}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
          accessibilityLabel="카테고리 관리"
          accessibilityRole="button"
        >
          <Tag size={14} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          onPress={onToggleNotification}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
          accessibilityLabel={notificationEnabled ? "알림 끄기" : "알림 켜기"}
          accessibilityRole="button"
        >
          {notificationEnabled ? (
            <Bell size={14} color={colors.primary} />
          ) : (
            <BellOff size={14} color={colors.mutedForeground} />
          )}
        </Pressable>
        {isOwner && (
          <Pressable
            onPress={onShareSettings}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.surface }}
            accessibilityLabel="공유 설정"
            accessibilityRole="button"
          >
            <Share2 size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      <View
        className="flex-row rounded-lg overflow-hidden"
        style={{ backgroundColor: colors.surface }}
      >
        <Pressable
          onPress={() => onChangeMode("month")}
          className="px-3 py-1.5"
          style={
            viewMode === "month"
              ? { backgroundColor: colors.primary }
              : undefined
          }
        >
          <Typography
            variant="body-sm"
            className="font-medium"
            style={{
              color:
                viewMode === "month"
                  ? colors.primaryForeground
                  : colors.mutedForeground,
            }}
          >
            월
          </Typography>
        </Pressable>
        <Pressable
          onPress={() => onChangeMode("week")}
          className="px-3 py-1.5"
          style={
            viewMode === "week"
              ? { backgroundColor: colors.primary }
              : undefined
          }
        >
          <Typography
            variant="body-sm"
            className="font-medium"
            style={{
              color:
                viewMode === "week"
                  ? colors.primaryForeground
                  : colors.mutedForeground,
            }}
          >
            주
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

function FAB({
  onPress,
  colors,
}: {
  onPress: () => void;
  colors: (typeof Colors)["light"] | (typeof Colors)["dark"];
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="일정 추가"
      accessibilityRole="button"
      className="absolute items-center justify-center rounded-full"
      style={{
        right: 20,
        bottom: 100,
        width: 52,
        height: 52,
        backgroundColor: colors.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Plus size={20} color={colors.primaryForeground} />
    </Pressable>
  );
}
