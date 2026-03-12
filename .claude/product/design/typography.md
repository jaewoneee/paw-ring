# 타이포그래피 시스템

> 2026-03-10 구축

## 타이포그래피 스케일

| Variant    | 크기   | Tailwind Class | 용도 |
|------------|--------|---------------|------|
| `h1`       | 36px   | `text-4xl font-bold` | 페이지 대제목 |
| `h2`       | 30px   | `text-3xl font-bold` | 섹션 제목 (마이 페이지 등) |
| `h3`       | 24px   | `text-2xl font-semibold` | 카드 제목 |
| `body-xl`  | 20px   | `text-xl` | 강조 텍스트 (스케줄 제목, 월 레이블) |
| `body-lg`  | 18px   | `text-lg` | 바텀시트 제목, 섹션 헤더 |
| `body-md`  | 16px   | `text-base` | 본문 텍스트 **(기본값)** |
| `body-sm`  | 14px   | `text-sm` | 폼 레이블, 보조 텍스트 |
| `caption`  | 13px   | `text-[13px]` | 칩/필 텍스트, 선택지 |
| `small`    | 12px   | `text-xs` | 에러 메시지, 캡션, 보조 라벨 |

## 사용 규칙

### 기본 사용법

```tsx
import { Typography } from '@/components/ui/Typography';

// 기본 (body-md, 16px)
<Typography>본문 텍스트</Typography>

// variant 지정
<Typography variant="body-lg" className="font-semibold">
  섹션 제목
</Typography>

// 색상 커스텀
<Typography variant="body-sm" className="text-muted-foreground">
  보조 텍스트
</Typography>

// 인라인 스타일 (동적 색상)
<Typography variant="caption" style={{ color: isActive ? colors.primary : colors.mutedForeground }}>
  {label}
</Typography>
```

### 폼 패턴

| 요소 | Variant | className |
|------|---------|-----------|
| 폼 필드 레이블 | `body-sm` | `font-medium` |
| 폼 필드 값 (Pressable 내) | `body-md` (기본) | — |
| 칩/필 텍스트 | `caption` | — (동적 style) |
| 에러 메시지 | `small` | — + `style={{ color }}` |
| 바텀시트 제목 | `body-lg` | `font-semibold text-center` |
| 시간 서브 레이블 | `small` | `text-muted-foreground` |

### 금지 사항

- `fontSize` 인라인 스타일 사용 금지 (`TextInput` 제외)
- `<Text>` 직접 사용 대신 `<Typography>` 사용
- `text-xs`, `text-sm` 등 Tailwind 크기 클래스를 `<Text>`에 직접 사용하지 않음

### TextInput 예외

`TextInput`은 Typography로 감쌀 수 없으므로 인라인 `fontSize: 16` 유지:

```tsx
<TextInput
  style={{
    fontSize: 16,        // body-md 크기와 동일하게 유지
    fontFamily: 'Pretendard',
    color: colors.foreground,
  }}
/>
```

## 마이그레이션 현황

| 파일 | 상태 |
|------|------|
| `app/add-schedule.tsx` | ✅ |
| `app/edit-schedule.tsx` | ✅ |
| `app/add-pet.tsx` | ✅ |
| `app/edit-pet.tsx` | ✅ |
| `app/category-manage.tsx` | ✅ |
| `app/schedule-detail.tsx` | ✅ |
| `app/(tabs)/index.tsx` | ✅ |
| `components/calendar/*` | ✅ (이미 Typography 사용) |
| `app/(tabs)/my.tsx` | ✅ (이미 Typography 사용) |
