import { Stack } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function AuthLayout() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surfaceElevated },
        headerTintColor: colors.foreground,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen
        name="register"
        options={{
          headerShown: true,
          headerTitle: "회원가입",
          headerBackTitle: "뒤로",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          headerTitle: "비밀번호 찾기",
          headerBackTitle: "뒤로",
        }}
      />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
