-- ==============================================
-- 스케줄 타임존 버그 수정: UTC → 로컬 타임존(KST) 변환
--
-- 문제: 앱에서 .toISOString()으로 UTC 변환 후 저장했으나,
--       조회 시 로컬 날짜 문자열로 필터링하여 불일치 발생.
-- 해결: 기존 UTC 데이터를 KST(+9시간)로 변환하고,
--       컬럼 타입을 TIMESTAMP (without time zone)로 변경.
--       이후 앱에서는 toLocalISOString()으로 로컬 시간 그대로 저장.
-- ==============================================

-- 1) 기존 UTC 데이터를 KST로 변환 (UTC+9)
UPDATE schedules
SET
  start_date = start_date AT TIME ZONE 'Asia/Seoul',
  end_date = CASE WHEN end_date IS NOT NULL
    THEN end_date AT TIME ZONE 'Asia/Seoul'
    ELSE NULL END,
  recurrence_end_date = CASE WHEN recurrence_end_date IS NOT NULL
    THEN recurrence_end_date AT TIME ZONE 'Asia/Seoul'
    ELSE NULL END;

-- 2) 컬럼 타입을 TIMESTAMP (without time zone)로 변경
--    더 이상 DB 레벨에서 타임존 변환이 일어나지 않음
ALTER TABLE schedules
  ALTER COLUMN start_date TYPE TIMESTAMP WITHOUT TIME ZONE,
  ALTER COLUMN end_date TYPE TIMESTAMP WITHOUT TIME ZONE,
  ALTER COLUMN recurrence_end_date TYPE TIMESTAMP WITHOUT TIME ZONE;

-- 3) schedule_exceptions의 modified_fields 내 날짜도
--    JSONB이므로 앱 레벨에서 처리 (별도 마이그레이션 불필요)

-- 4) created_at, updated_at은 시스템 타임스탬프이므로 TIMESTAMPTZ 유지
