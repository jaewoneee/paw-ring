import { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { Input } from "@/components/ui/Input";
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
      <View className="px-6 gap-6">
        <View className="items-center mb-8">
          <Typography variant="h1" className="text-3xl font-bold">
            PAW RING
          </Typography>
        </View>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3">
            <Typography className="text-red-600 text-sm text-center">
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
            <Typography className="text-gray-500 text-sm">
              비밀번호 찾기
            </Typography>
          </Pressable>
          <Typography className="text-gray-300">|</Typography>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Typography className="text-blue-500 text-sm font-medium">
              회원가입
            </Typography>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-px bg-gray-200" />
          <Typography className="text-gray-400 text-sm">또는</Typography>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        <Button variant="outline" disabled>
          구글로 시작하기 (준비중)
        </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
