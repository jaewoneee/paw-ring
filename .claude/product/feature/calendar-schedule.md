# 캘린더 / 스케줄

## 개요
- 반려동물 단위로 캘린더를 관리하며, 반복 스케줄을 생성/조회/수정/삭제하는 핵심 기능
- 1 반려동물 = 1 캘린더, 캘린더 내에 여러 스케줄 존재

## 목적
- 반려동물 돌봄 일정을 체계적으로 관리 (산책, 식사, 병원, 약 투여 등)
- 반복 스케줄로 정기적 돌봄 루틴 자동화
- 월간/주간/일간 뷰로 직관적인 일정 확인

## 기술 스택
- **프론트엔드**: Expo (React Native) + TypeScript
- **캘린더 UI**: react-native-calendars 또는 커스텀 구현
- **인증**: Firebase Auth (기존 유지)
- **DB**: Supabase (PostgreSQL)
- **반복 로직**: rrule (RFC 5545 기반 반복 규칙 라이브러리)
- **데이터 아키텍처**: [data-architecture.md](../data-architecture.md) 참고

## 사용자 시나리오

### 시나리오 1: 단건 스케줄 생성
1. 사용자가 반려동물 캘린더 화면에 진입한다
2. 특정 날짜를 탭하거나 "+" 버튼을 누른다
3. 스케줄 생성 화면이 표시된다
4. 제목, 카테고리, 날짜/시간을 입력한다
5. 알림 설정을 선택한다 (없음 / 정시 / 10분 전 / 30분 전 / 1시간 전)
6. "저장" 버튼을 누르면 스케줄이 생성된다
7. 캘린더에 해당 스케줄이 표시된다

### 시나리오 2: 반복 스케줄 생성
1. 스케줄 생성 화면에서 "반복" 옵션을 선택한다
2. 반복 주기를 설정한다: 매일 / 매주 (요일 선택) / 격주 / 매월 (날짜 선택)
3. 반복 종료 조건을 설정한다: 종료 없음 / 특정 날짜까지 / N회 반복
4. "저장"하면 반복 규칙이 저장되고, 캘린더에 반복 스케줄이 표시된다

### 시나리오 3: 캘린더 조회
1. 반려동물을 선택하면 해당 캘린더가 표시된다
2. 기본은 월간 뷰 — 날짜별 스케줄 dot 표시
3. 특정 날짜를 탭하면 일간 뷰로 전환 — 해당 날짜 스케줄 리스트 표시
4. 주간 뷰 전환도 가능

### 시나리오 4: 스케줄 수정
1. 스케줄을 탭하여 상세 화면으로 진입한다
2. "수정"을 누른다
3. 반복 스케줄인 경우 선택지 표시:
   - "이 일정만 수정"
   - "이후 모든 일정 수정"
4. 수정 후 저장한다

### 시나리오 5: 스케줄 삭제
1. 스케줄 상세에서 "삭제"를 누른다
2. 반복 스케줄인 경우 선택지 표시:
   - "이 일정만 삭제"
   - "이후 모든 일정 삭제"
3. 확인 후 삭제한다

### 시나리오 6: 스케줄 완료 체크
1. 캘린더 일간 뷰에서 스케줄 항목 왼쪽 체크박스를 탭한다
2. 해당 날짜의 해당 스케줄이 "완료" 상태로 변경된다
3. 완료된 스케줄은 시각적으로 구분된다 (취소선, 흐림 등)

### 시나리오 7: 미실행 스케줄 리마인더
1. 하루가 지나도 완료 체크되지 않은 스케줄이 있으면
2. 다음날 아침 지정 시간(예: 09:00)에 미실행 리마인더 푸시 알림이 발송된다
   - "🐾 어제 [스케줄 제목]을(를) 놓쳤어요! 확인해주세요"
3. 알림을 탭하면 해당 스케줄 상세 화면으로 이동한다
4. 사용자는 두 가지 선택을 할 수 있다:
   - **"지금 완료 처리"**: 해당 날짜의 스케줄을 완료로 표시
   - **"무시"**: 해당 날짜의 스케줄을 무시(dismiss)로 표시하여 더 이상 리마인더 발송 안 함

