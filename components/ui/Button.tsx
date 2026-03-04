import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { Text } from './Text';

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'heading' | 'body' | 'small';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'body',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyle = 'rounded-xl py-3 px-5 flex-row items-center justify-center';

  const variantStyles = {
    default: isDisabled ? 'bg-primary-300' : 'bg-primary',
    outline: isDisabled
      ? 'border border-border bg-background'
      : 'border border-border-strong bg-background',
    ghost: 'bg-transparent',
  };

  const textStyles = {
    default: 'text-primary-foreground',
    outline: isDisabled ? 'text-muted-foreground' : 'text-foreground',
    ghost: isDisabled ? 'text-muted-foreground' : 'text-muted-foreground',
  };

  const sizeStyles = {
    heading: 'text-2xl',
    body: 'text-xl',
    small: 'text-sm',
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
          color="#fff"
        />
      ) : (
        <Text
          className={`${sizeStyles[size]} font-semibold ${textStyles[variant]}`}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
