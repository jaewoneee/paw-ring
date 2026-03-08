# 날짜/시간 처리 정책

## 핵심 원칙

**스케줄 날짜는 로컬 타임존 기준으로 저장하고 조회한다.**

캘린더 앱에서 "오전 9시 산책"은 사용자의 로컬 시간 9시를 의미한다.
UTC 변환 없이 로컬 시간 그대로 DB에 저장한다.

## 날짜 분류

| 구분 | DB 타입 | 저장 형식 | 용도 |
|------|---------|-----------|------|
| 스케줄 날짜 | `TIMESTAMP` (without tz) | `2026-03-08T09:00:00` | start_date, end_date, recurrence_end_date |
| 날짜 키 | `DATE` | `2026-03-08` | completion_date, exception_date |
| 시스템 타임스탬프 | `TIMESTAMPTZ` | UTC ISO | created_at, updated_at, completed_at |

## 코드 규칙

### 스케줄 날짜 저장 시

```typescript
// ✅ 올바른 사용 — 로컬 시간 그대로 저장
import { toLocalISOString } from '@/utils/dayjs';
const startDate = toLocalISOString(dayjs(date).hour(9).minute(0).second(0));
// → "2026-03-08T09:00:00"

// ❌ 금지 — UTC 변환됨
const startDate = dayjs(date).toISOString();
// → "2026-03-08T00:00:00.000Z" (KST 9am → UTC midnight)
```

### 날짜 키 (completion_date, exception_date)

```typescript
// ✅ 올바른 사용
import { formatISODate } from '@/utils/dayjs';
const dateKey = formatISODate(dayjs()); // → "2026-03-08"
```

### 시스템 타임스탬프 (created_at, updated_at)

```typescript
// ✅ 올바른 사용 — UTC가 적합
const timestamp = new Date().toISOString();
```

### Supabase 쿼리 필터링

```typescript
// ✅ 올바른 사용 — 로컬 날짜 기준
const todayStr = formatISODate(dayjs()); // "2026-03-08"
supabase.from("schedules")
  .gte("start_date", `${todayStr}T00:00:00`)
  .lte("start_date", `${todayStr}T23:59:59`)
```

## 금지 사항

1. **스케줄 날짜에 `.toISOString()` 사용 금지** — 반드시 `toLocalISOString()` 사용
2. **`new Date()` 로 날짜 계산 금지** — 반드시 `dayjs()` 사용
3. **날짜 문자열에 `Z` suffix 또는 `+09:00` offset 포함 금지** — 로컬 시간은 오프셋 없이 저장
4. **`TIMESTAMPTZ`로 스케줄 날짜 컬럼 생성 금지** — `TIMESTAMP` (without time zone) 사용

## 유틸 함수 목록 (utils/dayjs.ts)

| 함수 | 출력 예시 | 용도 |
|------|-----------|------|
| `toLocalISOString()` | `2026-03-08T09:00:00` | DB 저장용 (스케줄 날짜) |
| `formatISODate()` | `2026-03-08` | 날짜 키, 쿼리 필터 |
| `formatKoreanDate()` | `2026년 3월 8일 (일)` | UI 표시 |
| `formatTime12()` | `오전 09:00` | UI 시간 표시 |
| `formatTime24()` | `09:00` | UI 시간 표시 |
