# 푸시 알림

## 개요
- 스케줄에 설정된 알림 타이밍에 맞춰 푸시 알림을 발송하는 기능
- 반복 스케줄의 알림도 자동으로 처리

## 목적
- 반려동물 돌봄 일정을 놓치지 않도록 리마인드
- 공유 캘린더 참여자 모두에게 알림 제공

## 기술 스택
- **로컬 알림**: expo-notifications (Expo Notifications API)
- **원격 알림**: Firebase Cloud Messaging (FCM)
- **스케줄링**: expo-notifications의 스케줄 알림 또는 Firebase Cloud Functions
- **토큰 관리**: Firestore에 디바이스 토큰 저장

## 사용자 시나리오

### 시나리오 1: 알림 권한 요청
1. 앱 최초 실행 시 (또는 첫 스케줄 생성 시) 알림 권한 요청 팝업 표시
2. 사용자가 허용하면 FCM 토큰을 발급받아 Firestore에 저장
3. 사용자가 거부하면 알림 기능 비활성화 안내

### 시나리오 2: 스케줄 알림 수신
1. 사용자가 스케줄 생성 시 알림을 "30분 전"으로 설정
2. 해당 시간 30분 전에 푸시 알림 수신:
   - "🐾 테오 - 오전 산책 (30분 후)"
3. 알림을 탭하면 해당 스케줄 상세 화면으로 이동

### 시나리오 3: 반복 스케줄 알림
1. 매일 반복 스케줄에 알림이 설정되어 있으면
2. 매일 설정된 시간에 알림이 자동 발송됨

### 시나리오 4: 알림 끄기
1. 특정 스케줄의 알림을 OFF하면 해당 스케줄 알림만 중지
2. 특정 캘린더(반려동물)의 알림을 OFF하면 해당 캘린더 전체 알림 중지
3. 설정에서 전체 알림 OFF하면 모든 알림 중지

## 주요 기능 요구사항

### 알림 기본
- [ ] 알림 권한 요청 (expo-notifications)
- [ ] FCM 토큰 발급 및 Firestore 저장
- [ ] 토큰 갱신 처리

### 알림 스케줄링
- [ ] 단건 스케줄 알림 등록 (로컬 알림)
- [ ] 반복 스케줄 알림 등록
- [ ] 스케줄 수정/삭제 시 알림 업데이트/취소
- [ ] 알림 시간 옵션: 없음 / 정시 / 10분 전 / 30분 전 / 1시간 전 / 커스텀

### 알림 ON/OFF
- [ ] 스케줄 단위 알림 ON/OFF
- [ ] 캘린더(반려동물) 단위 알림 ON/OFF
- [ ] 전체 알림 ON/OFF (설정 화면)

### 알림 수신
- [ ] 포그라운드 알림 표시 (앱 사용 중)
- [ ] 백그라운드 알림 표시
- [ ] 알림 탭 시 해당 스케줄 상세로 딥링크

## 알림 전략

### 로컬 알림 vs 원격 알림

| 구분 | 로컬 알림 (expo-notifications) | 원격 알림 (FCM) |
|------|-------------------------------|----------------|
| 장점 | 서버 불필요, 즉시 등록, 오프라인 동작 | 공유 캘린더 알림 가능, 서버 제어 |
| 단점 | 공유 대상에게 알림 불가, 앱 삭제 시 소멸 | Cloud Functions 필요, 비용 발생 |
| 사용 시점 | MVP (Phase 1) | 공유 기능 추가 시 (Phase 2) |

**전략**: Phase 1에서는 로컬 알림으로 시작, Phase 2에서 공유 알림을 위해 FCM 추가

### 반복 알림 처리

```
[로컬 알림 방식]
스케줄 생성 시 → 향후 N일치 로컬 알림 일괄 등록
앱 실행 시 → 부족한 알림 보충 등록

[원격 알림 방식 (Phase 2)]
Cloud Functions 크론잡 → 매일 당일 스케줄 조회 → FCM 발송
```

## 아키텍처 설계

### Frontend

```
services/
├── notification.ts               # 알림 권한/토큰/등록 관리

hooks/
├── useNotification.ts            # 알림 권한 상태 및 설정 훅

utils/
├── notificationScheduler.ts      # 로컬 알림 스케줄 계산/등록
```

### Backend (Phase 2 - Cloud Functions)

```
functions/
├── scheduledNotification.ts      # 크론잡: 당일 스케줄 → FCM 발송
├── onScheduleWrite.ts            # 트리거: 스케줄 생성/수정 시 알림 처리
```

## 데이터 모델

### Firestore: `users/{uid}` 확장
```typescript
interface UserProfile {
  // ... 기존 필드
  fcmTokens: string[];              // FCM 디바이스 토큰 (다중 디바이스)
  notificationEnabled: boolean;     // 전체 알림 ON/OFF
}
```

### Firestore: `petNotificationSettings` 컬렉션
```typescript
// petNotificationSettings/{petId}_{userId}
interface PetNotificationSetting {
  petId: string;
  userId: string;
  enabled: boolean;                 // 캘린더 단위 알림 ON/OFF
}
```

## 예외 처리

| 상황 | 대응 |
|------|------|
| 알림 권한 거부 | 설정 앱으로 이동 유도: "설정에서 알림을 허용해주세요" |
| FCM 토큰 발급 실패 | 재시도, 실패 시 로컬 알림만 사용 |
| 알림 탭 시 해당 스케줄 삭제됨 | "삭제된 스케줄입니다" 토스트 후 캘린더로 이동 |
| 디바이스 변경/앱 재설치 | 로그인 시 토큰 재등록, 로컬 알림 재등록 |

## 구현 순서

### Phase 1: 로컬 알림
1. expo-notifications 설정 및 권한 요청
2. 스케줄 생성 시 로컬 알림 등록
3. 스케줄 수정/삭제 시 알림 업데이트/취소
4. 반복 스케줄 로컬 알림 (향후 7일치 일괄 등록)
5. 알림 탭 시 딥링크
6. 스케줄/캘린더 단위 ON/OFF

### Phase 2: 원격 알림 (FCM)
1. FCM 토큰 관리
2. Cloud Functions 크론잡 (당일 스케줄 → FCM 발송)
3. 공유 캘린더 참여자 알림
