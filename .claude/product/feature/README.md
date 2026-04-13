# feature/

기능별 상세 기획 문서. 화면 구성, 데이터 모델, 요구사항 체크리스트 등을 포함한다.

- 각 파일은 아래 기능 리스트의 항목과 1:1 대응
- 구현 완료된 항목은 `- [x]`, 미구현은 `- [ ]`로 표시

> **기술 스택**: Firebase Auth (인증) + Supabase PostgreSQL (서비스 데이터) + Supabase Storage (이미지)

## 범례

- ⬜ 미착수
- 🔧 진행중
- ✅ 완료

---

## 0. 디자인 시스템 (Design System)

| #   | 기능                                 | 상태 | 상세 문서                               |
| --- | ------------------------------------ | ---- | --------------------------------------- |
| 0.1 | 컬러 시스템 (포인트 컬러 + 다크모드) | ✅   | [../design/color.md](../design/color.md)           |
| 0.2 | 타이포그래피 시스템                  | ✅   | [../design/typography.md](../design/typography.md) |
| 0.3 | 공통 컴포넌트 라이브러리             | 🔧   |                                         |

---

## 1. 인증 (Auth)

| #   | 기능                     | 상태 | 상세 문서                      |
| --- | ------------------------ | ---- | ------------------------------ |
| 1.1 | 이메일 회원가입 / 로그인 | ✅   | [login.md](./login.md) |
| 1.2 | 구글 소셜 로그인         | ✅   | [login.md](./login.md) |
| 1.3 | 이메일 인증              | ✅   | [login.md](./login.md) |
| 1.4 | 비밀번호 찾기 (재설정)   | ✅   | [login.md](./login.md) |
| 1.5 | 자동 로그인 (세션 유지)  | ✅   | [login.md](./login.md) |
| 1.6 | 로그아웃                 | ✅   | [login.md](./login.md) |
| 1.7 | 회원 탈퇴                | ✅   | [login.md](./login.md) |

---

## 2. 반려동물 관리 (Pet)

| #   | 기능                                      | 상태 | 상세 문서                  |
| --- | ----------------------------------------- | ---- | -------------------------- |
| 2.1 | 반려동물 등록 (이름, 종류, 나이, 사진 등) | ✅   | [pet.md](./pet.md) |
| 2.2 | 반려동물 프로필 수정                      | ✅   | [pet.md](./pet.md) |
| 2.3 | 반려동물 삭제                             | ✅   | [pet.md](./pet.md) |
| 2.4 | 반려동물 목록 조회                        | ✅   | [pet.md](./pet.md) |

---

## 3. 캘린더 / 스케줄 (Calendar & Schedule)

| #    | 기능                                                | 상태 | 상세 문서                                              |
| ---- | --------------------------------------------------- | ---- | ------------------------------------------------------ |
| 3.1  | 캘린더 생성 (반려동물 단위)                         | ✅   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.2  | 캘린더 목록 조회 (내 캘린더 + 공유받은 캘린더)      | ✅   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.3  | 스케줄 생성 (단건)                                  | ✅   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.4  | 반복 스케줄 생성 (매일/매주/격주/매월/커스텀)       | ✅   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.5  | 스케줄 수정 (단건 수정 / 이후 전체 수정)            | ✅   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.6  | 스케줄 삭제 (단건 삭제 / 이후 전체 삭제)            | ✅   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.7  | 스케줄 완료 체크                                    | ✅   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.8  | 캘린더 뷰 (월간/주간)                               | ✅   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.9  | 스케줄 카테고리 (산책, 식사, 병원, 약 투여 등)      | ✅   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.10 | ~~미실행 스케줄 추적 (완료/무시 상태 관리)~~        | ⬜   | [calendar-schedule.md](./calendar-schedule.md) |
| 3.11 | 커스텀 카테고리 관리 (카테고리명/색상 커스터마이징) | ✅   | [calendar-schedule.md](./calendar-schedule.md) |

---

## 4. 푸시 알림 (Push Notification)

| #   | 기능                                          | 상태 | 상세 문서                                              |
| --- | --------------------------------------------- | ---- | ------------------------------------------------------ |
| 4.1 | 푸시 알림 권한 요청 및 토큰 등록              | ✅   | [push-notification.md](./push-notification.md) |
| 4.2 | 스케줄별 알림 시간 설정 (N분 전/정시/커스텀)  | ✅   | [push-notification.md](./push-notification.md) |
| 4.3 | 반복 스케줄 알림 자동 생성                    | ✅   | [push-notification.md](./push-notification.md) |
| 4.4 | 알림 ON/OFF (스케줄 단위)                     | ✅   | [push-notification.md](./push-notification.md) |
| 4.5 | 알림 ON/OFF (캘린더 단위)                     | ✅   | [push-notification.md](./push-notification.md) |
| 4.6 | ~~미실행 스케줄 리마인더 알림 (다음날 발송)~~ | ⬜   | [push-notification.md](./push-notification.md) |

