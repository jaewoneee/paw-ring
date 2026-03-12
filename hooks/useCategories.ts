import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useColorScheme } from "@/components/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/hooks/queryKeys";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/services/category";
import { ensureReadableColor } from "@/utils/color";

/** 카테고리가 1개뿐이면 삭제 불가 */
export const MIN_CATEGORY_COUNT = 1;
import type { ScheduleCategoryItem } from "@/types/schedule";

export function useCategories() {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();

  const queryKey = user ? queryKeys.categories.byUser(user.uid) : ['categories', 'disabled'];

  const { data: categories = [], isPending } = useQuery({
    queryKey,
    queryFn: () => getCategories(user!.uid),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // "기타" 카테고리가 없으면 자동 생성 (queryFn 외부에서 side effect 분리)
  useEffect(() => {
    if (!user || isPending || categories.length === 0) return;
    const hasOther = categories.some((c) => c.name === "기타");
    if (!hasOther) {
      createCategory({
        owner_id: user.uid,
        name: "기타",
        color: "#6B7280",
        icon: "tag",
      }).then((created) => {
        queryClient.setQueryData<ScheduleCategoryItem[]>(queryKey, (prev) =>
          prev ? [...prev, created] : [created]
        );
      });
    }
  }, [user, isPending, categories, queryClient, queryKey]);

  const isLoading = isPending && !!user;

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  /** 카테고리 ID로 메타 정보 조회 (캘린더 렌더링용) */
  const getCategoryMeta = useCallback(
    (categoryId: string) => {
      const adjustColor = <T extends { color: string }>(meta: T): T => ({
        ...meta,
        color: ensureReadableColor(meta.color, isDark),
      });

      // 1. ID 기준 조회
      const found = categories.find((c) => c.id === categoryId);
      if (found) return adjustColor(found);

      // 2. 레거시 slug 기반 fallback (slug → 카테고리 이름 매핑)
      const SLUG_TO_NAME: Record<string, string> = {
        walk: "산책",
        meal: "식사",
        hospital: "병원",
        medicine: "약",
        bath: "목욕",
        other: "기타",
      };
      const name = SLUG_TO_NAME[categoryId];
      if (name) {
        const byName = categories.find((c) => c.name === name);
        if (byName) return adjustColor(byName);
      }

      return adjustColor({ id: categoryId, name: "기타", color: "#6B7280", icon: "tag" });
    },
    [categories, isDark]
  );

  const addCategory = useCallback(
    async (input: { name: string; color: string; icon?: string }) => {
      if (!user) return;
      const created = await createCategory({ ...input, owner_id: user.uid });
      queryClient.setQueryData<ScheduleCategoryItem[]>(queryKey, (prev) =>
        prev ? [...prev, created] : [created]
      );
      return created;
    },
    [user, queryClient, queryKey]
  );

  const editCategory = useCallback(
    async (
      id: string,
      input: { name?: string; color?: string; icon?: string }
    ) => {
      await updateCategory(id, input);
      queryClient.setQueryData<ScheduleCategoryItem[]>(queryKey, (prev) =>
        prev?.map((c) => (c.id === id ? { ...c, ...input } : c))
      );
    },
    [queryClient, queryKey]
  );

  const removeCategory = useCallback(
    async (id: string) => {
      await deleteCategory(id);
      queryClient.setQueryData<ScheduleCategoryItem[]>(queryKey, (prev) =>
        prev?.filter((c) => c.id !== id)
      );
    },
    [queryClient, queryKey]
  );

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
