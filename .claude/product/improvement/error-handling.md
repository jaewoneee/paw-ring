# 에러 처리 개선

## 2026-03-10: 무시되는 catch 제거 및 에러 상태 UI 추가

- **배경**: `schedule.ts`에 `.catch(() => {})` 9곳, `notificationScheduler.ts` 2곳, `calendar.tsx` 1곳에서 에러가 조용히 무시됨. 홈/캘린더 화면에서 데이터 로딩 실패 시 사용자 피드백 없음
- **개선 내용**:
  - 모든 `.catch(() => {})` → `.catch((err) => console.warn(...))` 로 교체 (12곳)
  - `useMonthSchedules` 훅에 `error` 상태 반환 추가
  - 홈 화면 — 일정 로딩 실패 시 에러 카드 + "탭하여 다시 시도" UI
  - 캘린더 화면 — 월간/주간 뷰 모두 에러 배너 + "다시 시도" 탭 UI
- **수정 파일**:
  - `services/schedule.ts` — 9개 catch에 console.warn 추가
  - `utils/notificationScheduler.ts` — 2개 catch에 console.warn 추가
  - `hooks/useSchedules.ts` — error 상태 추가 및 반환
  - `app/(tabs)/calendar.tsx` — 에러 배너 UI (월간/주간 뷰)
  - `app/(tabs)/index.tsx` — 에러 카드 UI (다가오는 일정 섹션)
