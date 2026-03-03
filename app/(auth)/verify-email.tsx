import { useState, useEffect, useRef } from "react";
import { View, ScrollView, Alert, AppState } from "react-native";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/hooks/useAuth";
import { resendVerificationEmail } from "@/services/auth";
import { auth } from "@/lib/firebase";

export default function VerifyEmailScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const appState = useRef(AppState.currentState);

  // 앱이 포그라운드로 돌아올 때 인증 상태 확인
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (next) => {
      if (appState.current.match(/background/) && next === "active") {
        await refreshUser();
      }
      appState.current = next;
    });

    return () => subscription.remove();
  }, []);

  // 재발송 쿨다운 타이머
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      setCooldown(60);
      Alert.alert("발송 완료", "인증 이메일을 다시 보냈습니다.");
    } catch {
      Alert.alert("오류", "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    await refreshUser();
    // refreshUser가 user 상태를 갱신하면 라우팅 가드가 자동으로 메인 화면으로 이동
    // emailVerified가 아직 false면 안내 메시지 표시
    if (!auth.currentUser?.emailVerified) {
      Alert.alert("미인증", "아직 이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.");
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
      <View className="px-6 gap-6 items-center">
        <Typography variant="h3" className="text-center">
          이메일 인증이 필요합니다
        </Typography>

        <Typography className="text-muted-foreground text-center">
          {user?.email}으로 인증 링크를 보냈습니다.{"\n"}
          이메일의 링크를 클릭한 후 아래 버튼을 눌러주세요.
        </Typography>

        <View className="w-full gap-3">
          <Button onPress={() => { handleCheckVerification(); }}>
            인증 완료 확인
          </Button>

          <Button
            variant="outline"
            onPress={() => { handleResend(); }}
            disabled={resending || cooldown > 0}
          >
            {cooldown > 0
              ? `인증 이메일 재발송 (${cooldown}초)`
              : "인증 이메일 재발송"}
          </Button>

          <Button variant="ghost" onPress={logout}>
            다른 계정으로 로그인
          </Button>
        </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
