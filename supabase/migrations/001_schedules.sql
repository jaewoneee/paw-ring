-- ==============================================
-- Paw Ring: 캘린더/스케줄 테이블 생성
-- Supabase SQL Editor에서 실행
-- ==============================================

-- 1. schedules 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  memo TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  rrule TEXT,
  recurrence_end_date TIMESTAMPTZ,
  reminder TEXT DEFAULT 'none',              -- timed: 'none','on_time','5min','10min','15min','30min','1hour','1day'
                                              -- all-day: 'none','same_day_9am','1day_before_9am'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_pet_date ON schedules(pet_id, start_date);
CREATE INDEX IF NOT EXISTS idx_schedules_owner ON schedules(owner_id);

-- 2. schedule_exceptions 테이블 (Phase 2용, 미리 생성)
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('modified', 'deleted')),
  modified_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (schedule_id, exception_date)
);

-- 3. schedule_completions 테이블 (Phase 3용, 미리 생성)
CREATE TABLE IF NOT EXISTS schedule_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'dismissed')),
  completed_by TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (schedule_id, completion_date)
);
