특정 기능에 대한 단위 테스트를 작성하고 실행해줘.

## 입력

- `$ARGUMENTS`: 테스트할 기능 또는 함수명
  - 예: `expandRRule`, `buildRRule`, `getMonthRange`
  - 파일 경로도 가능: `utils/rrule.ts`, `utils/date.ts`

## 프로세스

1. `$ARGUMENTS`에 해당하는 소스 코드를 찾아서 읽는다.
2. 함수의 입력/출력, 분기 조건, 경계값을 분석한다.
3. `__tests__/` 디렉토리에 테스트 파일을 작성한다.
   - 파일명: `__tests__/{기능명}.test.ts`
   - 기존 테스트 파일이 있으면 테스트 케이스를 추가한다.
4. `npx jest {테스트파일}` 으로 테스트를 실행한다.
5. 실패하는 테스트가 있으면:
   - 테스트가 잘못된 경우 → 테스트를 수정
   - 소스 코드 버그인 경우 → 사용자에게 버그를 알리고 수정 여부를 확인

## 테스트 작성 규칙

- Jest + ts-jest 사용 (설정: `jest.config.js`)
- `@/` path alias 사용 가능
- describe/it 구조, 한국어 테스트명 사용
- 테스트 케이스 분류:
  - 정상 동작 (happy path)
  - 경계값 (boundary values)
  - 엣지 케이스 (edge cases)
- 외부 의존성(Supabase, API 등)이 있는 함수는 mock 처리
- 순수 함수 우선 테스트 (utils, helpers)

## 출력 형식

```
## 단위 테스트: [기능명]

### 테스트 케이스
- ✅ 케이스 설명
- ✅ 케이스 설명
- ❌ 케이스 설명 → 원인 분석

### 실행 결과
Tests: X passed, Y failed, Z total
```
