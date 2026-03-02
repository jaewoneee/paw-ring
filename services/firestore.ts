import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types/auth";
import type { Pet } from "@/types/pet";

const USERS_COLLECTION = "users";

/** 사용자 프로필 생성 (회원가입 시) */
export async function createUserProfile(
  uid: string,
  data: {
    email: string;
    nickname: string;
    provider: "email" | "google";
    profileImage?: string;
  }
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(userRef, {
    uid,
    email: data.email,
    nickname: data.nickname,
    profileImage: data.profileImage ?? "",
    provider: data.provider,
    emailVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** 사용자 프로필 조회 */
export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

/** 사용자 프로필 업데이트 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, "nickname" | "profileImage" | "emailVerified">>
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** 사용자 프로필 삭제 (회원 탈퇴 시) */
export async function deleteUserProfile(uid: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await deleteDoc(userRef);
}

// ─── 반려동물 ───

/** 유저의 반려동물 목록 조회 */
export async function getUserPets(uid: string): Promise<Pet[]> {
  const petsRef = collection(db, USERS_COLLECTION, uid, "pets");
  const q = query(petsRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Pet);
}
