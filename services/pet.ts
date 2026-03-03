import { supabase } from "@/lib/supabase";
import type { Pet, PetSpecies } from "@/types/pet";

/** 반려동물 등록 */
export async function createPet(data: {
  owner_id: string;
  name: string;
  species: PetSpecies;
  birth_date: string;
  profile_image?: string;
}): Promise<Pet> {
  const { data: pet, error } = await supabase
    .from("pets")
    .insert({
      owner_id: data.owner_id,
      name: data.name,
      species: data.species,
      birth_date: data.birth_date,
      profile_image: data.profile_image ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return pet as Pet;
}

/** 유저의 반려동물 목록 조회 */
export async function getUserPets(ownerId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Pet[];
}

/** 반려동물 수정 */
export async function updatePet(
  id: string,
  data: Partial<Pick<Pet, "name" | "species" | "birth_date" | "profile_image">>
): Promise<void> {
  const { error } = await supabase
    .from("pets")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** 반려동물 삭제 */
export async function deletePet(id: string): Promise<void> {
  const { error } = await supabase.from("pets").delete().eq("id", id);

  if (error) throw error;
}
