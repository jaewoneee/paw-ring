import { Timestamp } from "firebase/firestore";

export interface Pet {
  id: string;
  name: string;
  species: string;
  age?: number;
  profileImage: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
