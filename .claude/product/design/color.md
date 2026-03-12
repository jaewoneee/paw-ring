# 컬러 시스템

## 개요

PawRing의 컬러 시스템은 **블루** 를 포인트 컬러로 사용하며, 라이트/다크 모드를 지원한다.

- **포인트 컬러 원본:** `oklch(58.8% 0.158 241.966)` → #0084D1
- **브랜드 키워드:** 신뢰감, 책임감, 규칙적, 친근함
- **기술 스택:** NativeWind v4 + CSS 변수 + Tailwind

## 컬러 토큰

### Primary (Blue)

| Token                | Light         | Dark          | 용도                            |
| -------------------- | ------------- | ------------- | ------------------------------- |
| `primary`            | #0084D1 (500) | #25A1EC (400) | 주요 버튼, 강조 요소            |
| `primary-foreground` | #FFFFFF       | #FFFFFF       | primary 위의 텍스트 (항상 흰색) |

**풀 스케일 (직접 참조용):**

| Token         | Value   | OKLCH 기반      |
| ------------- | ------- | --------------- |
| `primary-50`  | #EAF7FF | L:97% C:0.02    |
| `primary-100` | #D1ECFF | L:93% C:0.04    |
| `primary-200` | #A6DBFF | L:87% C:0.08    |
| `primary-300` | #69BDFA | L:77% C:0.12    |
| `primary-400` | #25A1EC | L:68% C:0.15    |
| `primary-500` | #0084D1 | L:58.8% C:0.158 |
| `primary-600` | #006FB9 | L:52% C:0.155   |
| `primary-700` | #005A9B | L:45% C:0.14    |
| `primary-800` | #004478 | L:37% C:0.12    |
| `primary-900` | #00315B | L:30% C:0.10    |
| `primary-950` | #001C3C | L:22% C:0.08    |

### Background / Surface

| Token              | Light                 | Dark                  | 용도                |
| ------------------ | --------------------- | --------------------- | ------------------- |
| `background`       | #FFFFFF               | #0A0A0A (neutral-950) | 전체 배경           |
| `surface`          | #F5F5F5 (neutral-100) | #171717 (neutral-900) | 카드, 섹션 배경     |
| `surface-elevated` | #FFFFFF               | #262626 (neutral-800) | 바텀시트, 모달 배경 |

### Text

| Token              | Light                 | Dark                  | 용도                      |
| ------------------ | --------------------- | --------------------- | ------------------------- |
| `foreground`       | #171717 (neutral-900) | #FAFAFA (neutral-50)  | 주요 텍스트               |
| `muted-foreground` | #737373 (neutral-500) | #A3A3A3 (neutral-400) | 보조 텍스트, 플레이스홀더 |

### Border

| Token           | Light                 | Dark                  | 용도                   |
| --------------- | --------------------- | --------------------- | ---------------------- |
| `border`        | #E5E5E5 (neutral-200) | #404040 (neutral-700) | 기본 구분선, 입력 필드 |
| `border-strong` | #D4D4D4 (neutral-300) | #525252 (neutral-600) | 강조 구분선            |

### Card

| Token         | Value   | 용도               |
| ------------- | ------- | ------------------ |
| `card-blue`   | #4F7FFF | 카드 배경 (블루)   |
| `car-yellow`  | #FFC81D | 카드 배경 (앰버)   |
| `card-orange` | #F86F03 | 카드 배경 (오렌지) |
| `card-blush`  | #FFF6F4 | 카드 배경 (블러시) |
| `card-green`  | #13BC43 | 카드 배경 (그린)   |

### Status (Semantic)

| Token     | Light               | Dark                | 용도                   |
| --------- | ------------------- | ------------------- | ---------------------- |
| `success` | #16A34A (green-600) | #22C55E (green-500) | 성공 메시지, 완료 표시 |
| `error`   | #DC2626 (red-600)   | #EF4444 (red-500)   | 에러 메시지, 필수 입력 |
| `warning` | #D97706 (amber-600) | #F59E0B (amber-500) | 경고, 주의 표시        |

## 사용 가이드

### Tailwind 클래스로 사용

```tsx
// 시맨틱 토큰 (자동 다크모드 대응)
<View className="bg-background">
  <Text className="text-foreground">주요 텍스트</Text>
  <Text className="text-muted-foreground">보조 텍스트</Text>
  <Button className="bg-primary text-primary-foreground">버튼</Button>
</View>

// 스케일 직접 참조
<View className="bg-primary-100">
  <Text className="text-primary-700">강조 텍스트</Text>
</View>
```

### JS에서 사용 (아이콘, 네비게이션 등)

```ts
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { colorScheme } = useColorScheme();
const colors = Colors[colorScheme ?? 'light'];

<Icon color={colors.primary} />
```

## 구현 상태

- [x] 컬러 토큰 정의
- [x] CSS 변수 설정 (global.css)
- [x] Tailwind 설정 (tailwind.config.js)
- [x] Colors.ts JS 객체
- [x] 전체 컴포넌트 마이그레이션
  - [x] Button
  - [x] Input
  - [x] Card
  - [x] Typography
  - [x] RadioGroup
  - [x] BottomSheet
  - [x] Screen (신규 - 화면 배경 래퍼)
- [x] 전체 화면 다크모드 적용
  - [x] 홈 (index.tsx)
  - [x] 캘린더 (calendar.tsx)
  - [x] 마이 (my.tsx)
  - [x] 로그인 (login.tsx)
  - [x] 회원가입 (register.tsx)
  - [x] 이메일 인증 (verify-email.tsx)
  - [x] 비밀번호 찾기 (forgot-password.tsx)
  - [x] 반려동물 등록 (add-pet.tsx)
  - [x] Auth 레이아웃 (\_layout.tsx)
