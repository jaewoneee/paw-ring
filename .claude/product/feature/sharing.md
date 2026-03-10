# 캘린더 공유

## 개요
- 반려동물 캘린더를 다른 유저와 공유하여 함께 스케줄을 확인/관리하는 기능
- 공동 돌봄 시나리오 지원 (가족, 펫시터 등)

## 목적
- 한 반려동물을 여러 사람이 돌보는 경우, 스케줄을 공유하여 중복/누락 방지
- 공유 권한(열람/편집)을 분리하여 유연한 협업 지원

## 기술 스택
- **프론트엔드**: Expo (React Native) + TypeScript
- **인증**: Firebase Auth (기존 유지)
- **DB**: Supabase (PostgreSQL)
- **초대 방식**: 딥링크 (expo-linking) 또는 이메일 검색
- **원격 알림**: Supabase Edge Functions + FCM (공유 대상자 알림)
- **데이터 아키텍처**: [data-architecture.md](../data-architecture.md) 참고

## 사용자 시나리오

### 시나리오 1: 캘린더 공유 초대
1. 캘린더 소유자가 캘린더 설정에서 "공유" 메뉴를 연다
2. "멤버 초대"를 누른다
3. 초대 방식을 선택한다:
   - **이메일 검색**: 상대방 이메일을 입력하여 검색
   - **초대 링크**: 공유 가능한 링크 생성 → 메신저/카카오톡 등으로 전달
4. 권한을 선택한다: 열람만 / 편집 가능
5. 초대가 발송된다

### 시나리오 2: 공유 초대 수락
1. 초대받은 유저에게 앱 내 알림 또는 딥링크로 초대가 도착
2. "테오의 캘린더에 초대되었습니다" 화면 표시
3. "수락"을 누르면 내 캘린더 목록에 "공유받은 캘린더" 섹션에 추가
4. "거절"을 누르면 초대 삭제

### 시나리오 3: 공유 캘린더 사용
1. 공유받은 유저가 메인 화면에서 "공유받은 반려동물" 섹션의 캘린더를 선택
2. 열람 권한: 스케줄 조회만 가능, 완료 체크 가능
3. 편집 권한: 스케줄 조회 + 생성/수정/삭제 + 완료 체크 가능

### 시나리오 4: 공유 멤버 관리
1. 캘린더 소유자가 공유 설정에서 멤버 목록을 확인
2. 멤버별 권한 변경 가능 (열람 ↔ 편집)
3. 멤버 내보내기 (공유 해제) 가능

### 시나리오 5: 공유 나가기
1. 공유받은 유저가 해당 캘린더 설정에서 "나가기"를 누른다
2. 확인 후 공유 관계가 삭제되고, 내 목록에서 제거된다

## 주요 기능 요구사항

### 공유 초대
- [x] 이메일 검색으로 유저 찾기
- [x] 초대 링크 생성 (딥링크)
- [x] 권한 선택 (열람 / 편집)
- [ ] 초대 발송 (앱 내 알림)

### 초대 수락/거절
- [ ] 앱 내 초대 알림 표시
- [x] 딥링크로 초대 화면 진입
- [x] 수락 시 공유 캘린더 목록에 추가
- [x] 거절 시 초대 삭제

### 공유 권한
- [x] 열람 (viewer): 스케줄 조회, 완료 체크
- [x] 편집 (editor): 스케줄 CRUD + 완료 체크
- [x] 소유자 (owner): 모든 권한 + 멤버 관리 + 삭제

### 멤버 관리
- [x] 공유 멤버 목록 조회
- [x] 멤버 권한 변경
- [x] 멤버 내보내기 (소유자만)
- [ ] 공유 나가기 (공유받은 유저)

## 화면 구성

### 1. 캘린더 공유 설정
```
┌─────────────────────────┐
│  ← 테오 캘린더 공유       │
│                         │
│  소유자                   │
│  ┌─────────────────────┐│
│  │ 👤 나 (김OO)  owner  ││
│  └─────────────────────┘│
│                         │
│  멤버                    │
│  ┌─────────────────────┐│
│  │ 👤 이OO      편집 ▼  ││
│  │              [내보내기]││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 👤 박OO      열람 ▼  ││
│  │              [내보내기]││
│  └─────────────────────┘│
│                         │
│  [+ 멤버 초대]            │
│                         │
└─────────────────────────┘
```

