import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#ffffff" },
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
    </Stack>
  );
}
