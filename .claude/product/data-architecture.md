# 데이터 아키텍처

## 개요

Paw Ring은 **Firebase Auth + Supabase (PostgreSQL)** 하이브리드 아키텍처를 사용한다.

- **인증 (Auth)**: Firebase Auth — 기존 이메일/구글 로그인 유지
- **서비스 데이터 (DB)**: Supabase (PostgreSQL) — 반려동물, 스케줄, 공유 등
- **이미지 저장**: Supabase Storage — 프로필 이미지, 반려동물 사진
- **푸시 알림**: expo-notifications (로컬) / Supabase Edge Functions + FCM (원격)

## 왜 이 구조인가?

| 결정 | 이유 |
|------|------|
| Firebase Auth 유지 | 이메일/구글 로그인 이미 구현 완료, 재작업 비용 제거 |
| Supabase DB 도입 | 관계형 DB로 반려동물-스케줄-공유 관계 처리에 유리 |
| Firestore 제거 | 서비스 데이터를 Supabase로 일원화하여 관리 포인트 축소 |

## 데이터 흐름

```
[사용자]
  │
  ├── 로그인/회원가입 ──→ Firebase Auth (기존 유지)
  │                         │
  │                         ▼
  │                    Firebase UID
  │                         │
  ├── 서비스 데이터 ────→ Supabase PostgreSQL
  │   (반려동물, 스케줄,      │
  │    공유, 설정 등)         ├── users (Firebase UID 기반)
  │                         ├── pets
  │                         ├── schedules
  │                         ├── calendar_shares
  │                         └── ...
  │
  └── 이미지 업로드 ────→ Supabase Storage
      (프로필, 반려동물)       └── /avatars, /pets
```

## 유저 동기화

Firebase Auth에서 회원가입/로그인 시 Supabase `users` 테이블에 레코드를 생성/조회한다.

```typescript
// Firebase Auth 회원가입 후
const firebaseUser = await createUserWithEmailAndPassword(auth, email, password);

// Supabase users 테이블에 동기화
await supabase.from('users').upsert({
  id: firebaseUser.user.uid,   // Firebase UID를 PK로 사용
  email: firebaseUser.user.email,
  nickname: nickname,
  provider: 'email',
});
```

## 보안 전략

### MVP 단계 (현재)
- Supabase `anon` 키 사용
- 클라이언트에서 Firebase UID를 기반으로 쿼리
- RLS(Row Level Security) 기본 정책 적용

### 프로덕션 단계 (향후)
- Firebase JWT → Supabase 커스텀 JWT 검증
- RLS에서 JWT의 `sub` claim으로 유저 식별
- Supabase Edge Functions로 서버사이드 로직 처리

### RLS 정책 예시
```sql
-- users: 본인 데이터만 접근
CREATE POLICY "Users can access own data"
  ON users FOR ALL
  USING (id = auth.uid());

-- pets: 소유자만 접근 (공유 기능 확장 시 수정)
CREATE POLICY "Pet owners can access own pets"
  ON pets FOR ALL
  USING (owner_id = auth.uid());

-- schedules: 반려동물 소유자만 접근
CREATE POLICY "Schedule access via pet ownership"
  ON schedules FOR ALL
  USING (
    pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
  );
```

## Supabase 테이블 구조

### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- Firebase Auth UID
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  profile_image TEXT,
  provider TEXT NOT NULL DEFAULT 'email',  -- 'email' | 'google'
  email_verified BOOLEAN DEFAULT FALSE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### pets
```sql
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat')),
  birth_date DATE NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### schedules
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
  rrule TEXT,                              -- RFC 5545 반복 규칙
  recurrence_end_date TIMESTAMPTZ,
  parent_schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,  -- 반복 분열 시 원본 ID
  is_completable BOOLEAN DEFAULT FALSE,    -- 완료 체크 가능 여부
  reminder TEXT DEFAULT 'none',            -- 'none','on_time','10min','30min','1hour'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### schedule_exceptions
```sql
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

### schedule_completions
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
> - `completed`: 스케줄 실행 완료
> - `dismissed`: 유저가 의도적으로 무시
> - 레코드 없음: 미실행 상태 → 리마인더 알림 대상

### calendar_shares
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

### invites
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

### pet_notification_settings
```sql
CREATE TABLE pet_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  UNIQUE (pet_id, user_id)
);
```

### fcm_tokens
```sql
CREATE TABLE fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, token)
);
```

## 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 인증 | Firebase Auth (이메일/비밀번호, Google OAuth) |
| 데이터베이스 | Supabase PostgreSQL |
| 이미지 저장 | Supabase Storage |
| 로컬 알림 | expo-notifications |
| 원격 알림 | Supabase Edge Functions + FCM |
| 프론트엔드 | Expo (React Native) + TypeScript |
| 상태 관리 | React Context |
| 디자인 | NativeWind v4 |

## 프로젝트 코드 구조 (데이터 레이어)

```
lib/
├── firebase.ts              # Firebase Auth 초기화 (기존 유지)
├── supabase.ts              # Supabase 클라이언트 초기화 (신규)

services/
├── auth.ts                  # Firebase Auth 래핑 함수 (기존 유지)
├── pet.ts                   # 반려동물 CRUD (Supabase)
├── schedule.ts              # 스케줄 CRUD (Supabase)
├── sharing.ts               # 공유 관련 CRUD (Supabase)
├── storage.ts               # 이미지 업로드 (Supabase Storage)
├── user.ts                  # 유저 프로필 CRUD (Supabase)
```
