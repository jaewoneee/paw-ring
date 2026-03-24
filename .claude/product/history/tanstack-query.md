## 2026-03-24: 낙관적 업데이트 전면 제거

### 결정
스케줄 완료 토글 등 모든 mutation에서 낙관적 업데이트(`setQueryData`)를 제거하고, API 성공 후 `invalidateQueries`만 사용하는 방식으로 통일.

### 이유
- 캘린더 화면의 `useFocusEffect`가 `queryKeys.schedules.all` prefix로 invalidate → 낙관적 업데이트가 refetch로 덮어씌워지는 버그 반복 발생
- 홈 화면에서도 동일한 prefix 매칭 문제로 체크 후 롤백 현상
- 체크 토글은 API 응답이 빠르기 때문에 UX 차이가 거의 없음
- 낙관적 업데이트 유지 비용 (롤백 로직, invalidation 범위 조율) 대비 이점 부족

### 결론
`useMonthSchedules`의 `updateCompletionStatus` 함수 삭제, 홈/캘린더 양쪽의 낙관적 업데이트 + 롤백 코드 제거. `improvement/tanstack-query.md` 문서도 반영 완료.

### 영향
- `hooks/useSchedules.ts` — `updateCompletionStatus` 제거
- `app/(tabs)/calendar.tsx` — 낙관적 업데이트/롤백 제거, invalidate 방식으로 단순화
- `app/(tabs)/index.tsx` — 동일
