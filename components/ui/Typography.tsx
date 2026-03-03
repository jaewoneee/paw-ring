import { Text } from "react-native";
import type { ReactNode } from "react";

type Variant = "h1" | "h2" | "h3" | "body-lg" | "body-md" | "body-sm" | "small";

interface TypographyProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  h1: "text-3xl font-bold",
  h2: "text-2xl font-bold",
  h3: "text-xl font-semibold",
  "body-lg": "text-lg",
  "body-md": "text-base",
  "body-sm": "text-sm",
  small: "text-xs",
};

export function Typography({
  children,
  variant = "body-md",
  className = "",
}: TypographyProps) {
  return (
    <Text className={`text-foreground ${variantStyles[variant]} ${className}`}>
      {children}
    </Text>
  );
}
