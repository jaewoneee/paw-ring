import { supabase } from "@/lib/supabase";
import type { Pet, PetSpecies } from "@/types/pet";
import { decode } from "base64-arraybuffer";
import { File } from "expo-file-system/next";

/** 반려동물 프로필 이미지 업로드 */
export async function uploadPetImage(
  ownerId: string,
  localUri: string
): Promise<string> {
  const ext = localUri.split(".").pop() ?? "jpg";
  const fileName = `${ownerId}/${Date.now()}.${ext}`;

  const file = new File(localUri);
  const base64 = await file.base64();

  const { error } = await supabase.storage
    .from("pet-profiles")
    .upload(fileName, decode(base64), { contentType: `image/${ext}`, upsert: true });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("pet-profiles").getPublicUrl(fileName);

  return publicUrl;
}

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
