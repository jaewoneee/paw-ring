import { View, Text } from "react-native";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <View className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      {children}
    </View>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <View className="px-4 pt-4 pb-1">{children}</View>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <Text className="text-base font-semibold">{children}</Text>;
}

export function CardContent({ children, className = "" }: CardProps) {
  return <View className={`px-4 py-3 ${className}`}>{children}</View>;
}
