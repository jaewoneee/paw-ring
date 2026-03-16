import {
  isSharedPet,
  canEditSchedule,
  canEditCategory,
  canDeleteCategory,
  canCompleteSchedule,
  canDeleteCalendar,
  canManageMembers,
  getDisplayCategories,
} from '@/utils/permissions';
import type { OwnPet, SharedPet } from '@/contexts/PetContext';
import type { ScheduleCategoryItem } from '@/types/schedule';

// ── 픽스처 ────────────────────────────────────────────────────────────────

const BASE_PET = {
  id: 'pet-1',
  name: '멍멍이',
  species: 'dog' as const,
  birth_date: '2020-01-01',
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2020-01-01T00:00:00Z',
  profile_image: null,
};

const ownPet: OwnPet = { ...BASE_PET, owner_id: 'user-1' };

const viewerPet: SharedPet = {
  ...BASE_PET,
  owner_id: 'user-2',
  isShared: true,
  shareId: 'share-1',
  shareRole: 'viewer',
  ownerNickname: '오너',
};

const editorPet: SharedPet = {
  ...BASE_PET,
  owner_id: 'user-2',
  isShared: true,
  shareId: 'share-2',
  shareRole: 'editor',
  ownerNickname: '오너',
};

const makeCategory = (id: string, owner_id: string): ScheduleCategoryItem => ({
  id,
  owner_id,
  name: `카테고리-${id}`,
  color: '#000000',
  icon: 'tag',
  is_default: false,
  sort_order: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
});

// ── isSharedPet ────────────────────────────────────────────────────────────

describe('isSharedPet', () => {
  it('null이면 false', () => {
    expect(isSharedPet(null)).toBe(false);
  });

  it('undefined이면 false', () => {
    expect(isSharedPet(undefined)).toBe(false);
  });

  it('내 반려동물이면 false', () => {
    expect(isSharedPet(ownPet)).toBe(false);
  });

  it('viewer 공유 반려동물이면 true', () => {
    expect(isSharedPet(viewerPet)).toBe(true);
  });

  it('editor 공유 반려동물이면 true', () => {
    expect(isSharedPet(editorPet)).toBe(true);
  });
});

// ── canEditSchedule ────────────────────────────────────────────────────────

describe('canEditSchedule', () => {
  it('pet이 null이면 true (제한 대상 없음)', () => {
    expect(canEditSchedule(null)).toBe(true);
  });

  it('내 반려동물이면 true', () => {
    expect(canEditSchedule(ownPet)).toBe(true);
  });

  it('viewer 공유 캘린더면 false', () => {
    expect(canEditSchedule(viewerPet)).toBe(false);
  });

  it('editor 공유 캘린더면 true', () => {
    expect(canEditSchedule(editorPet)).toBe(true);
  });
});

// ── canEditCategory ────────────────────────────────────────────────────────

describe('canEditCategory', () => {
  it('pet이 null이면 true', () => {
    expect(canEditCategory(null)).toBe(true);
  });

  it('내 반려동물이면 true', () => {
    expect(canEditCategory(ownPet)).toBe(true);
  });

  it('viewer 공유 캘린더면 false', () => {
    expect(canEditCategory(viewerPet)).toBe(false);
  });

  it('editor 공유 캘린더여도 false (카테고리는 owner 전용)', () => {
    expect(canEditCategory(editorPet)).toBe(false);
  });
});

// ── canDeleteCategory ──────────────────────────────────────────────────────

describe('canDeleteCategory', () => {
  const MIN = 1;

  it('내 캘린더이고 카테고리가 최소값 초과면 true', () => {
    expect(canDeleteCategory(ownPet, 3, MIN)).toBe(true);
  });

  it('내 캘린더이고 카테고리가 최소값과 같으면 false', () => {
    expect(canDeleteCategory(ownPet, 1, MIN)).toBe(false);
  });

  it('내 캘린더이고 카테고리가 최소값 미만이면 false', () => {
    expect(canDeleteCategory(ownPet, 0, MIN)).toBe(false);
  });

  it('viewer 공유 캘린더면 카테고리 수와 무관하게 false', () => {
    expect(canDeleteCategory(viewerPet, 10, MIN)).toBe(false);
  });

  it('editor 공유 캘린더도 false (카테고리는 owner 전용)', () => {
    expect(canDeleteCategory(editorPet, 10, MIN)).toBe(false);
  });
});

