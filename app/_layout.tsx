import '../global.css';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  type Theme,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { PetProvider } from '@/contexts/PetContext';
import { useAuth } from '@/hooks/useAuth';
import { View } from 'react-native';

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
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <PetProvider>
        <CategoryProvider>
          <RootLayoutNav />
        </CategoryProvider>
      </PetProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightTheme}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerTitleStyle: { fontFamily: 'Pretendard-SemiBold' } }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="add-pet"
            options={{
              title: '새 반려동물 등록',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="edit-pet"
            options={{
              title: '반려동물 수정',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="add-schedule"
            options={{
              title: '일정 추가',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="schedule-detail"
            options={{
              title: '일정 상세',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="edit-schedule"
            options={{
              title: '일정 수정',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="category-manage"
            options={{
              title: '카테고리 관리',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="settings/profile"
            options={{
              title: '프로필 수정',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="settings/change-password"
            options={{
              title: '비밀번호 변경',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
        </Stack>
      </View>
    </ThemeProvider>
  );
}
