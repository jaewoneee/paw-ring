import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { DayScheduleList } from '@/components/calendar/DayScheduleList';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { Card, CardContent } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePets } from '@/contexts/PetContext';
import { useMonthSchedules } from '@/hooks/useSchedules';

export default function CalendarScreen() {
  const router = useRouter();
  const { selectedPet } = usePets();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month());
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format('YYYY-MM-DD')
  );

  const { schedules, refresh } = useMonthSchedules(
    selectedPet?.id,
    year,
    month
  );

  // 화면 복귀 시 데이터 refresh
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // 선택 날짜의 스케줄 (월간 데이터에서 필터링)
  const daySchedules = useMemo(
    () => schedules.filter(s => s.occurrenceDate === selectedDate),
    [schedules, selectedDate]
  );

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
    setSelectedDate(now.format('YYYY-MM-DD'));
  };

  const handleAddSchedule = () => {
    router.push({ pathname: '/add-schedule', params: { date: selectedDate } });
  };

  // 반려동물 미등록
  if (!selectedPet) {
    return (
      <Screen>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="p-4 gap-4">
            <Typography variant="h2">캘린더</Typography>
            <Card>
              <CardContent>
                <View className="items-center py-8 gap-3">
                  <FontAwesome
                    name="calendar"
                    size={32}
                    color={colors.mutedForeground}
                  />
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

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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

        {/* 구분선 */}
        <View className="mx-4 border-b border-border" />

        <DayScheduleList
          date={selectedDate}
          schedules={daySchedules}
          onPressSchedule={s =>
            router.push({
              pathname: '/schedule-detail',
              params: { id: s.schedule.id },
            })
          }
          onPressAdd={handleAddSchedule}
        />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={handleAddSchedule}
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
        <FontAwesome name="plus" size={20} color={colors.primaryForeground} />
      </Pressable>
    </Screen>
  );
}
