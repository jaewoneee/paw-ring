# 프로젝트 개선 목록

> 2026-03-10 프로젝트 전반 리뷰 기반

## 범례

- ⬜ 미착수
- 🔧 진행중
- ✅ 완료

---

## 1. 안정성

> 에러 처리, 부분 실패 대응

| # | 항목 | 상태 |
|---|------|------|
| 1.1 | `schedule.ts`의 `.catch(() => {})` 9곳에 `console.warn` 추가 | ✅ |
| 1.2 | `notificationScheduler.ts`의 `.catch(() => {})` 2곳에 `console.warn` 추가 | ✅ |
| 1.3 | `calendar.tsx` 알림 설정 로드 `.catch(() => {})` 개선 | ✅ |
| 1.4 | 홈 화면 — 데이터 로딩 실패 시 에러 상태 UI 추가 | ✅ |
| 1.5 | 캘린더 화면 — 데이터 로딩 실패 시 에러 상태 UI 추가 | ✅ |
| 1.6 | PetContext `Promise.all` 부분 실패 처리 (하나 실패해도 나머지 유지) | ✅ |

---

## 2. 코드 품질

> 타입 안전성, 보안, 데드 코드 정리

| # | 항목 | 상태 |
|---|------|------|
| 2.1 | FontAwesome 아이콘 `as any` 타입 단언 제거 (5개 파일) | ✅ (Lucide 마이그레이션으로 해소) |
| 2.2 | PetContext 공유 반려동물 `species: "dog" as const` 하드코딩 해소 | ⬜ |
| 2.3 | ScheduleCategory 타입을 union literal로 강화 | ⬜ |
| 2.4 | Supabase URL 콘솔 로깅 제거 | ✅ |
| 2.5 | `index.tsx` 주석 처리된 "내 반려동물" 섹션 제거 | ⬜ |
| 2.6 | 홈 화면 알림 버튼 주석 처리 (Phase 2 원격 알림 때 활성화) | ✅ |

---

## 3. UI/UX

> 상세: [uiux.md](./uiux.md)
>
> 접근성, 디자인 시스템, 로딩 스켈레톤, 다크 모드 색상 보정

| # | 항목 | 상태 |
|---|------|------|
| 3.1 | 터치 타겟 44px 미만 버튼 확대 | ✅ |
| 3.2 | 인터랙티브 요소에 accessibilityLabel/Role 추가 | ✅ |
| 3.3 | Typography 스케일 정리 (body-xl/body-lg 중복 해소, caption 추가) | ✅ |
| 3.4 | 인라인 fontSize → Typography 마이그레이션 (7개 파일) | ✅ |
| 3.5 | 미사용 Text import 정리 | ✅ |
| 3.6 | 공통 Skeleton 컴포넌트 생성 및 화면별 적용 | ✅ |
| 3.7 | 다크 모드 카테고리 색상 가독성 보정 | ✅ |

---

## 4. 성능

> 렌더링 최적화, 서버 데이터 캐싱
>
> TanStack Query 상세: [tanstack-query.md](./tanstack-query.md)

| # | 항목 | 상태 |
|---|------|------|
| 4.1 | 자주 리렌더되는 리스트 아이템에 React.memo 적용 (ScheduleItem) | ✅ |
| 4.2 | 400줄 이상 대형 컴포넌트 분리 검토 → 현 단계에서 불필요 판단 | ✅ |
| 4.3 | TanStack Query 도입 — 서버 데이터 캐싱 및 자동 refetch 체계화 | ✅ |
