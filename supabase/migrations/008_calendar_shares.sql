-- 캘린더 공유 테이블
CREATE TABLE IF NOT EXISTS calendar_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pet_id, shared_user_id)
);

-- 인덱스
CREATE INDEX idx_calendar_shares_owner ON calendar_shares(owner_id);
CREATE INDEX idx_calendar_shares_shared_user ON calendar_shares(shared_user_id);
CREATE INDEX idx_calendar_shares_pet ON calendar_shares(pet_id);

-- 초대 링크 테이블
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 0,        -- 0 = 무제한
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_invites_pet ON invites(pet_id);
CREATE INDEX idx_invites_owner ON invites(owner_id);
