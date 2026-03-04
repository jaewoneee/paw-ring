import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from './Text';

import { useColorScheme } from '@/components/useColorScheme';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blur}
      >
        <View
          className={`rounded-2xl overflow-hidden ${className}`}
          style={[
            styles.inner,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.1)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.3)',
            },
          ]}
        >
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  blur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  inner: {
    borderWidth: 1,
    borderRadius: 16,
  },
});

export function CardHeader({ children }: { children: ReactNode }) {
  return <View className="px-4 pt-4 pb-1">{children}</View>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="text-base font-semibold text-foreground">{children}</Text>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return <View className={`px-4 py-3 ${className}`}>{children}</View>;
}
