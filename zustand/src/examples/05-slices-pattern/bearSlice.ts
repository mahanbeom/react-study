import type { StateCreator } from 'zustand';
import type { FishSlice } from './fishSlice.ts';

export type BearSlice = {
  bears: number;
  addBear: () => void;
  /** 자기 slice 가 아닌 fishes 를 줄인다 */
  eatFish: () => void;
};

// StateCreator 의 타입 인자 4개
//   1) BearSlice & FishSlice — set / get 이 보는 "합쳐진 전체 스토어"
//   2) []                    — 이 creator 에 이미 적용된 미들웨어 (없음)
//   3) []                    — 이 creator 가 새로 적용하는 미들웨어 (없음)
//   4) BearSlice             — 이 함수가 실제로 반환하는 조각
// 1번과 4번이 다르다는 게 핵심이다. 보는 범위는 전체, 책임지는 범위는 자기 조각.
export const createBearSlice: StateCreator<BearSlice & FishSlice, [], [], BearSlice> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  // 1번 타입 인자가 전체 스토어라서, 남의 slice 필드도 타입 검사를 통과한다
  eatFish: () => set((state) => ({ fishes: Math.max(0, state.fishes - 1) })),
});