### 시나리오 8: 스케줄 무시 처리
1. 일간 뷰에서 미완료 스케줄을 길게 누르거나 스와이프한다
2. "무시" 옵션이 표시된다
3. "무시"를 탭하면 해당 날짜의 스케줄이 무시 상태로 변경된다
4. 무시된 스케줄은 시각적으로 구분된다 (흐림 + "무시됨" 라벨)
5. 무시된 스케줄에 대해서는 미실행 리마인더 알림이 발송되지 않는다

## 주요 기능 요구사항

### 캘린더
- [ ] 반려동물 선택 시 해당 캘린더 자동 로드
- [ ] 월간 뷰 (dot 표시)
- [ ] 주간 뷰
- [ ] 일간 뷰 (스케줄 리스트)
- [ ] 뷰 간 전환

### 스케줄 생성
- [x] 제목 (필수)
- [x] 카테고리 선택 (산책, 식사, 병원, 약 투여, 목욕, 기타)
- [x] 날짜/시간 선택 (시작 날짜 + 종료 날짜)
- [x] 메모 (선택)
- [x] 알림 설정 (없음 / 정시 / 10분 전 / 30분 전 / 1시간 전)

### 반복 스케줄
- [x] 반복 주기: 매일 / 매주 (요일 선택) / 격주 / 매월 (커스텀 N일마다는 미구현)
- [x] 반복 종료: 종료 없음 / 특정 날짜까지 (횟수 제한은 미구현)
- [x] 반복 규칙 저장 (rrule 기반)
- [x] 캘린더에 반복 스케줄 가상 인스턴스 렌더링

### 스케줄 수정
- [ ] 단건 수정 (반복 스케줄의 특정 날짜만 예외 처리)
- [ ] 이후 전체 수정 (반복 규칙 변경)

### 스케줄 삭제
- [ ] 단건 삭제 (예외 날짜로 등록)
- [ ] 이후 전체 삭제 (반복 종료일 변경)

### 스케줄 완료
- [ ] 날짜별 완료 체크/해제
- [ ] 완료 상태 시각적 구분

### 스케줄 실행 추적 (미실행 관리)
- [ ] 미실행 스케줄 감지 (하루가 지나도 완료/무시되지 않은 스케줄)
- [ ] 스케줄 무시(dismiss) 처리 (길게 누르기 또는 스와이프)
- [ ] 무시 상태 시각적 구분 (흐림 + "무시됨" 라벨)
- [ ] 미실행 리마인더 푸시 알림 발송 (다음날 아침)
- [ ] 알림에서 "완료 처리" / "무시" 액션 선택
- [ ] 미실행 스케줄 모아보기 (선택)

### 스케줄 카테고리
- [ ] 기본 카테고리: 산책, 식사, 병원, 약 투여, 목욕, 기타
- [ ] 카테고리별 색상/아이콘
- [ ] 카테고리별 필터링

## 화면 구성

### 1. 캘린더 월간 뷰
```
┌─────────────────────────┐
│  ← 테오의 캘린더     ⚙️  │
│                         │
│  < 2026년 3월 >          │
│  일  월  화  수  목  금  토 │
│                    1   2 │
│   3   4   5   6   7   8  9 │
│      ●       ●   ●       │
│  10  11  12  13  14  15 16 │
│  ●           ●           │
│  17  18  19  20  21  22 23 │
│       ●       ●       ●  │
│  24  25  26  27  28  29 30 │
│  31                      │
│                         │
│  ● 산책  ● 병원  ● 식사   │
│                         │
│              [+]        │
└─────────────────────────┘
```

### 2. 캘린더 일간 뷰 (날짜 탭 시)
```
┌─────────────────────────┐
│  ← 테오의 캘린더     ⚙️  │
│                         │
│  3월 7일 (금)            │
│                         │
│  ┌─────────────────────┐│
│  │ ☐ 🦮 오전 산책       ││
│  │    08:00 | 반복: 매일 ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ ☑ 🍚 아침 식사       ││
│  │    09:00 | 반복: 매일 ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ ── 🏥 예방접종 무시됨 ││
│  │    14:00 | 단건      ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ ☐ 🦮 저녁 산책       ││
│  │    18:00 | 반복: 매일 ││
│  └─────────────────────┘│
│                         │
│  ☐ 미완료  ☑ 완료  ── 무시 │
│              [+]        │
└─────────────────────────┘
```

