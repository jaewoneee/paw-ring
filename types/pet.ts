import { Timestamp } from "firebase/firestore";

export type PetSpecies = "dog" | "cat";

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  birthDate: string;
  profileImage?: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
