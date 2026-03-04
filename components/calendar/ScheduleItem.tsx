import { Text } from '@/components/ui/Text';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORY_META } from '@/constants/Schedule';
import type { Schedule } from '@/types/schedule';
import { formatTime } from '@/utils/date';
import dayjs from 'dayjs';

interface ScheduleItemProps {
  schedule: Schedule;
  onPress: (schedule: Schedule) => void;
  variant?: 'default' | 'stacked';
  cardColor?: string;
  textColor?: string;
}

export function ScheduleItem({
  schedule,
  onPress,
  variant = 'default',
  cardColor,
  textColor,
}: ScheduleItemProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const meta = CATEGORY_META[schedule.category];
  const isStacked = variant === 'stacked';
  console.log({ schedule });

  return (
    <Pressable
      onPress={() => onPress(schedule)}
      className="flex-row items-center rounded-xl overflow-hidden"
      style={[
        { backgroundColor: isStacked ? cardColor : colors.surfaceElevated },
        isStacked && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
      ]}
    >
      {/* 카테고리 색상 바 (default variant만) */}
      {!isStacked && (
        <View
          style={{
            width: 4,
            alignSelf: 'stretch',
            backgroundColor: meta.color,
          }}
        />
      )}

      <View className="flex-1 flex-row items-center gap-3 px-3 py-3">
        {/* 카테고리 아이콘 */}
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{
            backgroundColor: isStacked
              ? 'rgba(255,255,255,0.25)'
              : meta.color + '20',
          }}
        >
          <FontAwesome
            name={meta.icon as any}
            size={14}
            color={isStacked ? (textColor ?? meta.color) : meta.color}
          />
        </View>

        {/* 내용 */}
        <View className="flex-1">
          <Typography style={isStacked ? { color: textColor } : undefined}>
            {dayjs(schedule.start_date).format(
              schedule.is_all_day ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH시 mm분'
            )}
          </Typography>
          <Typography
            variant="body-xl"
            className="font-medium"
            style={isStacked ? { color: textColor } : undefined}
            numberOfLines={isStacked ? 1 : undefined}
          >
            {schedule.title}
          </Typography>
          <Text
            className="text-xs"
            style={{
              color: isStacked
                ? (textColor ?? colors.mutedForeground)
                : colors.mutedForeground,
            }}
            numberOfLines={isStacked ? 1 : undefined}
          >
            {schedule.is_all_day ? '종일' : formatTime(schedule.start_date)}
            {schedule.memo ? ` · ${schedule.memo}` : ''}
          </Text>
        </View>

        {isStacked ? (
          <FontAwesome
            name="check-circle"
            size={16}
            color={textColor ?? colors.mutedForeground}
          />
        ) : (
          <FontAwesome
            name="chevron-right"
            size={12}
            color={colors.mutedForeground}
          />
        )}
      </View>
    </Pressable>
  );
}
