# 로그인

## 개요
- Firebase Auth 기반 이메일 로그인 + 구글 소셜 로그인 인증 시스템

## 목적
- 사용자 식별을 통해 반려동물 데이터를 개인화하고 안전하게 관리
- 간편한 소셜 로그인으로 진입 장벽을 낮추고, 이메일 로그인으로 범용성 확보

## 기술 스택
- **BaaS**: Firebase
- **인증**: Firebase Auth (이메일/비밀번호, Google 로그인)
- **DB**: Cloud Firestore
- **프론트엔드**: Expo (React Native) + TypeScript
- **백엔드 서버**: 없음 (Firebase SDK 직접 통신)
- **Firebase SDK**: Firebase JS SDK (`firebase` npm 패키지) — Expo Go 호환

## 사용자 시나리오

### 시나리오 1: 이메일 회원가입
1. 사용자가 앱을 처음 실행한다
2. 로그인 화면이 표시된다
3. 사용자가 "회원가입" 링크를 누른다
4. 회원가입 화면에서 이메일, 비밀번호, 닉네임을 입력한다
5. "가입하기" 버튼을 누른다
6. Firebase Auth가 계정을 생성한다
7. Firebase Auth가 이메일 인증 링크를 발송한다
8. Firestore에 사용자 프로필(닉네임 등) 문서를 생성한다
9. 사용자가 이메일 인증을 완료하면 전체 기능을 사용할 수 있다
10. 메인 화면(내 반려동물 탭)으로 이동한다

### 시나리오 2: 이메일 로그인 (기존 회원)
1. 사용자가 로그인 화면에서 이메일/비밀번호를 입력한다
2. "로그인" 버튼을 누른다
3. Firebase Auth가 자격증명을 확인한다
4. 인증 성공 시 메인 화면으로 이동한다

### 시나리오 3: 구글 로그인
1. 사용자가 로그인 화면에서 "구글로 시작하기"를 선택한다
2. 구글 OAuth 동의 화면이 표시된다
3. 사용자가 구글 계정을 선택하고 권한을 허용한다
4. Firebase Auth가 구글 credential로 로그인/가입 처리한다
5. 신규 사용자면 Firestore에 프로필 문서를 생성한다
6. 메인 화면으로 이동한다

### 시나리오 4: 자동 로그인
1. 이전에 로그인한 사용자가 앱을 실행한다
2. Firebase Auth가 저장된 세션을 자동으로 복원한다 (Firebase SDK 내장 기능)
3. `onAuthStateChanged` 리스너가 인증 상태를 감지한다
4. 로그인 상태면 자동으로 메인 화면으로 이동한다

### 시나리오 5: 비밀번호 찾기
1. 사용자가 로그인 화면에서 "비밀번호 찾기"를 누른다
2. 이메일 입력 화면이 표시된다
3. 이메일을 입력하고 "전송" 버튼을 누른다
4. Firebase Auth가 비밀번호 재설정 이메일을 발송한다
5. 사용자가 이메일 링크를 통해 새 비밀번호를 설정한다

## 주요 기능 요구사항

### 이메일 로그인
- [ ] 이메일/비밀번호 회원가입 (`createUserWithEmailAndPassword`)
- [ ] 이메일/비밀번호 로그인 (`signInWithEmailAndPassword`)
- [ ] 입력값 유효성 검증 (이메일 형식, 비밀번호 최소 8자 영문+숫자)
- [ ] 이메일 인증 발송 (`sendEmailVerification`)
- [ ] 비밀번호 재설정 이메일 발송 (`sendPasswordResetEmail`)

### 구글 로그인
- [ ] Google OAuth 2.0 연동 (expo-auth-session)
- [ ] Firebase Auth에 구글 credential 연동 (`signInWithCredential`)
- [ ] 구글 계정 정보(이메일, 이름, 프로필 사진)로 자동 프로필 생성
- [ ] 기존 이메일 계정과 동일 이메일의 구글 계정 연동 처리

### 공통
- [ ] 인증 상태 감지 (`onAuthStateChanged`)
- [ ] 자동 로그인 (Firebase SDK 내장 세션 관리)
- [ ] 로그아웃 (`signOut`)
- [ ] 회원 탈퇴 (`deleteUser` + Firestore 문서 삭제)
- [ ] 닉네임 설정 (회원가입 시 필수)

## 화면 구성