// ── canCompleteSchedule ────────────────────────────────────────────────────
// 기획 문서: viewer / editor / owner 모두 완료 체크 가능

describe('canCompleteSchedule', () => {
  it('owner (내 캘린더) → true', () => {
    expect(canCompleteSchedule(ownPet)).toBe(true);
  });

  it('viewer 공유 캘린더 → true', () => {
    expect(canCompleteSchedule(viewerPet)).toBe(true);
  });

  it('editor 공유 캘린더 → true', () => {
    expect(canCompleteSchedule(editorPet)).toBe(true);
  });

  it('pet 없음 → true', () => {
    expect(canCompleteSchedule(null)).toBe(true);
  });
});

// ── canDeleteCalendar ──────────────────────────────────────────────────────
// 기획 문서: 캘린더 삭제는 owner 전용

describe('canDeleteCalendar', () => {
  it('내 캘린더 (owner) → true', () => {
    expect(canDeleteCalendar(ownPet)).toBe(true);
  });

  it('viewer 공유 캘린더 → false', () => {
    expect(canDeleteCalendar(viewerPet)).toBe(false);
  });

  it('editor 공유 캘린더 → false', () => {
    expect(canDeleteCalendar(editorPet)).toBe(false);
  });

  it('pet 없음 → true', () => {
    expect(canDeleteCalendar(null)).toBe(true);
  });
});

// ── canManageMembers ───────────────────────────────────────────────────────

describe('canManageMembers', () => {
  it('내 반려동물이면 true', () => {
    expect(canManageMembers(ownPet)).toBe(true);
  });

  it('pet이 null이면 true', () => {
    expect(canManageMembers(null)).toBe(true);
  });

  it('viewer 공유 캘린더면 false', () => {
    expect(canManageMembers(viewerPet)).toBe(false);
  });

  it('editor 공유 캘린더도 false (멤버 관리는 owner 전용)', () => {
    expect(canManageMembers(editorPet)).toBe(false);
  });
});

// ── getDisplayCategories ───────────────────────────────────────────────────

describe('getDisplayCategories', () => {
  const myCategories = [makeCategory('c1', 'user-1'), makeCategory('c2', 'user-1')];
  const ownerCategories = [makeCategory('c3', 'user-2'), makeCategory('c4', 'user-2')];
  const allCategories = [...myCategories, ...ownerCategories];

  it('내 캘린더면 myCategories를 그대로 반환', () => {
    expect(getDisplayCategories(ownPet, myCategories, allCategories)).toEqual(myCategories);
  });

  it('pet이 null이면 myCategories 반환', () => {
    expect(getDisplayCategories(null, myCategories, allCategories)).toEqual(myCategories);
  });

  it('공유 캘린더면 해당 오너의 카테고리만 반환', () => {
    const result = getDisplayCategories(viewerPet, myCategories, allCategories);
    expect(result).toEqual(ownerCategories);
    expect(result.every(c => c.owner_id === 'user-2')).toBe(true);
  });

  it('공유 캘린더 오너 카테고리가 없으면 빈 배열 반환', () => {
    const result = getDisplayCategories(viewerPet, myCategories, myCategories);
    expect(result).toEqual([]);
  });

  it('내 카테고리가 allCategories에 섞여 있어도 오너 것만 필터링', () => {
    const mixed = [...myCategories, ...ownerCategories, makeCategory('c5', 'user-3')];
    const result = getDisplayCategories(editorPet, myCategories, mixed);
    expect(result).toEqual(ownerCategories);
  });
});
