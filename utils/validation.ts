export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/** 이메일 형식 검증 */
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, error: "이메일을 입력해주세요" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "올바른 이메일 형식이 아닙니다" };
  }
  return { isValid: true };
}

/** 비밀번호 규칙: 최소 8자, 영문 + 숫자 포함 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "비밀번호를 입력해주세요" };
  }
  if (password.length < 8) {
    return { isValid: false, error: "비밀번호는 최소 8자 이상이어야 합니다" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, error: "비밀번호에 영문을 포함해주세요" };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "비밀번호에 숫자를 포함해주세요" };
  }
  return { isValid: true };
}

/** 비밀번호 확인 일치 검증 */
export function validatePasswordConfirm(
  password: string,
  confirm: string
): ValidationResult {
  if (!confirm) {
    return { isValid: false, error: "비밀번호 확인을 입력해주세요" };
  }
  if (password !== confirm) {
    return { isValid: false, error: "비밀번호가 일치하지 않습니다" };
  }
  return { isValid: true };
}

/** 닉네임 검증: 2~20자 */
export function validateNickname(nickname: string): ValidationResult {
  if (!nickname.trim()) {
    return { isValid: false, error: "닉네임을 입력해주세요" };
  }
  if (nickname.trim().length < 2) {
    return { isValid: false, error: "닉네임은 2자 이상이어야 합니다" };
  }
  if (nickname.trim().length > 20) {
    return { isValid: false, error: "닉네임은 20자 이하여야 합니다" };
  }
  return { isValid: true };
}

/** Firebase Auth 에러 코드를 한국어 메시지로 변환 */
export function getFirebaseErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    "auth/weak-password": "비밀번호는 최소 8자, 영문+숫자를 포함해야 합니다",
    "auth/email-already-in-use": "이미 가입된 이메일입니다",
    "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다",
    "auth/user-not-found": "이메일 또는 비밀번호가 올바르지 않습니다",
    "auth/invalid-email": "올바른 이메일 형식이 아닙니다",
    "auth/network-request-failed": "네트워크 연결을 확인해주세요",
    "auth/too-many-requests": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요",
    "auth/account-exists-with-different-credential":
      "이미 이메일로 가입된 계정입니다. 이메일로 로그인 후 구글 계정을 연동해주세요",
    "auth/popup-closed-by-user": "구글 로그인이 취소되었습니다",
    "auth/cancelled-popup-request": "구글 로그인이 취소되었습니다",
  };

  return errorMessages[errorCode] ?? "알 수 없는 오류가 발생했습니다";
}
