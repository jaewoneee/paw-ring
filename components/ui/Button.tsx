import { Pressable, ActivityIndicator, Text } from "react-native";
import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: "default" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onPress,
  variant = "default",
  loading = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyle = "rounded-xl py-3 px-5 flex-row items-center justify-center";

  const variantStyles = {
    default: isDisabled
      ? "bg-gray-300"
      : "bg-black",
    outline: isDisabled
      ? "border border-gray-200 bg-white"
      : "border border-gray-300 bg-white",
    ghost: "bg-transparent",
  };

  const textStyles = {
    default: isDisabled ? "text-white" : "text-white",
    outline: isDisabled ? "text-gray-400" : "text-gray-900",
    ghost: isDisabled ? "text-gray-400" : "text-gray-600",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "default" ? "#fff" : "#6b7280"}
        />
      ) : (
        <Text className={`text-base font-semibold ${textStyles[variant]}`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
