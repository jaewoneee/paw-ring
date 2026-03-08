import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 18;
const TRACK_PADDING = (TRACK_HEIGHT - THUMB_SIZE) / 2;

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Switch({ value, onValueChange, disabled }: SwitchProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const translateX = useRef(
    new Animated.Value(
      value ? TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2 : 0,
    ),
  ).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2 : 0,
      useNativeDriver: true,
      bounciness: 2,
      speed: 20,
    }).start();
  }, [value, translateX]);

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={[
        styles.track,
        {
          backgroundColor: value ? colors.primary : colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: "#FFFFFF",
            transform: [{ translateX }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: TRACK_PADDING,
    justifyContent: "center",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
