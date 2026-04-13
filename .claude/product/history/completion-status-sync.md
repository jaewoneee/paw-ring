## 2026-03-24: 완료 상태 상세↔리스트 불일치 버그 수정

### 결정
완료 판단 로직을 **레코드 존재 여부** 방식으로 통일하고, 상세 화면의 쿼리 무효화를 동기적으로 처리.

### 근본 원인 (3가지)

1. **`completeSchedule` upsert에 `status` 필드 누락**
   - DB 테이블에 `status TEXT NOT NULL DEFAULT 'completed'` 정의되어 있지만, upsert 시 `status` 필드를 명시하지 않음
   - 상세 화면: `!!completion` (레코드 존재 여부)으로 판단 → 정상 동작
   - 캘린더 리스트: `c.status === 'completed'`로 판단 → status가 null이면 항상 미완료로 표시
   - **수정**: 리스트도 레코드 존재 여부(`completedSet.has(key)`)로 판단하도록 통일

2. **상세 화면 `invalidateQueries` 미대기**
   - 완료 토글 후 `invalidateQueries`를 `await` 하지 않아 유저가 빠르게 뒤로가면 캘린더 refetch가 미완료
   - **수정**: `await queryClient.invalidateQueries(...)` 로 변경

3. **캘린더 화면 복귀 시 refetch 방식**
   - `useFocusEffect`에서 `invalidateQueries` 호출 시, 쿼리가 inactive 상태면 refetch 안 됨
   - **수정**: `refresh()` (직접 `refetch()` 호출)로 변경하여 항상 최신 데이터 보장

### 검증
- `__tests__/completionStatus.test.ts` 5개 케이스 통과
  - status null인 레코드도 완료로 판단
  - 레코드 없으면 미완료로 판단
  - 날짜 포맷 정규화 (ISO datetime → YYYY-MM-DD)
  - 스케줄/날짜 조합별 정확한 구분

### 영향
- `hooks/useSchedules.ts` — `completionMap.get(key)` → `completedSet.has(key)` 방식으로 변경
- `services/schedule.ts` — `getWeekScheduleInstances` 동일하게 변경
- `app/schedule-detail.tsx` — `invalidateQueries` await 추가
- `app/(tabs)/calendar.tsx` — `useFocusEffect`에서 `refresh()` 직접 호출
