import type { OwnPet, SharedPet, PetOrShared } from '@/contexts/PetContext';
import type { ScheduleCategoryItem } from '@/types/schedule';

/** 반려동물이 공유받은 캘린더인지 판별 */
export function isSharedPet(pet: PetOrShared | null | undefined): pet is SharedPet {
  return !!pet && 'isShared' in pet && pet.isShared === true;
}

/**
 * 스케줄 생성/수정/삭제 권한 여부
 * - 내 캘린더: 항상 가능
 * - 공유 캘린더 editor: 가능
 * - 공유 캘린더 viewer: 불가
 * - pet 없음: 가능 (제한 대상 없음)
 */
export function canEditSchedule(pet: PetOrShared | null | undefined): boolean {
  if (!pet) return true;
  if (!isSharedPet(pet)) return true;
  return pet.shareRole === 'editor';
}

/**
 * 카테고리 추가/수정/삭제 권한 여부
 * - 내 캘린더(owner): 가능
 * - 공유 캘린더(viewer/editor 모두): 불가
 */
export function canEditCategory(pet: PetOrShared | null | undefined): boolean {
  if (!pet) return true;
  return !isSharedPet(pet);
}

/**
 * 카테고리 삭제 가능 여부 (최소 1개 유지 조건 포함)
 */
export function canDeleteCategory(
  pet: PetOrShared | null | undefined,
  categoryCount: number,
  minCount: number,
): boolean {
  return canEditCategory(pet) && categoryCount > minCount;
}

/**
 * 완료 체크 권한 여부
 * - viewer / editor / owner 모두 가능
 */
export function canCompleteSchedule(_pet: PetOrShared | null | undefined): boolean {
  return true;
}

/**
 * 캘린더(반려동물) 삭제 권한 여부 (owner 전용)
 */
export function canDeleteCalendar(pet: PetOrShared | null | undefined): boolean {
  return !isSharedPet(pet);
}

/**
 * 공유 캘린더 멤버 관리 권한 여부 (owner 전용)
 */
export function canManageMembers(pet: PetOrShared | null | undefined): boolean {
  return !isSharedPet(pet);
}

/**
 * 공유 캘린더일 때 해당 오너의 카테고리만 필터링
 * 내 캘린더면 내 카테고리 그대로 반환
 */
export function getDisplayCategories(
  pet: PetOrShared | null | undefined,
  myCategories: ScheduleCategoryItem[],
  allCategories: ScheduleCategoryItem[],
): ScheduleCategoryItem[] {
  if (!isSharedPet(pet)) return myCategories;
  return allCategories.filter(c => c.owner_id === pet.owner_id);
}
