import React, { createContext, useContext } from "react";
import { useCategories } from "@/hooks/useCategories";
import type { ScheduleCategoryItem } from "@/types/schedule";

interface CategoryContextType {
  categories: ScheduleCategoryItem[];
  allCategories: ScheduleCategoryItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  getCategoryMeta: (categoryId: string) => Pick<ScheduleCategoryItem, "name" | "color" | "icon"> & { id: string };
  addCategory: (input: { name: string; color: string; icon?: string }) => Promise<ScheduleCategoryItem | undefined>;
  editCategory: (id: string, input: { name?: string; color?: string; icon?: string }) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const value = useCategories();

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategoryContext must be used within CategoryProvider");
  }
  return context;
}