> **스케줄 상태 3가지**: 미완료(☐) / 완료(☑) / 무시(──)
> - 완료: 체크박스 탭
> - 무시: 길게 누르기 또는 왼쪽 스와이프 → "무시" 버튼

### 3. 스케줄 생성/수정 화면
```
┌─────────────────────────┐
│  ← 취소        저장      │
│                         │
│      스케줄 추가          │
│                         │
│  ┌───────────────────┐  │
│  │ 제목 *             │  │
│  └───────────────────┘  │
│                         │
│  카테고리                 │
│  (🦮산책)(🍚식사)(🏥병원) │
│  (💊약)(🛁목욕)(📌기타)   │
│                         │
│  ┌───────────────────┐  │
│  │ 날짜    2026.03.07  │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 시간    08:00       │  │
│  └───────────────────┘  │
│                         │
│  반복                    │
│  (안함)(매일)(매주)(격주)  │
│  (매월)(커스텀)           │
│                         │
│  반복 종료               │
│  (종료없음)(날짜지정)(횟수) │
│                         │
│  알림                    │
│  (없음)(정시)(10분전)     │
│  (30분전)(1시간전)        │
│                         │
│  ┌───────────────────┐  │
│  │ 메모               │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

## 아키텍처 설계

### Frontend

```
app/
├── pet/
│   └── [petId]/
│       ├── calendar.tsx          # 캘린더 뷰 (월간/주간/일간)
│       └── schedule/
│           ├── create.tsx        # 스케줄 생성
│           ├── [scheduleId].tsx  # 스케줄 상세
│           └── edit.tsx          # 스케줄 수정

components/
├── calendar/
│   ├── MonthView.tsx             # 월간 뷰 컴포넌트
│   ├── WeekView.tsx              # 주간 뷰 컴포넌트
│   ├── DayView.tsx               # 일간 뷰 (스케줄 리스트)
│   ├── ScheduleItem.tsx          # 스케줄 항목 (체크박스 포함)
│   └── CategoryBadge.tsx         # 카테고리 뱃지

services/
├── schedule.ts                   # 스케줄 CRUD (Supabase)
├── recurrence.ts                 # 반복 규칙 처리 (rrule 래핑)

hooks/
├── useCalendar.ts                # 캘린더 데이터 조회 훅
├── useSchedules.ts               # 특정 기간 스케줄 조회 훅
```

### 반복 스케줄 처리 방식

반복 스케줄은 **규칙 기반**(rrule)으로 저장하고, 클라이언트에서 가상 인스턴스를 생성한다.

```
[저장] 반복 규칙 (rrule) + 예외 목록
  ↓
[렌더링] 표시 기간에 대해 rrule로 날짜 목록 계산
  ↓
[예외 처리] 수정/삭제된 개별 인스턴스 적용
  ↓
