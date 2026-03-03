import type { ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { themeVars } from '@/constants/Colors';

interface ScreenProps {
  children: ReactNode;
  edges?: Edge[];
  className?: string;
}

export function Screen({
  children,
  edges = ['bottom'],
  className = '',
}: ScreenProps) {
  const { colorScheme } = useColorScheme();
  const currentVars = themeVars[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaView
      style={currentVars}
      className={`flex-1 bg-background ${className}`}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}
