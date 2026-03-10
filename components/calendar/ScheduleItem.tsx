import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCategoryContext } from '@/contexts/CategoryContext';
import type { CompletionStatus, Schedule } from '@/types/schedule';
import { formatISODate, formatTime12 } from '@/utils/dayjs';

interface ScheduleItemProps {
  schedule: Schedule;
  occurrenceDate?: string; // "YYYY-MM-DD" — 반복 스케줄의 실제 표시 날짜
  onPress: (schedule: Schedule) => void;
  onComplete?: (schedule: Schedule) => void;
  onToggleComplete?: () => void;
  completionStatus?: CompletionStatus | null;
  variant?: 'default' | 'stacked';
  cardColor?: string;
  textColor?: string;
}

export function ScheduleItem({
  schedule,
  occurrenceDate,
  onPress,
  onComplete,
  onToggleComplete,
  completionStatus,
  variant = 'default',
  cardColor,
  textColor,
}: ScheduleItemProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { getCategoryMeta } = useCategoryContext();
  const meta = getCategoryMeta(schedule.category);
  const isStacked = variant === 'stacked';
  const isCompleted = completionStatus === 'completed';

  // slide-out 애니메이션 (stacked variant 전용)
  const slideAnim = useRef(isStacked ? new Animated.Value(0) : null).current;
  const isAnimating = useRef(false);

  const handleComplete = useCallback(() => {
    if (!onComplete || isAnimating.current || !slideAnim) return;
    isAnimating.current = true;

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onComplete(schedule);
    });
  }, [onComplete, schedule, slideAnim]);

  const animStyle = slideAnim
    ? {
        transform: [
          {
            translateX: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -400],
            }),
          },
        ],
        opacity: slideAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0.5, 0],
        }),
      }
    : undefined;

  return (
    <Animated.View style={animStyle}>
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
              backgroundColor: isCompleted
                ? colors.mutedForeground
                : meta.color,
              opacity: isCompleted ? 0.4 : 1,
            }}
          />
        )}

        <View className="flex-1 flex-row items-center gap-3 px-3 py-3">
          {/* 체크박스 (default variant + completable) */}
          {!isStacked && schedule.is_completable && onToggleComplete ? (
            <Pressable
              onPress={e => {
                e.stopPropagation?.();
                onToggleComplete();
              }}
              hitSlop={8}
              className="w-8 h-8 rounded-md items-center justify-center border-2"
              style={{
                borderColor: isCompleted ? meta.color : colors.mutedForeground,
                backgroundColor: isCompleted ? meta.color : 'transparent',
              }}
              accessibilityLabel={isCompleted ? `${schedule.title} 완료 취소` : `${schedule.title} 완료`}
              accessibilityRole="checkbox"
            >
              {isCompleted && (
                <FontAwesome name="check" size={12} color="#fff" />
              )}
            </Pressable>
          ) : (
            /* 카테고리 아이콘 */
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{
                backgroundColor: isStacked
                  ? 'rgba(255,255,255,0.25)'
                  : meta.color + '20',
                opacity: isCompleted ? 0.4 : 1,
              }}
            >
              <FontAwesome
                name={meta.icon as any}
                size={14}
                color={isStacked ? (textColor ?? meta.color) : meta.color}
              />
            </View>
          )}

          {/* 내용 */}
          <View className="flex-1" style={{ opacity: isCompleted ? 0.45 : 1 }}>
            {!schedule.is_all_day && (
              <Typography style={isStacked ? { color: textColor } : undefined}>
                {`${occurrenceDate ?? formatISODate(schedule.start_date)} ${formatTime12(schedule.start_date)}`}
              </Typography>
            )}
            <Typography
              variant="body-xl"
              className="font-semibold"
              style={[
                isStacked ? { color: textColor } : undefined,
                isCompleted && { textDecorationLine: 'line-through' },
              ]}
              numberOfLines={isStacked ? 1 : undefined}
            >
              {schedule.title}
            </Typography>
          </View>

          {isStacked && schedule.is_completable && onComplete ? (
            <Pressable
              onPress={e => {
                e.stopPropagation?.();
                handleComplete();
              }}
              hitSlop={8}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              accessibilityLabel={`${schedule.title} 완료`}
              accessibilityRole="button"
            >
              <FontAwesome
                name="check"
                size={14}
                color={textColor ?? colors.mutedForeground}
              />
            </Pressable>
          ) : !isStacked ? (
            <FontAwesome
              name="chevron-right"
              size={12}
              color={colors.mutedForeground}
            />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
