import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Button, Typography, Input } from "theo-kit-native";
import { useAuth } from "@/hooks/useAuth";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateNickname,
  getFirebaseErrorMessage,
} from "@/utils/validation";

export default function RegisterScreen() {
  const { register } = useAuth();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};

    const nicknameResult = validateNickname(nickname);
    if (!nicknameResult.isValid) errors.nickname = nicknameResult.error!;

    const emailResult = validateEmail(email);
    if (!emailResult.isValid) errors.email = emailResult.error!;

    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) errors.password = passwordResult.error!;

    const confirmResult = validatePasswordConfirm(password, passwordConfirm);
    if (!confirmResult.isValid) errors.passwordConfirm = confirmResult.error!;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setError("");
    if (!validateAll()) return;

    setLoading(true);
    try {
      await register(email, password, nickname);
      Alert.alert(
        "가입 완료",
        "인증 이메일을 발송했습니다. 이메일을 확인해주세요.",
        [{ text: "확인" }]
      );
    } catch (err: any) {
      const code = err?.code ?? "";
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 24, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {error ? (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3">
          <Typography className="text-red-600 text-sm text-center">
            {error}
          </Typography>
        </View>
      ) : null}

      <View className="gap-4">
        <Input
          label="닉네임"
          placeholder="2~20자"
          value={nickname}
          onChangeText={setNickname}
          error={!!fieldErrors.nickname}
          errorMessage={fieldErrors.nickname}
        />
        <Input
          label="이메일"
          placeholder="example@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={!!fieldErrors.email}
          errorMessage={fieldErrors.email}
        />
        <Input
          label="비밀번호"
          placeholder="8자 이상, 영문+숫자"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={!!fieldErrors.password}
          errorMessage={fieldErrors.password}
        />
        <Input
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력하세요"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
          error={!!fieldErrors.passwordConfirm}
          errorMessage={fieldErrors.passwordConfirm}
        />
      </View>

      <Button onPress={handleRegister} loading={loading} disabled={loading}>
        가입하기
      </Button>

      <View className="flex-row items-center gap-3 mt-2">
        <View className="flex-1 h-px bg-gray-200" />
        <Typography className="text-gray-400 text-sm">또는</Typography>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      <Button variant="outline" disabled>
        구글로 시작하기 (준비중)
      </Button>
    </ScrollView>
  );
}
