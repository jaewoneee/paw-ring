import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserPets } from "@/services/pet";
import { getSharedPets } from "@/services/sharing";
import type { Pet } from "@/types/pet";
import type { ShareRole } from "@/types/sharing";

/** 공유받은 반려동물 (Pet + 공유 메타 정보) */
export interface SharedPet extends Pet {
  isShared: true;
  shareId: string;
  shareRole: ShareRole;
  ownerNickname: string;
}

/** 내 반려동물 (isShared 구분용) */
export interface OwnPet extends Pet {
  isShared?: false;
}

export type PetOrShared = OwnPet | SharedPet;

interface PetContextType {
  pets: Pet[];
  sharedPets: SharedPet[];
  allPets: PetOrShared[];
  selectedPet: PetOrShared | null;
  selectPet: (pet: PetOrShared) => void;
  refreshPets: () => Promise<void>;
  isLoading: boolean;
}

const PetContext = createContext<PetContextType | null>(null);

export function PetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [sharedPets, setSharedPets] = useState<SharedPet[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetOrShared | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshPets = useCallback(async () => {
    if (!user) {
      setPets([]);
      setSharedPets([]);
      setSelectedPet(null);
      return;
    }
    setIsLoading(true);
    try {
      // 부분 실패 처리: 하나가 실패해도 나머지 결과는 유지
      const [ownSettled, sharedSettled] = await Promise.allSettled([
        getUserPets(user.uid),
        getSharedPets(user.uid),
      ]);

      const ownResult = ownSettled.status === "fulfilled" ? ownSettled.value : pets;
      const sharedResult = sharedSettled.status === "fulfilled" ? sharedSettled.value : [];

      if (ownSettled.status === "rejected") {
        console.warn("[PetContext] 내 반려동물 로딩 실패:", ownSettled.reason);
      }
      if (sharedSettled.status === "rejected") {
        console.warn("[PetContext] 공유 반려동물 로딩 실패:", sharedSettled.reason);
      }

      setPets(ownResult);

      const shared: SharedPet[] = sharedResult.map((s) => ({
        id: s.pet_id,
        owner_id: s.owner_id,
        name: s.pet.name,
        species: "dog" as const, // JOIN에서 species는 가져오지 않으므로 기본값
        birth_date: "",
        profile_image: s.pet.profile_image,
        created_at: s.created_at,
        updated_at: s.updated_at,
        isShared: true as const,
        shareId: s.id,
        shareRole: s.role,
        ownerNickname: s.owner.nickname,
      }));
      setSharedPets(shared);

      const all: PetOrShared[] = [...ownResult, ...shared];

      // 선택된 펫이 없거나 목록에서 사라졌으면 첫 번째로 설정
      setSelectedPet((prev) => {
        if (prev) {
          const updated = all.find((p) => p.id === prev.id);
          if (updated) return updated;
        }
        return all[0] ?? null;
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshPets();
  }, [refreshPets]);

  const selectPet = useCallback((pet: PetOrShared) => {
    setSelectedPet(pet);
  }, []);

  const allPets: PetOrShared[] = [...pets, ...sharedPets];

  return (
    <PetContext.Provider
      value={{ pets, sharedPets, allPets, selectedPet, selectPet, refreshPets, isLoading }}
    >
      {children}
    </PetContext.Provider>
  );
}

export function usePets() {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error("usePets must be used within PetProvider");
  return ctx;
}
