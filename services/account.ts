import {
  deleteUser,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

/** 이메일 사용자 재인증 */
export async function reauthenticateWithEmail(
  password: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No authenticated user");
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

/** 비밀번호 변경 (이메일 사용자 전용) */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await reauthenticateWithEmail(currentPassword);
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  await firebaseUpdatePassword(user, newPassword);
}

/** 계정 삭제 (Firebase Auth) */
export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  await deleteUser(user);
}
