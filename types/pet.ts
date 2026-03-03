export type PetSpecies = "dog" | "cat";

/** Supabase pets 테이블 스키마 */
export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: PetSpecies;
  birth_date: string;
  profile_image?: string | null;
  created_at: string;
  updated_at: string;
}
