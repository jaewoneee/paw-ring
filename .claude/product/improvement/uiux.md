# UI/UX 개선

> UI/UX 관련 개선 사항을 통합 관리하는 문서

---

## 1. 로딩 스켈레톤 (2026-03-12)

### 문제

- 데이터 로딩 중 빈 화면 또는 기본(empty state) UI가 노출되어 사용자가 "데이터가 없는 것"으로 오해
- 일부 화면은 "로딩 중..." 텍스트만 표시하여 시각적 완성도가 낮음

### 해결

- 공통 `Skeleton` 컴포넌트 생성 (`components/ui/Skeleton.tsx`)
- 화면별 Skeleton 프리셋 컴포넌트 제공
- 애니메이션: pulse (opacity 0.4 ↔ 1, 800ms)

### 적용 화면

| 화면 | 컴포넌트 | 변경 내용 |
|------|----------|-----------|
| 홈 (다가오는 일정) | `HomeScheduleSkeleton` | 카드 3개 스켈레톤 (아바타 + 텍스트 라인) |
| 캘린더 (월간/주간 하단) | `DayScheduleSkeleton` | 일정 목록 2개 스켈레톤 (바 + 텍스트) |
| 스케줄 상세 | `ScheduleDetailSkeleton` | 상세 카드 + 버튼 스켈레톤 |
| 스케줄 수정 | `EditScheduleSkeleton` | 폼 필드 스켈레톤 |

### 기술 상세

- `Animated.loop` + `Animated.sequence`로 pulse 애니메이션 구현
- `useNativeDriver: true`로 성능 최적화
- 다크 모드 대응: `colors.border` 색상 사용
- pull-to-refresh 시에는 스켈레톤 미표시 (기존 데이터 유지)

---

## 2. 다크 모드 카테고리 색상 가독성 보정 (2026-03-12)

### 문제

- 사용자가 커스텀 카테고리에 어두운 색상을 지정했을 때, 다크 모드 배경(#0A0A0A)에서 색상이 거의 보이지 않음
- 아이콘, 테두리, 도트 마커 등 카테고리 색상이 사용되는 모든 곳에서 발생

### 해결

- `utils/color.ts` — `ensureReadableColor(hex, isDark)` 유틸 함수 생성
- `hooks/useCategories.ts` — `getCategoryMeta` 반환 시 자동 보정 적용
- 단일 진입점에서 처리하므로 모든 소비처(ScheduleItem, MonthCalendar, DayTimeGrid, 상세 등)에 자동 반영

### 보정 로직

1. WCAG 2.0 상대 밝기(relative luminance) 계산
2. 다크 배경 대비 **contrast ratio < 3** (WCAG AA UI 컴포넌트 기준)이면 보정 대상
3. HSL 색공간에서 lightness를 이진 탐색으로 올려 최소 contrast ratio 3을 달성
4. 밝은 색상은 그대로 통과 — 불필요한 변환 없음