### 1. 로그인 화면 (`app/(auth)/login.tsx`)
```
┌─────────────────────────┐
│                         │
│      🐾 PAW RING        │
│                         │
│  ┌───────────────────┐  │
│  │ 이메일             │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 비밀번호           │  │
│  └───────────────────┘  │
│                         │
│  [      로그인       ]  │
│                         │
│  비밀번호 찾기  |  회원가입│
│                         │
│  ──── 또는 ────         │
│                         │
│  [G  구글로 시작하기  ]  │
│                         │
└─────────────────────────┘
```

### 2. 회원가입 화면 (`app/(auth)/register.tsx`)
```
┌─────────────────────────┐
│  ← 뒤로                 │
│                         │
│      회원가입            │
│                         │
│  ┌───────────────────┐  │
│  │ 닉네임             │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 이메일             │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 비밀번호           │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 비밀번호 확인       │  │
│  └───────────────────┘  │
│                         │
│  [     가입하기       ]  │
│                         │
│  ──── 또는 ────         │
│                         │
│  [G  구글로 시작하기  ]  │
│                         │
└─────────────────────────┘
```

### 3. 비밀번호 찾기 화면 (`app/(auth)/forgot-password.tsx`)
```
┌─────────────────────────┐
│  ← 뒤로                 │
│                         │
│    비밀번호 찾기          │
│                         │
│  가입한 이메일을 입력하면  │
│  재설정 링크를 보내드려요  │
│                         │
│  ┌───────────────────┐  │
│  │ 이메일             │  │
│  └───────────────────┘  │
│                         │
│  [   재설정 링크 전송  ]  │
│                         │
└─────────────────────────┘
```

## 아키텍처 설계

### Frontend (Expo/React Native)

```
app/
├── (auth)/                        # 인증 라우트 그룹 (비로그인 상태)
│   ├── _layout.tsx                # 인증 레이아웃 (Stack)
│   ├── login.tsx                  # 로그인 화면
│   ├── register.tsx               # 회원가입 화면
│   └── forgot-password.tsx        # 비밀번호 찾기 화면
├── (tabs)/                        # 메인 탭 (로그인 상태)
│   └── ...기존 탭들
├── _layout.tsx                    # 루트 레이아웃 (인증 상태에 따라 분기)

lib/
├── firebase.ts                    # Firebase 앱 초기화 설정

contexts/
├── AuthContext.tsx                 # 인증 상태 관리 (onAuthStateChanged)

hooks/
├── useAuth.ts                     # 인증 관련 커스텀 훅 (login, register, logout 등)

services/
├── auth.ts                        # Firebase Auth 래핑 함수
├── firestore.ts                   # Firestore 유틸 (사용자 프로필 CRUD)

utils/
├── validation.ts                  # 입력값 검증 유틸 (이메일, 비밀번호 규칙)
```

**주요 라이브러리:**
- `firebase`: Firebase JS SDK (인증, Firestore 등 통합 패키지)
- `@react-native-async-storage/async-storage`: Firebase Auth 세션 퍼시스턴스
- `expo-auth-session` + `expo-web-browser`: 구글 OAuth (Expo 환경)
- `expo-crypto`: nonce 생성 (구글 로그인용)

> **참고**: `@react-native-firebase` 대신 Firebase JS SDK를 사용합니다. Expo Go에서 바로 테스트 가능하며, 인증/Firestore 기능에 충분합니다.

### Firebase 설정 (백엔드 서버 불필요)

Firebase Console에서 설정할 항목:
1. **Authentication**
   - 이메일/비밀번호 로그인 활성화
   - Google 로그인 활성화
   - 이메일 인증 템플릿 설정 (한국어)
   - 비밀번호 재설정 템플릿 설정 (한국어)

2. **Cloud Firestore**
   - 보안 규칙 설정 (인증된 사용자만 자신의 데이터 접근)

3. **Google Cloud Console**
   - OAuth 2.0 클라이언트 ID 생성 (iOS, Android 각각)

### 인증 플로우

```
[이메일 회원가입]
Client → createUserWithEmailAndPassword(email, password)
Firebase Auth → 계정 생성 + ID Token 자동 발급
Client → sendEmailVerification()
Client → Firestore에 users/{uid} 문서 생성 (nickname 등)
Client → onAuthStateChanged로 상태 감지 → 메인 화면 이동

[이메일 로그인]
Client → signInWithEmailAndPassword(email, password)
Firebase Auth → 검증 + 세션 자동 관리
Client → onAuthStateChanged로 상태 감지 → 메인 화면 이동

[구글 로그인]
Client → expo-auth-session으로 Google OAuth
Google → ID Token 반환
Client → GoogleAuthProvider.credential(idToken)
Client → signInWithCredential(credential)
Firebase Auth → 계정 생성/로그인 + 세션 관리
Client → 신규 사용자면 Firestore에 프로필 문서 생성
Client → onAuthStateChanged로 상태 감지 → 메인 화면 이동

[자동 로그인]
앱 실행 → Firebase SDK가 저장된 세션 자동 복원
onAuthStateChanged(user) → user가 있으면 메인 화면 이동

[비밀번호 재설정]
Client → sendPasswordResetEmail(email)
Firebase Auth → 재설정 이메일 발송
사용자 → 이메일 링크에서 새 비밀번호 설정
```

