import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function TabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const bottomOffset = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blur}
      >
        <View
          style={[
            styles.container,
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
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const color = isFocused ? theme.primary : theme.mutedForeground;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tab}
              >
                {options.tabBarIcon?.({
                  focused: isFocused,
                  color,
                  size: 22,
                })}
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  blur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 28,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
