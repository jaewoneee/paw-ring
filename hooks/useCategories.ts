import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/services/category";

/** 카테고리가 1개뿐이면 삭제 불가 */
export const MIN_CATEGORY_COUNT = 1;
import type { ScheduleCategoryItem } from "@/types/schedule";

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ScheduleCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let data = await getCategories(user.uid);

      // "기타" 카테고리가 없으면 자동 생성
      const hasOther = data.some((c) => c.name === "기타");
      if (!hasOther) {
        const other = await createCategory({
          owner_id: user.uid,
          name: "기타",
          color: "#6B7280",
          icon: "tag",
        });
        data = [...data, other];
      }

      setCategories(data);
    } catch (err) {
      console.error("[useCategories] fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 카테고리 ID로 메타 정보 조회 (캘린더 렌더링용) */
  const getCategoryMeta = useCallback(
    (categoryId: string) => {
      const found = categories.find((c) => c.id === categoryId);
      return found ?? { id: categoryId, name: "기타", color: "#6B7280", icon: "tag" };
    },
    [categories]
  );

  const addCategory = useCallback(
    async (input: { name: string; color: string; icon?: string }) => {
      if (!user) return;
      const created = await createCategory({ ...input, owner_id: user.uid });
      setCategories((prev) => [...prev, created]);
      return created;
    },
    [user]
  );

  const editCategory = useCallback(
    async (
      id: string,
      input: { name?: string; color?: string; icon?: string }
    ) => {
      await updateCategory(id, input);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...input } : c))
      );
    },
    []
  );

  const removeCategory = useCallback(async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    categories,
    isLoading,
    refresh,
    getCategoryMeta,
    addCategory,
    editCategory,
    removeCategory,
  };
}
