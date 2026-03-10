# 접근성 개선

## 2026-03-10: 터치 타겟 확대 및 접근성 라벨 추가

- **배경**: 프로젝트 리뷰에서 32~36px 크기의 터치 타겟 다수 발견, 접근성 라벨이 TabBar 외에는 전무
- **개선 내용**:
  - 아이콘 버튼 터치 타겟을 Apple HIG 권장 최소 크기(44px)에 맞춰 확대
  - 인터랙티브 요소에 `accessibilityLabel` + `accessibilityRole` 추가 (총 17개)
- **수정 파일**:
  - `calendar.tsx` — 카테고리/알림/공유 버튼 (w-8→w-10), FAB 접근성 라벨
  - `index.tsx` — 알림/다크모드/반려동물 선택 버튼 (w-9→w-11)
  - `MonthCalendar.tsx` — 이전/다음 달 버튼 (w-9→w-11)
  - `WeekCalendar.tsx` — 이전/다음 주 버튼 (w-9→w-11)
  - `ScheduleItem.tsx` — 체크박스 (w-7→w-8), 완료 버튼 (w-8→w-10)
  - `add-schedule.tsx`, `edit-schedule.tsx` — 요일 선택 (w-9→w-10)
  - `category-manage.tsx` — 색상 선택 (w-9→w-10)
