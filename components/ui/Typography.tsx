import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text } from './Text';

type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body-xl'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'caption'
  | 'small';

interface TypographyProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const variantStyles: Record<Variant, string> = {
  h1: 'text-4xl font-bold',       // 36px
  h2: 'text-3xl font-bold',       // 30px
  h3: 'text-2xl font-semibold',   // 24px
  'body-xl': 'text-xl',           // 20px
  'body-lg': 'text-lg',           // 18px
  'body-md': 'text-base',         // 16px
  'body-sm': 'text-sm',           // 14px
  caption: 'text-[13px]',         // 13px
  small: 'text-xs',               // 12px
};

export function Typography({
  children,
  variant = 'body-md',
  className = '',
  style,
  numberOfLines,
}: TypographyProps) {
  return (
    <Text
      className={`text-foreground ${variantStyles[variant]} ${className}`}
      style={style}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
