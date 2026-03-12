import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle, View } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Home screen: upcoming schedule list skeleton */
export function HomeScheduleSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          className="rounded-2xl bg-surface-elevated p-4"
          style={{ gap: 10 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Calendar screen: day schedule list skeleton */
export function DayScheduleSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
      {[1, 2].map(i => (
        <View
          key={i}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <Skeleton width={6} height={40} borderRadius={3} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="50%" height={14} />
            <Skeleton width="30%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Schedule detail screen skeleton */
export function ScheduleDetailSkeleton() {
  return (
    <View style={{ padding: 16, gap: 16 }}>
      <View className="rounded-2xl bg-surface-elevated p-4" style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="60%" height={18} />
            <Skeleton width="30%" height={12} />
          </View>
        </View>
        <Skeleton width="100%" height={1} borderRadius={0} />
        {[1, 2, 3].map(i => (
          <View
            key={i}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Skeleton width={20} height={16} borderRadius={4} />
            <Skeleton width={40} height={14} borderRadius={4} />
            <Skeleton width="40%" height={14} />
          </View>
        ))}
      </View>
      <Skeleton width="100%" height={44} borderRadius={12} />
      <View style={{ gap: 12 }}>
        <Skeleton width="100%" height={44} borderRadius={12} />
        <Skeleton width="100%" height={44} borderRadius={12} />
      </View>
    </View>
  );
}

/** Edit schedule form skeleton */
export function EditScheduleSkeleton() {
  return (
    <View style={{ padding: 16, gap: 20 }}>
      <View style={{ gap: 6 }}>
        <Skeleton width={40} height={14} />
        <Skeleton width="100%" height={44} borderRadius={12} />
      </View>
      <View style={{ gap: 6 }}>
        <Skeleton width={60} height={14} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} width={70} height={32} borderRadius={16} />
          ))}
        </View>
      </View>
      <Skeleton width="100%" height={1} borderRadius={0} />
      <View style={{ gap: 6 }}>
        <Skeleton width={60} height={14} />
        <Skeleton width="100%" height={44} borderRadius={12} />
      </View>
      <View style={{ gap: 6 }}>
        <Skeleton width={60} height={14} />
        <Skeleton width="100%" height={44} borderRadius={12} />
      </View>
    </View>
  );
}
