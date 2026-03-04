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
  | 'small';

interface TypographyProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const variantStyles: Record<Variant, string> = {
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-bold',
  h3: 'text-2xl font-semibold',
  'body-xl': 'text-2xl',
  'body-lg': 'text-xl',
  'body-md': 'text-base',
  'body-sm': 'text-sm',
  small: 'text-xs',
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
