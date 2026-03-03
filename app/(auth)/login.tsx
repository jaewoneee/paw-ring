import { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/hooks/useAuth";
import {
  validateEmail,
  validatePassword,
  getFirebaseErrorMessage,
} from "@/utils/validation";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setError(emailResult.error!);
      return;
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      setError(passwordResult.error!);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const code = err?.code ?? "";
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
      <View className="px-6 gap-6">
        <View className="items-center mb-8">
          <Typography variant="h1">
            PAW RING
          </Typography>
        </View>

        {error ? (
          <View className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <Typography variant="body-sm" className="text-error text-center">
              {error}
            </Typography>
          </View>
        ) : null}

        <View className="gap-4">
          <Input
            label="이메일"
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Button onPress={handleLogin} loading={loading} disabled={loading}>
          로그인
        </Button>

        <View className="flex-row justify-center gap-4">
          <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
            <Typography variant="body-sm" className="text-muted-foreground">
              비밀번호 찾기
            </Typography>
          </Pressable>
          <Typography className="text-muted-foreground">|</Typography>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Typography variant="body-sm" className="text-primary font-medium">
              회원가입
            </Typography>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-px bg-border" />
          <Typography variant="body-sm" className="text-muted-foreground">또는</Typography>
          <View className="flex-1 h-px bg-border" />
        </View>

        <Button variant="outline" disabled>
          구글로 시작하기 (준비중)
        </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
