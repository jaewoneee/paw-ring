import { Timestamp } from "firebase/firestore";

/** Firestore users/{uid} 문서 스키마 */
export interface UserProfile {
  uid: string;
  email: string;
  nickname: string;
  profileImage: string;
  provider: "email" | "google";
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
