import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/hooks/useAuth";
import { validateEmail, getFirebaseErrorMessage } from "@/utils/validation";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async () => {
    setError("");

    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setError(emailResult.error!);
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert(
        "이메일 전송 완료",
        "비밀번호 재설정 링크를 이메일로 보냈습니다. 이메일을 확인해주세요.",
        [{ text: "확인", onPress: () => router.back() }]
      );
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found") {
        setError("가입되지 않은 이메일입니다");
      } else {
        setError(getFirebaseErrorMessage(code));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
      <Typography className="text-muted-foreground">
        가입한 이메일을 입력하면 재설정 링크를 보내드려요.
      </Typography>

      {error ? (
        <View className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <Typography variant="body-sm" className="text-error text-center">
            {error}
          </Typography>
        </View>
      ) : null}

      <Input
        label="이메일"
        placeholder="example@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Button
        onPress={handleResetPassword}
        loading={loading}
        disabled={loading}
      >
        재설정 링크 전송
        </Button>
      </ScrollView>
    </Screen>
  );
}
