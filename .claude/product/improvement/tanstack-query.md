# TanStack Query 도입

> 서버 데이터 캐싱 및 상태 관리 체계화

## 현재 문제

- **매 화면 진입마다 전체 re-fetch**: `useFocusEffect`/`useIsFocused`로 탭 전환, 뒤로가기 시마다 네트워크 요청
- **캐싱 없음**: 같은 데이터를 여러 화면에서 중복 요청 (e.g. 홈 + 캘린더 모두 스케줄 fetch)
- **수동 상태 관리**: 각 화면에서 `useState`로 `isLoading`/`error`/데이터를 개별 관리
- **낙관적 업데이트 산발적**: 홈, 캘린더에서 각각 다른 방식으로 수동 롤백 구현

---

## 마이그레이션 계획

### Phase 1: 기반 설정

| # | 항목 | 상태 |
|---|------|------|
| 1.1 | `@tanstack/react-query` 패키지 설치 | ✅ |
| 1.2 | `QueryClientProvider` 설정 (`app/_layout.tsx`) | ✅ |
| 1.3 | React Navigation focus 연동 (`focusManager`) | ✅ |
| 1.4 | 네트워크 상태 연동 (`onlineManager`) | ⬜ |

### Phase 2: 스케줄 (가장 복잡, 가장 효과 큼)

| # | 항목 | 상태 |
|---|------|------|
| 2.1 | `useMonthSchedules` → `useQuery` 전환 | ✅ |
| 2.2 | 홈 화면 `getUpcomingSchedules` → `useQuery` 전환 | ✅ |
| 2.3 | 스케줄 상세 `getScheduleById` → `useQuery` 전환 | ✅ |
| 2.4 | 스케줄 수정 — 수정 후 `invalidateQueries` 적용 | ✅ |
| 2.5 | 스케줄 추가/삭제 → `invalidateQueries` 적용 | ✅ |
| 2.6 | 완료 토글 → optimistic update + `invalidateQueries` | ✅ |
| 2.7 | `useFocusEffect` 제거 (staleTime + focusManager로 대체) | ✅ |

### Phase 3: 반려동물 & 카테고리

| # | 항목 | 상태 |
|---|------|------|
| 3.1 | `PetContext` → `useQuery`로 pets/sharedPets 전환 | ✅ |
| 3.2 | `useCategories` → `useQuery` 전환 | ✅ |
| 3.3 | 펫/카테고리 CRUD → `setQueryData` + `invalidateQueries` | ✅ |
| 3.4 | Context를 쿼리 래퍼로 단순화 (selectedPet 상태만 유지) | ✅ |

### Phase 4: 공유 & 초대

| # | 항목 | 상태 |
|---|------|------|
| 4.1 | `useCalendarMembers` → `useQuery` 전환 | ✅ |
| 4.2 | `useSharedCalendars` → `useQuery` 전환 | ✅ |
| 4.3 | 초대 수락 → `refreshPets` (invalidateQueries) 연동 | ✅ |

### Phase 5: 정리

| # | 항목 | 상태 |
|---|------|------|
| 5.1 | 불필요해진 `useState`(isLoading/error) 제거 | ✅ |
| 5.2 | `useFocusEffect` / `useIsFocused` 전면 제거 | ✅ |
| 5.3 | `refresh()` → `invalidateQueries` 래퍼로 단순화 | ✅ |

---

## 쿼리 키 설계

```
['schedules', 'month', petId, year, month]    // 월간 캘린더
['schedules', 'upcoming', petId]              // 홈 다가오는 일정
['schedules', 'detail', scheduleId]           // 스케줄 상세
['pets', userId]                              // 내 반려동물
['pets', 'shared', userId]                    // 공유받은 반려동물
['categories', userId]                        // 카테고리
['calendar-members', petId]                   // 캘린더 멤버
['invites', inviteId]                         // 초대 상세
```

**invalidation 전략:**
- 스케줄 CRUD → `['schedules']` 전체 무효화
- 펫 CRUD → `['pets']` 전체 무효화
- 카테고리 CRUD → `['categories']` 전체 무효화
- 공유 변경 → `['calendar-members']` + `['pets', 'shared']` 무효화

---

## staleTime 설정 방향

| 데이터 | staleTime | 근거 |
|--------|-----------|------|
| 스케줄 (월간/upcoming) | 30초 | 자주 변경될 수 있음, 하지만 탭 전환마다는 과도 |
| 스케줄 상세 | 1분 | 상세→수정→상세 흐름에서 캐시 활용 |
| 반려동물 목록 | 5분 | 거의 변경되지 않음 |
| 카테고리 | 5분 | 거의 변경되지 않음 |
| 캘린더 멤버 | 1분 | 공유 설정 화면에서만 사용 |

---

## 현재 데이터 페칭 인벤토리

### 화면별 fetch 트리거

| 화면 | 현재 트리거 | 전환 후 |
|------|-----------|---------|
| 홈 | `useFocusEffect` → 매번 fetch | `useQuery` + staleTime (캐시 있으면 즉시 렌더) |
| 캘린더 | `useFocusEffect` → 매번 fetch | `useQuery` + staleTime |
| 스케줄 상세 | `useIsFocused` → 매번 fetch | `useQuery` (상세 캐시) |
| 스케줄 수정 | `useEffect` → 마운트 시 fetch | `useQuery` (상세 캐시 공유) |
| 반려동물 | Context `refreshPets()` | `useQuery` (5분 캐시) |
| 카테고리 | Hook `useEffect` | `useQuery` (5분 캐시) |

### 낙관적 업데이트 대상

| 동작 | 현재 구현 위치 | 전환 후 |
|------|--------------|---------|
| 스케줄 완료 토글 (홈) | `index.tsx` 수동 filter + rollback | `useMutation` onMutate/onError |
| 스케줄 완료 토글 (캘린더) | `useSchedules.ts` updateCompletionStatus | `useMutation` onMutate/onError |
| 알림 토글 | `calendar.tsx` 수동 toggle + rollback | `useMutation` onMutate/onError |

### 서비스 함수 (변경 없음)

기존 `services/` 함수들은 그대로 유지. `useQuery`의 `queryFn`으로 래핑만 하면 됨.