---

## 5. 캘린더 공유 (Sharing)

| #   | 기능                                | 상태 | 상세 문서                          |
| --- | ----------------------------------- | ---- | ---------------------------------- |
| 5.1 | 캘린더 공유 초대 (링크 / 이메일)    | ✅   | [sharing.md](./sharing.md) |
| 5.2 | 공유 초대 수락 / 거절               | ✅   | [sharing.md](./sharing.md) |
| 5.3 | 공유 권한 설정 (열람만 / 편집 가능) | ✅   | [sharing.md](./sharing.md) |
| 5.4 | 공유 멤버 목록 조회                 | ✅   | [sharing.md](./sharing.md) |
| 5.5 | 공유 해제 (나가기 / 내보내기)       | ✅   | [sharing.md](./sharing.md) |

---

## 6. 돌봄 활동 피드 (Care Activity Feed)

| #   | 기능                          | 상태 | 상세 문서                                                |
| --- | ----------------------------- | ---- | -------------------------------------------------------- |
| 6.1 | 반려동물별 활동 타임라인 화면 | ✅   | [care-activity-feed.md](./care-activity-feed.md) |
| 6.2 | 날짜별 그룹핑 + 완료자 표시   | ✅   | [care-activity-feed.md](./care-activity-feed.md) |
| 6.3 | 홈 화면 "최근 활동" 섹션      | ✅   | [care-activity-feed.md](./care-activity-feed.md) |
| 6.4 | 카테고리/기간 필터            | ⬜   | [care-activity-feed.md](./care-activity-feed.md) |

---

## 8. 알림 내역 (Notification History)

| #   | 기능                                         | 상태 | 상세 문서                                                      |
| --- | -------------------------------------------- | ---- | -------------------------------------------------------------- |
| 8.1 | 알림 내역 화면 (최신순 리스트 + 읽음 처리)   | ✅   | [notification-history.md](./notification-history.md)   |
| 8.2 | 알림 전체 읽음 처리                          | ✅   | [notification-history.md](./notification-history.md)   |
| 8.3 | 알림 발송 시 DB 저장 연동                    | ✅   | [notification-history.md](./notification-history.md)   |
| 8.4 | 탭 바 알림 뱃지 (안 읽은 수 표시)            | ✅   | [notification-history.md](./notification-history.md)   |
| 8.5 | 알림에서 스케줄/캘린더로 딥링크              | ✅   | [notification-history.md](./notification-history.md)   |
| 8.6 | 알림 종류별 필터                             | ✅   | [notification-history.md](./notification-history.md)   |

---

## 9. 사용자 설정 (Settings)

| #   | 기능                                   | 상태 | 상세 문서                            |
| --- | -------------------------------------- | ---- | ------------------------------------ |
| 9.1 | 프로필 수정 (닉네임, 프로필 이미지)    | ✅   | [settings.md](./settings.md) |
| 9.2 | 알림 설정 (전체 ON/OFF)                | ✅   | [settings.md](./settings.md) |
| 9.3 | 앱 정보 / 이용약관 / 개인정보 처리방침 | 🔧   | [settings.md](./settings.md) |

---

## 우선순위 로드맵

### Phase 1 - MVP 핵심

> 인증 → 반려동물 등록 → 캘린더/스케줄 기본

- 1.1 ~ 1.5 (인증)
- 2.1, 2.4 (반려동물 등록/조회)
- 3.1 ~ 3.4, 3.8 (캘린더 생성, 스케줄 CRUD, 캘린더 뷰)

### Phase 2 - 알림 & 공유

> 푸시 알림 → 캘린더 공유

- 4.1 ~ 4.4, 4.6 (푸시 알림 + 미실행 리마인더)
- 5.1 ~ 5.3 (공유 기본)

### Phase 3 - 완성도

> 나머지 기능 + 설정

- 1.6, 1.7 (로그아웃, 탈퇴)
- 2.2, 2.3 (반려동물 수정/삭제)
- 3.5 ~ 3.7, 3.9 ~ 3.11 (스케줄 수정/삭제/완료/카테고리/미실행 추적/커스텀 카테고리)
- 5.4, 5.5 (공유 멤버 관리)
- 8.1 ~ 8.3 (알림 내역 기본)
- 9.1 ~ 9.3 (설정)

### Phase 4 - 고도화

> 알림 내역 확장 + 피드 필터

- 8.4 ~ 8.6 (알림 뱃지, 딥링크, 필터)
- 6.4 (카테고리/기간 필터)