## 데이터 모델

### Firestore: `users` 컬렉션
```typescript
// users/{uid}
interface UserProfile {
  uid: string;              // Firebase Auth UID
  email: string;            // 이메일
  nickname: string;         // 닉네임
  profileImage: string;     // 프로필 이미지 URL (구글 로그인 시 자동 설정)
  provider: 'email' | 'google'; // 가입 방식
  emailVerified: boolean;   // 이메일 인증 여부
  createdAt: Timestamp;     // 생성일시
  updatedAt: Timestamp;     // 수정일시
}
```

### Firestore 보안 규칙
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> **참고**: Firebase Auth가 토큰(ID Token, Refresh Token) 관리를 자동으로 처리하므로 별도 토큰 테이블이 필요 없음

## 예외 처리

| 상황 | Firebase Error Code | 대응 |
|------|-------------------|------|
| 이메일 형식 오류 | (클라이언트 검증) | 실시간 유효성 검증 메시지 표시 |
| 비밀번호 규칙 미달 | `auth/weak-password` | "비밀번호는 최소 8자, 영문+숫자를 포함해야 합니다" |
| 이미 가입된 이메일 | `auth/email-already-in-use` | "이미 가입된 이메일입니다" |
| 이메일/비밀번호 불일치 | `auth/invalid-credential` | "이메일 또는 비밀번호가 올바르지 않습니다" |
| 존재하지 않는 계정 | `auth/user-not-found` | "이메일 또는 비밀번호가 올바르지 않습니다" (보안상 동일 메시지) |
| 구글 로그인 취소 | (사용자 취소) | 로그인 화면으로 복귀 |
| 구글 로그인 실패 | `auth/popup-closed-by-user` 등 | "구글 인증에 실패했습니다. 다시 시도해주세요" |
| 네트워크 오류 | `auth/network-request-failed` | "네트워크 연결을 확인해주세요" |
| 구글 이메일 = 기존 이메일 계정 | `auth/account-exists-with-different-credential` | "이미 이메일로 가입된 계정입니다. 이메일로 로그인 후 구글 계정을 연동해주세요" |
| 비밀번호 찾기 - 미가입 이메일 | `auth/user-not-found` | "가입되지 않은 이메일입니다" |

## 참고 사항
- Firebase Auth는 ID Token(1시간) 자동 갱신을 SDK 내부에서 처리하므로 별도 토큰 관리 로직 불필요
- Firebase JS SDK를 사용하므로 Expo Go에서 바로 테스트 가능 (커스텀 빌드 불필요)
- React Native 환경에서 세션 유지를 위해 `@react-native-async-storage/async-storage` + `getReactNativePersistence` 사용
- Google Cloud Console에서 iOS(Bundle ID)와 Android(SHA-1) 각각 OAuth 클라이언트 ID 등록 필요
- Firebase 무료 티어(Spark Plan): 인증 무제한, Firestore 일 5만 읽기/2만 쓰기
- HTTPS는 Firebase SDK가 자동 처리

## 구현 순서

### Phase 1: Firebase 초기 설정
1. Firebase 프로젝트 생성 및 앱 등록 (iOS, Android)
2. `@react-native-firebase` 패키지 설치 및 네이티브 설정
3. Expo Dev Client 설정 (커스텀 빌드 환경 구축)
4. Firebase 초기화 코드 (`lib/firebase.ts`)

### Phase 2: 이메일 로그인
1. AuthContext 구현 (`onAuthStateChanged` 기반)
2. 루트 레이아웃에서 인증 상태에 따른 라우팅 분기
3. 회원가입 화면 UI + Firebase Auth 연동
4. Firestore 사용자 프로필 생성 로직
5. 로그인 화면 UI + Firebase Auth 연동
6. 이메일 인증 플로우
7. 비밀번호 찾기 화면 + Firebase Auth 연동
8. 로그아웃 기능

### Phase 3: 구글 로그인
1. Google Cloud Console OAuth 클라이언트 ID 설정
2. Firebase Console에서 Google 로그인 활성화
3. expo-auth-session 구글 로그인 연동
4. 기존 이메일 계정과 구글 계정 충돌 처리
5. 구글 프로필 정보 자동 반영
