# 성능 개선

## 2026-03-10: ScheduleItem에 React.memo 적용

- **배경**: 프로젝트 전체에 React.memo가 하나도 없음. ScheduleItem은 DayScheduleList, StackedScheduleList 두 곳에서 .map()으로 반복 렌더링되어 가장 효과가 큰 대상
- **개선 내용**: ScheduleItem을 React.memo로 감싸 props 변경 시에만 리렌더링
- **수정 파일**: `components/calendar/ScheduleItem.tsx`
- **미적용 사유**:
  - 4.2 대형 컴포넌트 분리: `edit-schedule.tsx`(1144줄), `add-schedule.tsx`(959줄)은 폼 화면으로 상태 결합도가 높아 분리 시 복잡도만 증가. MonthCalendar는 이미 useMemo로 최적화되어 있음
