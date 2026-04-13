import dayjs, {
  formatISODate,
  formatMonthLabel,
  formatShortMonth,
} from '@/utils/dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AlertCircle,
  Bell,
  BellOff,
  Calendar,
  CalendarDays,
  CalendarRange,
  Plus,
  Settings,
  Share2,
  Tag,
} from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { DayScheduleList } from '@/components/calendar/DayScheduleList';
import { DayTimeGrid } from '@/components/calendar/DayTimeGrid';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { Card, CardContent } from '@/components/ui/Card';
import { Popover, PopoverItem } from '@/components/ui/Popover';
import { Screen } from '@/components/ui/Screen';
import { DayScheduleSkeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePets } from '@/contexts/PetContext';
import { queryKeys } from '@/hooks/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { useMonthSchedules } from '@/hooks/useSchedules';
import {
  isPetNotificationEnabled,
  upsertPetNotificationSetting,
} from '@/services/petNotification';
import {
  completeSchedule,
  getSchedulesByRange,
  uncompleteSchedule,
} from '@/services/schedule';
import type { ScheduleInstance } from '@/types/schedule';
import {
  cancelScheduleNotifications,
  refreshAllNotifications,
} from '@/utils/notificationScheduler';
import { canEditSchedule, canManageMembers } from '@/utils/permissions';

type CalendarViewMode = 'month' | 'week';

