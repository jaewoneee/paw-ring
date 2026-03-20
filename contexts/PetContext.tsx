import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/hooks/queryKeys";
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
  const queryClient = useQueryClient();
  const [selectedPet, setSelectedPet] = useState<PetOrShared | null>(null);

  const { data: pets = [], isPending: isPetsLoading } = useQuery({
    queryKey: user ? queryKeys.pets.own(user.uid) : ['pets', 'disabled'],
    queryFn: () => getUserPets(user!.uid),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: rawSharedPets = [], isPending: isSharedLoading } = useQuery({
    queryKey: user ? queryKeys.pets.shared(user.uid) : ['pets', 'shared', 'disabled'],
    queryFn: () => getSharedPets(user!.uid),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const sharedPets: SharedPet[] = useMemo(
    () =>
      rawSharedPets.map((s) => ({
        id: s.pet_id,
        owner_id: s.owner_id,
        name: s.pet.name,
        species: "dog" as const,
        birth_date: "",
        profile_image: s.pet.profile_image,
        created_at: s.created_at,
        updated_at: s.updated_at,
        isShared: true as const,
        shareId: s.id,
        shareRole: s.role,
        ownerNickname: s.owner.nickname,
      })),
    [rawSharedPets]
  );

  const allPets: PetOrShared[] = useMemo(
    () => [...pets, ...sharedPets],
    [pets, sharedPets]
  );
  const isLoading = (isPetsLoading || isSharedLoading) && !!user;

  // 선택된 펫이 없거나 목록에서 사라졌으면 첫 번째로 설정
  useEffect(() => {
    if (allPets.length === 0) return; // 쿼리 로딩 중이면 기존 선택 유지
    setSelectedPet((prev) => {
      if (prev) {
        const stillExists = allPets.some((p) => p.id === prev.id);
        if (stillExists) return prev;
      }
      return allPets[0] ?? null;
    });
  }, [pets, rawSharedPets]);

  // 로그아웃 시 초기화
  useEffect(() => {
    if (!user) setSelectedPet(null);
  }, [user]);

  const selectPet = useCallback((pet: PetOrShared) => {
    setSelectedPet(pet);
  }, []);

  const refreshPets = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.own(user.uid) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.shared(user.uid) }),
    ]);
  }, [user, queryClient]);

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
