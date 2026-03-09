-- 반려동물(캘린더) 단위 알림 ON/OFF 설정 테이블
CREATE TABLE IF NOT EXISTS pet_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  UNIQUE (pet_id, user_id)
);

-- 인덱스: 사용자별 조회
CREATE INDEX idx_pet_notification_settings_user_id ON pet_notification_settings(user_id);
