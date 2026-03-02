import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserPets } from "@/services/firestore";
import type { Pet } from "@/types/pet";

interface PetContextType {
  pets: Pet[];
  selectedPet: Pet | null;
  selectPet: (pet: Pet) => void;
  refreshPets: () => Promise<void>;
  isLoading: boolean;
}

const PetContext = createContext<PetContextType | null>(null);

export function PetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshPets = useCallback(async () => {
    if (!user) {
      setPets([]);
      setSelectedPet(null);
      return;
    }
    setIsLoading(true);
    try {
      const result = await getUserPets(user.uid);
      setPets(result);
      // 선택된 펫이 없거나 목록에서 사라졌으면 첫 번째로 설정
      setSelectedPet((prev) => {
        if (prev && result.find((p) => p.id === prev.id)) return prev;
        return result[0] ?? null;
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshPets();
  }, [refreshPets]);

  const selectPet = useCallback((pet: Pet) => {
    setSelectedPet(pet);
  }, []);

  return (
    <PetContext.Provider
      value={{ pets, selectedPet, selectPet, refreshPets, isLoading }}
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
