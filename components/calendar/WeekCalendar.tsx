import { Text } from '@/components/ui/Text';
import dayjs, { formatISODate } from '@/utils/dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

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
}

export function WeekCalendar({
  selectedDate,
  schedules,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: WeekCalendarProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const grid = useMemo(() => getWeekGrid(selectedDate), [selectedDate]);
  const today = formatISODate(dayjs());

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
      {/* 요일 헤더 */}
      <View
        className="flex-row px-2 mt-3"
        style={{ paddingLeft: 30, paddingRight: 30 }}
      >
        {WEEKDAYS.map((day, i) => (
          <View key={day} style={{ width: '14.28%' }} className="items-center">
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

      {/* 날짜 행 + 좌우 화살표 */}
      <View className="flex-row items-center pt-1 pb-2">
        <Pressable
          onPress={onPrevWeek}
          className="w-9 h-9 items-center justify-center"
          accessibilityLabel="이전 주"
          accessibilityRole="button"
        >
          <ChevronLeft size={14} color={colors.primary} />
        </Pressable>

        <View className="flex-1 flex-row">
          {grid.map((day, i) => {
            const dateStr = formatISODate(day);
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
                    { width: 30, height: 30 },
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

        <Pressable
          onPress={onNextWeek}
          className="w-9 h-9 items-center justify-center"
          accessibilityLabel="다음 주"
          accessibilityRole="button"
        >
          <ChevronRight size={14} color={colors.primary} />
        </Pressable>
      </View>

      {/* 구분선 */}
      <View className="border-b border-border" />
    </View>
  );
}
