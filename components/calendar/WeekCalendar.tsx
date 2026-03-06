import { Text } from '@/components/ui/Text';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { ScheduleInstance } from '@/types/schedule';
import { getWeekGrid } from '@/utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface WeekCalendarProps {
  selectedDate: string;
  schedules: ScheduleInstance[];
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToday: () => void;
}

export function WeekCalendar({
  selectedDate,
  schedules,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onGoToday,
}: WeekCalendarProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const grid = useMemo(() => getWeekGrid(selectedDate), [selectedDate]);
  const today = dayjs().format('YYYY-MM-DD');
  const isCurrentWeek = grid.some(d => d.format('YYYY-MM-DD') === today);

  // 월 레이블: 주가 걸쳐있으면 두 달 표시
  const weekStart = grid[0];
  const weekEnd = grid[6];
  const monthLabel =
    weekStart.month() === weekEnd.month()
      ? weekStart.locale('ko').format('M월')
      : `${weekStart.locale('ko').format('M월')} - ${weekEnd.locale('ko').format('M월')}`;

  // 날짜별 스케줄 존재 여부
  const datesWithSchedules = useMemo(() => {
    const set = new Set<string>();
    for (const s of schedules) {
      set.add(s.occurrenceDate);
    }
    return set;
  }, [schedules]);

  return (
    <View>
      {/* 월 헤더 + 네비게이션 */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
        <Pressable
          onPress={onPrevWeek}
          className="flex-row items-center gap-1"
        >
          <FontAwesome
            name="chevron-left"
            size={13}
            color={colors.primary}
          />
          <Typography
            variant="body-lg"
            className="font-semibold"
            style={{ color: colors.primary }}
          >
            {monthLabel}
          </Typography>
        </Pressable>

        <View className="flex-row items-center gap-3">
          {!isCurrentWeek && (
            <Pressable
              onPress={onGoToday}
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: colors.surface }}
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
          <Pressable
            onPress={onNextWeek}
            className="w-9 h-9 items-center justify-center"
          >
            <FontAwesome
              name="chevron-right"
              size={13}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>

      {/* 요일 헤더 */}
      <View className="flex-row px-2">
        {WEEKDAYS.map((day, i) => (
          <View
            key={day}
            style={{ width: '14.28%' }}
            className="items-center"
          >
            <Text
              className="text-xs"
              style={{
                color:
                  i === 0
                    ? colors.error
                    : i === 6
                      ? colors.primary
                      : colors.mutedForeground,
              }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 날짜 행 */}
      <View className="flex-row px-2 pt-1 pb-2">
        {grid.map((day, i) => {
          const dateStr = day.format('YYYY-MM-DD');
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const dayOfWeek = day.day();
          const hasSchedule = datesWithSchedules.has(dateStr);

          return (
            <Pressable
              key={dateStr}
              onPress={() => onSelectDate(dateStr)}
              style={{ width: '14.28%' }}
              className="items-center"
            >
              <View
                className="items-center justify-center rounded-full"
                style={[
                  { width: 36, height: 36 },
                  isSelected && { backgroundColor: colors.primary },
                  isToday &&
                    !isSelected && {
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                    },
                ]}
              >
                <Text
                  className="text-lg font-medium"
                  style={{
                    color: isSelected
                      ? colors.primaryForeground
                      : dayOfWeek === 0
                        ? colors.error
                        : dayOfWeek === 6
                          ? colors.primary
                          : colors.foreground,
                  }}
                >
                  {day.date()}
                </Text>
              </View>

              {/* 스케줄 존재 indicator */}
              {hasSchedule && !isSelected && (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: colors.primary,
                    marginTop: 2,
                  }}
                />
              )}
              {(!hasSchedule || isSelected) && (
                <View style={{ width: 5, height: 5, marginTop: 2 }} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* 구분선 */}
      <View className="border-b border-border" />
    </View>
  );
}
