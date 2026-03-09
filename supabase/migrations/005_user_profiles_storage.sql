-- ==============================================
-- Paw Ring: 사용자 프로필 이미지 Storage 버킷 생성
-- Supabase SQL Editor에서 실행
-- ==============================================

-- 1. user-profiles 버킷 생성 (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profiles', 'user-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 누구나 읽기 가능 (public bucket)
CREATE POLICY "User profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');

-- 3. 인증된 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-profiles'
  AND auth.role() = 'authenticated'
);

-- 4. 인증된 사용자는 자신의 이미지 삭제 가능
CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-profiles'
  AND auth.role() = 'authenticated'
);