### 2. 멤버 초대 화면
```
┌─────────────────────────┐
│  ← 멤버 초대             │
│                         │
│  이메일로 초대             │
│  ┌───────────────────┐  │
│  │ 이메일 입력         │  │
│  └───────────────────┘  │
│  [검색]                  │
│                         │
│  ──── 또는 ────          │
│                         │
│  [🔗 초대 링크 복사]      │
│                         │
│  권한 설정                │
│  ( 열람만 ) ( 편집 가능 )  │
│                         │
└─────────────────────────┘
```

### 3. 초대 수락 화면
```
┌─────────────────────────┐
│                         │
│      🐾                 │
│                         │
│  김OO님이 테오의 캘린더에  │
│  초대했습니다              │
│                         │
│  권한: 편집 가능           │
│                         │
│  [     수락하기       ]   │
│  [     거절하기       ]   │
│                         │
└─────────────────────────┘
```

## 아키텍처 설계

### Frontend

```
app/
├── pet/
│   └── [petId]/
│       ├── sharing.tsx               # 공유 설정 화면
│       └── invite.tsx                # 멤버 초대 화면
├── invite/
│   └── [inviteId].tsx                # 초대 수락/거절 (딥링크 진입)

services/
├── sharing.ts                        # 공유 관련 CRUD (Supabase)
├── invite.ts                         # 초대 생성/수락/거절 (Supabase)

hooks/
├── useSharedCalendars.ts             # 공유받은 캘린더 목록 훅
├── useCalendarMembers.ts             # 캘린더 멤버 목록 훅
```

## 데이터 모델

### Supabase: `calendar_shares` 테이블
```sql
CREATE TABLE calendar_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id),
  shared_user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pet_id, shared_user_id)
);
```

### Supabase: `invites` 테이블 (링크 초대용)
```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 0,              -- 0 = 무제한
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript 인터페이스
```typescript
interface CalendarShare {
  id: string;
  pet_id: string;
  owner_id: string;
  shared_user_id: string;
  role: 'viewer' | 'editor';
  status: 'pending' | 'accepted';
  created_at: string;
  updated_at: string;
  // JOIN으로 가져오는 필드
  pet?: { name: string };
  owner?: { nickname: string };
  shared_user?: { nickname: string };
}

interface Invite {
  id: string;
  pet_id: string;
  owner_id: string;
  role: 'viewer' | 'editor';
  expires_at: string;
  max_uses: number;
  use_count: number;
  created_at: string;
}
```

### RLS 정책
```sql
-- 소유자 또는 공유 대상 유저만 읽기
CREATE POLICY "Share read access"
  ON calendar_shares FOR SELECT
  USING (owner_id = auth.uid() OR shared_user_id = auth.uid());

-- 소유자만 생성/삭제
CREATE POLICY "Share owner write"
  ON calendar_shares FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Share owner delete"
  ON calendar_shares FOR DELETE USING (owner_id = auth.uid());

-- 공유 대상 유저는 status만 변경 가능 (수락/거절)
CREATE POLICY "Share accept/reject"
  ON calendar_shares FOR UPDATE
  USING (shared_user_id = auth.uid());

-- 초대 링크: 인증된 유저 읽기 가능
CREATE POLICY "Invite read"
  ON invites FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Invite owner create"
  ON invites FOR INSERT WITH CHECK (owner_id = auth.uid());
```

## 예외 처리

| 상황 | 대응 |
|------|------|
| 이메일 검색 - 유저 없음 | "해당 이메일로 가입된 유저가 없습니다" |
| 이미 공유된 유저에게 재초대 | "이미 공유 중인 멤버입니다" |
| 자기 자신에게 초대 | "본인에게는 초대할 수 없습니다" |
| 초대 링크 만료 | "초대가 만료되었습니다. 소유자에게 새 초대를 요청해주세요" |
| 초대 링크 사용 횟수 초과 | "초대 링크가 더 이상 유효하지 않습니다" |
| 공유 캘린더 소유자가 반려동물 삭제 | 공유 자동 해제, 공유 유저에게 알림 |
| 편집 권한 없이 수정 시도 | "편집 권한이 없습니다. 소유자에게 요청해주세요" |

## 구현 순서

### Phase 1: 이메일 초대 + 기본 공유
1. Supabase `calendar_shares` 테이블 생성
2. 이메일 검색으로 유저 찾기
3. 초대 생성 + 수락/거절
4. 공유받은 캘린더 목록 표시
5. 공유 캘린더 열람 (viewer 권한)
6. 공유 캘린더 편집 (editor 권한)

### Phase 2: 링크 초대 + 멤버 관리
1. 초대 링크 생성 (딥링크)
2. 링크로 초대 수락 플로우
3. 멤버 권한 변경
4. 멤버 내보내기 / 나가기
5. 공유 관련 알림 (Supabase Edge Functions + FCM)
