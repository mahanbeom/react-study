import { create } from 'zustand';
import { createBearSlice, type BearSlice } from './bearSlice.ts';
import { createFishSlice, type FishSlice } from './fishSlice.ts';
import { createSharedSlice, type SharedSlice } from './sharedSlice.ts';

export type BoundStore = BearSlice & FishSlice & SharedSlice;

// (...a) 는 zustand 가 넘겨주는 (set, get, api) 세 개를 그대로 받아
// 각 slice 에 똑같이 흘려보내는 관용구다. 아래와 완전히 같은 뜻이다.
//   (set, get, api) => ({ ...createBearSlice(set, get, api), ... })
// 인자가 늘어나도 손댈 곳이 없어서 이렇게 쓴다.
export const useBoundStore = create<BoundStore>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
  ...createSharedSlice(...a),
}));
