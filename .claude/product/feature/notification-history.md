# 알림 내역 (Notification History)

## 개요

- 수신한 알림을 앱 내에서 확인할 수 있는 알림 내역 기능
- Phase 1(가벼운 버전)에서 기본 목록/읽음 처리, Phase 2(풍성한 버전)에서 뱃지·딥링크·필터로 확장

## 목적

- 푸시 알림을 놓쳤을 때 앱 내에서 다시 확인 가능
- 알림 이력을 통해 돌봄 활동 흐름 파악
- 공유 캘린더의 초대/변경 알림도 한 곳에서 관리

## 기술 스택

- **프론트엔드**: Expo (React Native) + TypeScript
- **DB**: Supabase (PostgreSQL)
- **데이터 아키텍처**: [data-architecture.md](../data-architecture.md) 참고

## Phase 1 - 기본 (가벼운 버전)

### 기능 요구사항

- [x] 알림 내역 화면 (최신순 리스트)
- [x] 알림 읽음 처리 (탭 시 읽음 표시)
- [x] 알림 전체 읽음 처리
- [x] 알림 생성 시 notifications 테이블에 저장
- [x] 오래된 알림 자동 정리 (30일 이상)

### 알림 종류

| 타입 | 설명 | 트리거 |
|------|------|--------|
| `schedule_reminder` | 스케줄 알림 | 스케줄 리마인더 시간 도달 시 |
| `share_invite` | 캘린더 공유 초대 | 다른 사용자가 캘린더 공유 시 |
| `share_accepted` | 공유 수락 알림 | 초대받은 사용자가 수락 시 |

### 화면 구성

```
┌─────────────────────────┐
│  알림                    │
│            [전체 읽음]    │
│                         │
│  오늘                    │
│  ┌─────────────────────┐│
│  │ 🔔 코코 산책 시간!    ││
│  │ 오후 3:00 · 5분 전    ││
│  ├─────────────────────┤│
│  │ 🔔 코코 저녁 식사     ││
│  │ 오후 6:00 · 읽음      ││
│  └─────────────────────┘│
│                         │
│  어제                    │
│  ┌─────────────────────┐│
│  │ 👥 김OO님이 캘린더    ││
│  │ 공유를 요청했습니다    ││
│  └─────────────────────┘│
│                         │
└─────────────────────────┘
```

## Phase 2 - 확장 (풍성한 버전)

### 기능 요구사항

- [ ] 탭 바 알림 뱃지 (안 읽은 알림 수 표시)
- [ ] 알림 탭에서 해당 스케줄/캘린더로 딥링크 이동
- [ ] 알림 종류별 필터 (스케줄 알림 / 공유 알림)
- [ ] 알림 개별 삭제 (스와이프)

## 데이터 모델

### notifications 테이블

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- 'schedule_reminder' | 'share_invite' | 'share_accepted'
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',              -- 타입별 추가 데이터 (schedule_id, pet_id, invite_id 등)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### data 필드 예시

```typescript
// schedule_reminder
{ scheduleId: string; petId: string; occurrenceDate: string }

// share_invite
{ inviteId: string; petId: string; inviterName: string }

// share_accepted
{ petId: string; accepterName: string }
```

### TypeScript 타입

```typescript
type NotificationType = 'schedule_reminder' | 'share_invite' | 'share_accepted';

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}
```

## 아키텍처 설계

### Frontend

```
app/
├── notifications.tsx            # 알림 내역 화면

components/
├── notification/
│   └── NotificationItem.tsx     # 알림 항목 컴포넌트

services/
├── notificationHistory.ts       # 알림 내역 CRUD (Supabase)

hooks/
├── useNotificationHistory.ts    # 알림 내역 React Query 훅
```

### 연동 포인트

- 스케줄 알림 발송 시 → `notifications` 테이블에 레코드 삽입
- 공유 초대/수락 시 → `notifications` 테이블에 레코드 삽입
- 알림 화면 진입 시 → 목록 조회 + 읽음 처리

## 예외 처리

| 상황 | 대응 |
|------|------|
| 알림 내역이 비어있음 | "아직 알림이 없습니다" 안내 화면 |
| 네트워크 오류 | 에러 메시지 + 재시도 버튼 |

## 구현 순서

### Phase 1: 기본

1. Supabase 마이그레이션 (notifications 테이블)
2. 알림 내역 서비스 (CRUD)
3. 알림 내역 화면 UI
4. 기존 알림 발송 로직에 DB 저장 연동
5. 읽음 처리

### Phase 2: 확장

1. 탭 바 뱃지
2. 딥링크 이동
3. 필터 기능
4. 스와이프 삭제
