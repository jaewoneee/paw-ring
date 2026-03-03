import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { changePassword } from "@/services/account";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import { Screen } from "@/components/ui/Screen";
import {
  validatePassword,
  validatePasswordConfirm,
  getFirebaseErrorMessage,
} from "@/utils/validation";

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = "현재 비밀번호를 입력해주세요";
    }

    const pwResult = validatePassword(newPassword);
    if (!pwResult.isValid) {
      errors.newPassword = pwResult.error!;
    }

    const confirmResult = validatePasswordConfirm(
      newPassword,
      newPasswordConfirm
    );
    if (!confirmResult.isValid) {
      errors.newPasswordConfirm = confirmResult.error!;
    }

    if (currentPassword && currentPassword === newPassword) {
      errors.newPassword = "현재 비밀번호와 다른 비밀번호를 입력해주세요";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert("완료", "비밀번호가 변경되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const code = err?.code ?? "";
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <Screen edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-4 gap-5">
          <Typography className="text-muted-foreground" variant="body-md">
            새 비밀번호를 설정하세요.
          </Typography>

          {/* 에러 메시지 */}
          {error ? (
            <View className="bg-red-50 dark:bg-red-950 border border-error rounded-xl px-4 py-3">
              <Typography className="text-error text-center" variant="body-sm">
                {error}
              </Typography>
            </View>
          ) : null}

          <Input
            label="현재 비밀번호"
            placeholder="현재 비밀번호를 입력하세요"
            secureTextEntry
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              clearFieldError("currentPassword");
            }}
            error={!!fieldErrors.currentPassword}
            errorMessage={fieldErrors.currentPassword}
          />

          <Input
            label="새 비밀번호"
            placeholder="8자 이상, 영문+숫자"
            secureTextEntry
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              clearFieldError("newPassword");
            }}
            error={!!fieldErrors.newPassword}
            errorMessage={fieldErrors.newPassword}
          />

          <Input
            label="새 비밀번호 확인"
            placeholder="새 비밀번호를 다시 입력하세요"
            secureTextEntry
            value={newPasswordConfirm}
            onChangeText={(text) => {
              setNewPasswordConfirm(text);
              clearFieldError("newPasswordConfirm");
            }}
            error={!!fieldErrors.newPasswordConfirm}
            errorMessage={fieldErrors.newPasswordConfirm}
          />

          <Button onPress={handleChangePassword} loading={loading}>
            비밀번호 변경
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