[완료 체크] 날짜별 완료 상태 별도 저장
```

## 데이터 모델

### Supabase: `schedules` 테이블
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',  -- 'walk','meal','hospital','medicine','bath','other'
  memo TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,                    -- 다일(multi-day) 스케줄 종료일 (null이면 단일 날짜)
  is_all_day BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  rrule TEXT,                              -- RFC 5545 반복 규칙 (e.g. "FREQ=DAILY;INTERVAL=1")
  recurrence_end_date TIMESTAMPTZ,
  reminder TEXT DEFAULT 'none',            -- 'none','on_time','10min','30min','1hour'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Supabase: `schedule_exceptions` 테이블
```sql
-- 반복 스케줄에서 특정 날짜만 수정/삭제한 경우
CREATE TABLE schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('modified', 'deleted')),
  modified_fields JSONB,                   -- 수정된 필드 (type='modified')
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (schedule_id, exception_date)
);
```

### Supabase: `schedule_completions` 테이블
```sql
-- 날짜별 실행 상태 (완료 또는 무시)
CREATE TABLE schedule_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'dismissed')),
  completed_by TEXT NOT NULL REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (schedule_id, completion_date)
);
```
> `status` 필드: `completed`(완료) 또는 `dismissed`(무시)
> - 완료도 무시도 아닌 스케줄 = 미실행 → 리마인더 알림 대상

### TypeScript 인터페이스
```typescript
interface Schedule {
  id: string;
  pet_id: string;
  owner_id: string;
  title: string;
  category: ScheduleCategory;
  memo: string | null;
  start_date: string;
  end_date: string | null;
  is_all_day: boolean;
  is_recurring: boolean;
  rrule: string | null;
  recurrence_end_date: string | null;
  reminder: ReminderType;
  created_at: string;
  updated_at: string;
}

type ScheduleCategory = 'walk' | 'meal' | 'hospital' | 'medicine' | 'bath' | 'other';
type ReminderType = 'none' | 'on_time' | '10min' | '30min' | '1hour';
type CompletionStatus = 'completed' | 'dismissed';

interface ScheduleCompletion {
  id: string;
  schedule_id: string;
  completion_date: string;
  status: CompletionStatus;
  completed_by: string;
  completed_at: string;
}
```

### RLS 정책
```sql
-- 소유자 또는 공유받은 유저 읽기 가능
CREATE POLICY "Schedule read access"
  ON schedules FOR SELECT
  USING (
    owner_id = auth.uid()
    OR pet_id IN (
      SELECT pet_id FROM calendar_shares
      WHERE shared_user_id = auth.uid() AND status = 'accepted'
    )
  );

-- 소유자만 쓰기
CREATE POLICY "Schedule write access"
  ON schedules FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Schedule update access"
  ON schedules FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Schedule delete access"
  ON schedules FOR DELETE USING (owner_id = auth.uid());
```

## 예외 처리

| 상황 | 대응 |
|------|------|
| 제목 미입력 | "제목을 입력해주세요" |
| 날짜/시간 미선택 | "날짜와 시간을 선택해주세요" |
| 과거 날짜에 스케줄 생성 | 허용 (기록 목적) |
| 반복 종료일 < 시작일 | "반복 종료일은 시작일 이후여야 합니다" |
| 반복 스케줄 수정 시 | "이 일정만 / 이후 모든 일정" 선택지 표시 |
| 반복 스케줄 삭제 시 | "이 일정만 / 이후 모든 일정" 선택지 표시 |
| 네트워크 오류 | "네트워크 연결을 확인해주세요" |
| 이미 무시한 스케줄을 다시 활성화 | 무시 해제 → 미완료 상태로 복귀 |
| 과거 날짜 스케줄 무시 | 허용 (과거 스케줄도 무시 가능) |
| 미실행 리마인더 알림 반복 발송 | 1회만 발송 (무시/완료 처리 전까지) |

## 구현 순서

### Phase 1: 캘린더 뷰 + 단건 스케줄
1. 캘린더 월간 뷰 UI
2. 일간 뷰 (날짜 탭 시 스케줄 리스트)
3. 단건 스케줄 생성 화면 + Supabase 연동
4. 스케줄 상세 / 수정 / 삭제
5. 카테고리 시스템 (기본 카테고리 + 색상/아이콘)

### Phase 2: 반복 스케줄
1. rrule 라이브러리 연동
2. 반복 스케줄 생성 UI
3. 캘린더에 반복 인스턴스 렌더링
4. 반복 스케줄 수정 (단건/이후 전체)
5. 반복 스케줄 삭제 (단건/이후 전체)

### Phase 3: 완료 체크 + 실행 추적 + 주간 뷰
1. 스케줄 완료 체크/해제
2. 스케줄 무시(dismiss) 처리
3. 미실행 스케줄 감지 로직
4. 미실행 리마인더 알림 연동 (push-notification과 연계)
5. 주간 뷰 구현
6. 카테고리 필터링
