import '../global.css';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  type Theme,
} from '@react-navigation/native';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { PetProvider } from '@/contexts/PetContext';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import { HeaderBackButton } from '@/components/HeaderBackButton';

// React Navigation focus 연동: 앱이 포그라운드로 돌아올 때 stale 쿼리 자동 refetch
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30초간 fresh
      gcTime: 5 * 60 * 1000,      // 5분간 캐시 유지
      retry: 1,
      refetchOnWindowFocus: true,  // focusManager 연동
    },
  },
});

const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.surfaceElevated,
    text: Colors.light.foreground,
    border: Colors.light.border,
    notification: Colors.light.error,
  },
};

const DarkNavTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.surfaceElevated,
    text: Colors.dark.foreground,
    border: Colors.dark.border,
    notification: Colors.dark.error,
  },
};

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Pretendard: require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PetProvider>
          <CategoryProvider>
            <RootLayoutNav />
          </CategoryProvider>
        </PetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 알림 권한 요청 + 토큰 등록 (로그인 상태에서만 동작)
  useNotification();

  // AppState 변경 시 focusManager에 알림 → stale 쿼리 자동 refetch
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      appState.current = status;
      onAppStateChange(status);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(tabs)');
    } else if (user && !user.emailVerified && segments[1] !== 'verify-email') {
      router.replace('/(auth)/verify-email');
    } else if (user && user.emailVerified && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightTheme}>
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerTitleStyle: { fontFamily: 'Pretendard-SemiBold' },
              headerBackVisible: false,
              headerLeft: () => <HeaderBackButton />,
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-pet" options={{ title: '새 반려동물 등록' }} />
            <Stack.Screen name="edit-pet" options={{ title: '반려동물 수정' }} />
            <Stack.Screen name="add-schedule" options={{ title: '일정 추가' }} />
            <Stack.Screen name="schedule-detail" options={{ title: '일정 상세' }} />
            <Stack.Screen name="edit-schedule" options={{ title: '일정 수정' }} />
            <Stack.Screen name="category-manage" options={{ title: '카테고리 관리' }} />
            <Stack.Screen name="settings/profile" options={{ title: '프로필 수정' }} />
            <Stack.Screen name="settings/change-password" options={{ title: '비밀번호 변경' }} />
            <Stack.Screen name="pet/sharing" options={{ title: '캘린더 공유' }} />
            <Stack.Screen name="activity-feed" options={{ title: '활동 기록' }} />
            <Stack.Screen name="invite/[inviteId]" options={{ title: '초대' }} />
          </Stack>
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
