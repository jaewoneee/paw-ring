import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  getAdditionalUserInfo,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

/** 이메일/비밀번호 회원가입 */
export async function registerWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential;
}

/** 이메일/비밀번호 로그인 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/** 로그아웃 */
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/** 비밀번호 재설정 이메일 발송 */
export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

/** 인증 이메일 재발송 */
export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

/** 구글 ID Token으로 Firebase 로그인 */
export async function signInWithGoogle(
  idToken: string
): Promise<{ credential: UserCredential; isNewUser: boolean }> {
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const credential = await signInWithCredential(auth, googleCredential);
  const additionalInfo = getAdditionalUserInfo(credential);
  return {
    credential,
    isNewUser: additionalInfo?.isNewUser ?? false,
  };
}

/** 현재 사용자 정보 새로고침 (이메일 인증 상태 갱신) */
export async function reloadUser(): Promise<boolean> {
  if (auth.currentUser) {
    await reload(auth.currentUser);
    return auth.currentUser.emailVerified;
  }
  return false;
}
