# 안정성 개선

## 2026-03-10: PetContext Promise.all 부분 실패 처리

- **배경**: `PetContext.refreshPets()`에서 `Promise.all`로 내 반려동물과 공유 반려동물을 동시 로딩하는데, 하나가 실패하면 전체가 실패하여 양쪽 데이터 모두 갱신되지 않음
- **개선 내용**:
  - `Promise.all` → `Promise.allSettled`로 변경
  - 하나가 실패해도 성공한 쪽 데이터는 정상 반영
  - 실패 시 기존 데이터(내 반려동물) 유지 또는 빈 배열(공유) 처리
  - 실패 원인을 `console.warn`으로 로깅
- **수정 파일**: `contexts/PetContext.tsx`
