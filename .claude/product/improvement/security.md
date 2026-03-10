# 보안 개선

## 2026-03-10: Supabase URL 콘솔 로깅 제거

- **배경**: `lib/supabase.ts`에서 Supabase URL을 `JSON.stringify`로 콘솔에 출력하고 있어 프로덕션 빌드에서도 URL이 노출됨
- **개선 내용**:
  - URL/Key 실제 값 대신 "configured"/"missing"만 출력하도록 변경
  - `__DEV__` 가드로 프로덕션 빌드에서는 로깅 완전 제거
- **수정 파일**: `lib/supabase.ts`
