import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  UIManager,
  View,
} from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import {
  CATEGORY_CARD_COLORS,
  CATEGORY_TEXT_COLORS,
} from '@/constants/Schedule';
import type { Schedule } from '@/types/schedule';

import { ScheduleItem } from './ScheduleItem';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const CARD_HEIGHT = 56;
const COLLAPSED_VISIBLE = 28;
const EXPANDED_GAP = 12;

interface StackedScheduleListProps {
  schedules: Schedule[];
  onPressSchedule: (schedule: Schedule) => void;
}

export function StackedScheduleList({
  schedules,
  onPressSchedule,
}: StackedScheduleListProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expanded, setExpanded] = useState(false);

  const animValues = useRef<Animated.Value[]>([]);

  // Sync animated values with schedule count
  if (animValues.current.length !== schedules.length) {
    animValues.current = schedules.map(
      (_, i) => animValues.current[i] ?? new Animated.Value(0)
    );
  }

  // Reset to collapsed when schedules change
  useEffect(() => {
    setExpanded(false);
    animValues.current.forEach(a => a.setValue(0));
  }, [schedules.length]);

  const toggleExpand = useCallback(() => {
    const toValue = expanded ? 0 : 1;

    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );

    const animations = animValues.current.map(anim =>
      Animated.spring(anim, {
        toValue,
        damping: 18,
        stiffness: 200,
        mass: 0.8,
        useNativeDriver: true,
      })
    );

    Animated.stagger(40, animations).start();
    setExpanded(!expanded);
  }, [expanded]);

  // Single schedule: no stacking needed
  if (schedules.length === 1) {
    const schedule = schedules[0];
    const cardColor =
      CATEGORY_CARD_COLORS[schedule.category][isDark ? 'dark' : 'light'];
    const textColor =
      CATEGORY_TEXT_COLORS[schedule.category][isDark ? 'dark' : 'light'];

    return (
      <ScheduleItem
        schedule={schedule}
        variant="stacked"
        cardColor={cardColor}
        textColor={textColor}
        onPress={() => onPressSchedule(schedule)}
      />
    );
  }

  const collapsedHeight =
    CARD_HEIGHT + (schedules.length - 1) * COLLAPSED_VISIBLE;
  const expandedHeight =
    schedules.length * CARD_HEIGHT + (schedules.length - 1) * EXPANDED_GAP;

  return (
    <View>
      <View
        style={{
          height: expanded ? expandedHeight : collapsedHeight,
        }}
      >
        {schedules.map((schedule, index) => {
          const cardColor =
            CATEGORY_CARD_COLORS[schedule.category][isDark ? 'dark' : 'light'];
          const textColor =
            CATEGORY_TEXT_COLORS[schedule.category][isDark ? 'dark' : 'light'];

          const collapsedOffset = index * COLLAPSED_VISIBLE;
          const expandedOffset = index * (CARD_HEIGHT + EXPANDED_GAP);

          const translateY =
            animValues.current[index]?.interpolate({
              inputRange: [0, 1],
              outputRange: [0, expandedOffset - collapsedOffset],
            }) ?? 0;

          return (
            <Animated.View
              key={schedule.id}
              style={{
                position: 'absolute',
                top: collapsedOffset,
                left: 0,
                right: 0,
                zIndex: schedules.length - index,
                transform: [{ translateY }],
              }}
            >
              <ScheduleItem
                schedule={schedule}
                variant="stacked"
                cardColor={cardColor}
                textColor={textColor}
                onPress={() => {
                  if (!expanded) {
                    toggleExpand();
                  } else {
                    onPressSchedule(schedule);
                  }
                }}
              />
            </Animated.View>
          );
        })}
      </View>

      {expanded && schedules.length > 1 && (
        <Pressable onPress={toggleExpand} className="items-center py-2">
          <Typography variant="small" className="text-muted-foreground">
            접기
          </Typography>
        </Pressable>
      )}

      {!expanded && schedules.length > 1 && (
        <Pressable onPress={toggleExpand} className="items-center pt-2">
          <Typography variant="small" className="text-muted-foreground">
            {schedules.length}개 일정 보기
          </Typography>
        </Pressable>
      )}
    </View>
  );
}
