import { Text } from "react-native";
import type { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  variant?: "h1" | "h2";
  className?: string;
}

export function Typography({ children, variant, className = "" }: TypographyProps) {
  const variantStyles = {
    h1: "text-3xl font-bold",
    h2: "text-xl font-bold",
  };

  const baseStyle = variant ? variantStyles[variant] : "text-base";

  return <Text className={`${baseStyle} ${className}`}>{children}</Text>;
}