export default function CalendarScreen() {
  const router = useRouter();
  const { selectedPet } = usePets();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month());
  const [selectedDate, setSelectedDate] = useState(formatISODate(dayjs()));
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [petNotificationEnabled, setPetNotificationEnabled] = useState(true);

  const {
    schedules,
    isLoading: isScheduleLoading,
    error: scheduleError,
    refresh,
    updateCompletionStatus,
  } = useMonthSchedules(selectedPet?.id, year, month);

  // 화면 복귀 시 일정 갱신 (수정/삭제/완료 변경 후 돌아왔을 때)
  const queryClient = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
    }, [queryClient])
  );

  // 반려동물 알림 설정 로드
  const togglingRef = useRef(false);
  useEffect(() => {
    if (!selectedPet || !user || togglingRef.current) return;
    isPetNotificationEnabled(selectedPet.id, user.uid)
      .then(setPetNotificationEnabled)
      .catch(err => console.warn('[calendar] 알림 설정 로드 실패:', err));
  }, [selectedPet?.id, user?.uid]);

  const handleTogglePetNotification = useCallback(async () => {
    if (!selectedPet || !user) return;
    const newValue = !petNotificationEnabled;
    togglingRef.current = true;
    setPetNotificationEnabled(newValue);
    try {
      await upsertPetNotificationSetting(selectedPet.id, user.uid, newValue);
      const today = formatISODate(dayjs());
      const rangeEnd = formatISODate(dayjs().add(7, 'day'));
      const schedules = await getSchedulesByRange(
        selectedPet.id,
        today,
        rangeEnd
      );
      if (newValue) {
        await refreshAllNotifications(schedules);
      } else {
        await Promise.all(
          schedules.map(s => cancelScheduleNotifications(s.id))
        );
      }
    } catch {
      setPetNotificationEnabled(!newValue);
    } finally {
      togglingRef.current = false;
    }
  }, [selectedPet, user, petNotificationEnabled]);

  // 선택 날짜의 스케줄 (월간 데이터에서 필터링)
  const daySchedules = useMemo(
    () => schedules.filter(s => s.occurrenceDate === selectedDate),
    [schedules, selectedDate]
  );

  // 툴바 월 레이블 및 오늘 여부
  const toolbarMonthLabel = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = dayjs(selectedDate).startOf('week');
      const weekEnd = weekStart.add(6, 'day');
      return weekStart.month() === weekEnd.month()
        ? formatMonthLabel(weekStart)
        : `${formatShortMonth(weekStart)} - ${formatShortMonth(weekEnd)}`;
    }
    return formatMonthLabel(dayjs().year(year).month(month));
  }, [viewMode, year, month, selectedDate]);

  const isCurrentPeriod = useMemo(() => {
    const now = dayjs();
    if (viewMode === 'week') {
      const today = formatISODate(now);
      const weekStart = dayjs(selectedDate).startOf('week');
      const weekEnd = weekStart.add(6, 'day');
      return (
        today >= formatISODate(weekStart) && today <= formatISODate(weekEnd)
      );
    }
    return year === now.year() && month === now.month();
  }, [viewMode, year, month, selectedDate]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = dayjs();
    setYear(now.year());
    setMonth(now.month());
    setSelectedDate(formatISODate(now));
  };

  const handlePrevWeek = () => {
    const prev = dayjs(selectedDate).subtract(7, 'day');
    setSelectedDate(formatISODate(prev));
    setYear(prev.year());
    setMonth(prev.month());
  };

  const handleNextWeek = () => {
    const next = dayjs(selectedDate).add(7, 'day');
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
      const wasCompleted = completionStatus === 'completed';
      const newStatus = wasCompleted ? null : ('completed' as const);

      // 낙관적 업데이트
      updateCompletionStatus(schedule.id, occurrenceDate, newStatus);

      try {
        if (wasCompleted) {
          await uncompleteSchedule(schedule.id, occurrenceDate);
        } else {
          await completeSchedule(schedule.id, occurrenceDate, user.uid);
        }
        // 영향받는 쿼리만 invalidate (홈 화면 동기화)
        if (selectedPet?.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.schedules.weekInstances(selectedPet.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.activityFeed.byPet(selectedPet.id) });
        }
      } catch (err) {
        // 실패 시 롤백
        updateCompletionStatus(schedule.id, occurrenceDate, completionStatus ?? null);
        console.error('[CalendarScreen] toggle complete failed:', err);
        Alert.alert('오류', '완료 상태 변경에 실패했습니다.');
      }
    },
    [user, updateCompletionStatus, queryClient, selectedPet?.id]
  );

  const isOwner = canManageMembers(selectedPet);

  const handleShareSettings = useCallback(() => {
    if (!selectedPet) return;
    router.push({
      pathname: '/pet/sharing',
      params: { petId: selectedPet.id, petName: selectedPet.name },
    });
  }, [selectedPet, router]);

  const handleAddSchedule = () => {
    router.push({ pathname: '/add-schedule', params: { date: selectedDate } });
  };

  const handlePressSchedule = (s: {
    schedule: { id: string };
    occurrenceDate: string;
  }) => {
    router.push({
      pathname: '/schedule-detail',
      params: { id: s.schedule.id, occurrenceDate: s.occurrenceDate },
    });
  };

  // 반려동물 미등록
  if (!selectedPet) {
    return (
      <Screen edges={['top']}>
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
                    반려동물을 등록하면{'\n'}일정을 관리할 수 있어요
                  </Typography>
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  const canEdit = canEditSchedule(selectedPet);

  // 주간 뷰: WeekCalendar(고정) + DayTimeGrid(스크롤)
  if (viewMode === 'week') {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1">
          <AppHeader />

          {/* 뷰 모드 토글 */}
          <CalendarToolbar
            viewMode={viewMode}
            onChangeMode={setViewMode}
            monthLabel={toolbarMonthLabel}
            isCurrentPeriod={isCurrentPeriod}
            onGoToday={handleGoToday}
            colors={colors}
            isOwner={isOwner}
            onShareSettings={handleShareSettings}
            onCategoryManage={() => router.push('/category-manage')}
            petNotificationEnabled={petNotificationEnabled}
            onTogglePetNotification={handleTogglePetNotification}
          />

          <WeekCalendar
            selectedDate={selectedDate}
            schedules={schedules}
            onSelectDate={handleSelectDateInWeek}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
          />

          {/* 에러 배너 */}
          {scheduleError && (
            <Pressable
              onPress={refresh}
              className="mx-4 mt-2 p-3 rounded-xl flex-row items-center gap-2"
              style={{ backgroundColor: colors.error + '15' }}
            >
              <AlertCircle size={16} color={colors.error} />
              <Typography
                variant="body-sm"
                style={{ color: colors.error, flex: 1 }}
              >
                {scheduleError}
              </Typography>
              <Typography
                variant="body-sm"
                style={{ color: colors.error }}
                className="font-medium"
              >
                다시 시도
              </Typography>
            </Pressable>
          )}

          {isScheduleLoading ? (
            <DayScheduleSkeleton />
          ) : (
            <DayTimeGrid
              date={selectedDate}
              schedules={daySchedules}
              onPressSchedule={handlePressSchedule}
            />
          )}
        </View>

        {/* FAB - 편집 권한 있을 때만 */}
        {canEdit && <FAB onPress={handleAddSchedule} colors={colors} />}
      </Screen>
    );
  }

  // 월간 뷰: MonthCalendar(고정, 수직 스와이프) + DayScheduleList(스크롤)
  return (
    <Screen edges={['bottom']}>
      <View className="flex-1">
        <AppHeader />

        {/* 뷰 모드 토글 */}
        <CalendarToolbar
          viewMode={viewMode}
          onChangeMode={setViewMode}
          monthLabel={toolbarMonthLabel}
          isCurrentPeriod={isCurrentPeriod}
          onGoToday={handleGoToday}
          colors={colors}
          isOwner={isOwner}
          onShareSettings={handleShareSettings}
          onCategoryManage={() => router.push('/category-manage')}
          petNotificationEnabled={petNotificationEnabled}
          onTogglePetNotification={handleTogglePetNotification}
        />

        <MonthCalendar
          year={year}
          month={month}
          selectedDate={selectedDate}
          schedules={schedules}
          onSelectDate={setSelectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        {/* 에러 배너 */}
        {scheduleError && (
          <Pressable
            onPress={refresh}
            className="mx-4 mt-2 p-3 rounded-xl flex-row items-center gap-2"
            style={{ backgroundColor: colors.error + '15' }}
          >
            <AlertCircle size={16} color={colors.error} />
            <Typography
              variant="body-sm"
              style={{ color: colors.error, flex: 1 }}
            >
              {scheduleError}
            </Typography>
            <Typography
              variant="body-sm"
              style={{ color: colors.error }}
              className="font-medium"
            >
              다시 시도
            </Typography>
          </Pressable>
        )}

        {/* 구분선 */}
        <View className="border-b border-border" />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {isScheduleLoading ? (
            <DayScheduleSkeleton />
          ) : (
            <DayScheduleList
              date={selectedDate}
              schedules={daySchedules}
              onPressSchedule={handlePressSchedule}
              onPressAdd={handleAddSchedule}
              onToggleComplete={handleToggleComplete}
            />
          )}
        </ScrollView>
      </View>

      {/* FAB - 편집 권한 있을 때만 */}
      {canEdit && <FAB onPress={handleAddSchedule} colors={colors} />}
    </Screen>
  );
}

function CalendarToolbar({
  viewMode,
  onChangeMode,
  monthLabel,
  isCurrentPeriod,
  onGoToday,
  colors,
  isOwner,
  onShareSettings,
  onCategoryManage,
  petNotificationEnabled,
  onTogglePetNotification,
}: {
  viewMode: CalendarViewMode;
  onChangeMode: (mode: CalendarViewMode) => void;
  monthLabel: string;
  isCurrentPeriod: boolean;
  onGoToday: () => void;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
  isOwner: boolean;
  onShareSettings: () => void;
  onCategoryManage: () => void;
  petNotificationEnabled: boolean;
  onTogglePetNotification: () => void;
}) {
  return (
    <View className="flex-row justify-between items-center px-4 pb-2">
      <View className="flex-row items-center gap-2">
        <Typography variant="h3" className="font-semibold ">
          {monthLabel}
        </Typography>
        {!isCurrentPeriod && (
          <Pressable
            onPress={onGoToday}
            className="px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: colors.primary + '18' }}
            accessibilityLabel="오늘로 이동"
            accessibilityRole="button"
          >
            <Typography
              variant="body-sm"
              className="font-medium"
              style={{ color: colors.primary }}
            >
              오늘
            </Typography>
          </Pressable>
        )}
      </View>
      {/* 우측 tool */}
      <View className="flex-row items-center gap-2">
        {/* 공유 설정 (오너만) */}
        {isOwner && (
          <Pressable
            onPress={onShareSettings}
            className="w-9 h-9 items-center justify-center rounded-full bg-surface-elevated"
            accessibilityLabel="공유 설정"
            accessibilityRole="button"
          >
            <Share2 size={16} color={colors.mutedForeground} />
          </Pressable>
        )}

        {/* 캘린더 설정 팝오버 */}
        <Popover
          trigger={({ onPress }) => (
            <Pressable
              onPress={onPress}
              className="w-9 h-9 items-center justify-center rounded-full bg-surface-elevated"
              accessibilityLabel="캘린더 설정"
              accessibilityRole="button"
            >
              <Settings size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        >
          <PopoverItem
            label="카테고리 관리"
            icon={<Tag size={16} color={colors.mutedForeground} />}
            onPress={onCategoryManage}
          />
          <PopoverItem
            label={petNotificationEnabled ? '알림 끄기' : '알림 켜기'}
            icon={
              petNotificationEnabled ? (
                <Bell size={16} color={colors.primary} />
              ) : (
                <BellOff size={16} color={colors.mutedForeground} />
              )
            }
            onPress={onTogglePetNotification}
          />
        </Popover>

        {/* 뷰 모드 전환 */}
        <Pressable
          onPress={() => onChangeMode(viewMode === 'month' ? 'week' : 'month')}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface-elevated"
          accessibilityLabel={
            viewMode === 'month' ? '주간 보기로 전환' : '월간 보기로 전환'
          }
          accessibilityRole="button"
        >
          {viewMode === 'month' ? (
            <CalendarRange size={16} color={colors.mutedForeground} />
          ) : (
            <CalendarDays size={16} color={colors.mutedForeground} />
          )}
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
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
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
        shadowColor: '#000',
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
