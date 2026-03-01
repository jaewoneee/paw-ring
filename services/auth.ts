import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
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
