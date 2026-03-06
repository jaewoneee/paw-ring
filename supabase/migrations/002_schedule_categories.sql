-- ==============================================
-- Paw Ring: 스케줄 카테고리 테이블 생성
-- Supabase SQL Editor에서 실행
-- ==============================================

-- 1. schedule_categories 테이블
CREATE TABLE IF NOT EXISTS schedule_categories (
  id TEXT PRIMARY KEY,                          -- 기본 카테고리: slug ('walk'), 커스텀: UUID
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  icon TEXT NOT NULL DEFAULT 'tag',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_categories_owner ON schedule_categories(owner_id);

-- 2. 기본 카테고리 시드 데이터
-- owner_id = '__system__' 으로 모든 사용자에게 공유되는 기본 카테고리
INSERT INTO schedule_categories (id, owner_id, name, color, icon, is_default, sort_order) VALUES
  ('walk',     '__system__', '산책', '#F59E0B', 'paw',         TRUE, 0),
  ('meal',     '__system__', '식사', '#22C55E', 'cutlery',     TRUE, 1),
  ('hospital', '__system__', '병원', '#EF4444', 'hospital-o',  TRUE, 2),
  ('medicine', '__system__', '약',   '#8B5CF6', 'medkit',      TRUE, 3),
  ('bath',     '__system__', '목욕', '#3B82F6', 'tint',        TRUE, 4),
  ('other',    '__system__', '기타', '#6B7280', 'tag',         TRUE, 5)
ON CONFLICT (id) DO NOTHING;
