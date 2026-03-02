# Paw Ring

반려동물 전용 스케줄러 앱. 반려동물 단위로 캘린더를 생성하고, 반복 일정 관리, 푸시 알림, 캘린더 공유 기능을 제공합니다.

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | Expo SDK 55, React Native 0.83, React 19 |
| Language | TypeScript (strict mode) |
| Routing | Expo Router (file-based, typed routes) |
| Styling | NativeWind (Tailwind CSS for RN) + theo-kit-native |
| Backend | Firebase (Auth, Firestore, Storage, FCM) |
| State | React Context API, AsyncStorage |

## Project Structure

```
paw-ring/
├── app/                    # Expo Router 페이지
│   ├── (auth)/             # 인증 화면 (로그인, 회원가입, 비밀번호 찾기, 이메일 인증)
│   ├── (tabs)/             # 메인 탭 (홈, 건강, 다이어리, 프로필)
│   └── _layout.tsx         # 루트 레이아웃 (인증 라우팅 가드)
├── components/             # 공통 컴포넌트
├── contexts/               # React Context (AuthContext)
├── hooks/                  # 커스텀 훅 (useAuth)
├── lib/                    # 라이브러리 초기화 (Firebase)
├── services/               # 비즈니스 로직 (auth, firestore)
├── types/                  # TypeScript 타입 정의
├── utils/                  # 유틸리티 (validation)
└── assets/                 # 이미지, 폰트
```

## Features

### 구현 완료

- **이메일 인증 로그인** - 회원가입, 로그인, 비밀번호 재설정, 이메일 인증
- **인증 라우팅 가드** - 미인증/미검증 사용자 자동 리다이렉트
- **세션 유지** - AsyncStorage 기반 Firebase Auth 세션 영속화
- **탭 네비게이션** - 홈, 건강, 다이어리, 프로필 4탭 구조

### 개발 예정

- 반려동물 등록/관리
- 캘린더 및 반복 일정 관리
- 푸시 알림
- 캘린더 공유 (공동 돌봄)
- 설정 및 계정 관리

## Getting Started

```bash
# 의존성 설치
yarn install

# 개발 서버 실행
yarn start

# 플랫폼별 실행
yarn android
yarn ios
yarn web
```

### 환경 변수

`.env.local` 파일에 Firebase 설정이 필요합니다.

```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```
