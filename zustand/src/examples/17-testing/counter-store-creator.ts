import type { StateCreator } from 'zustand';

// 전역 스토어 판과 Context 판이 같은 상태 정의를 공유하도록 creator 만 따로 뺀다.
// 이 파일에는 create 도 createStore 도 없다 — "무엇을 담을지" 만 있다.

export type CounterStore = {
  count: number;
  inc: () => void;
};

export const counterStoreCreator: StateCreator<CounterStore> = (set) => ({
  count: 1,
  inc: () => set((state) => ({ count: state.count + 1 })),
});
