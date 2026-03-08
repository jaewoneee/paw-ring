-- ==============================================
-- parent_schedule_id 컬럼 추가
-- 반복 스케줄 분열 시 원본 추적용
-- ==============================================

ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS parent_schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_schedules_parent ON schedules(parent_schedule_id);
