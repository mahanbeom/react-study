import type { StateCreator } from 'zustand';
import type { BearSlice } from './bearSlice.ts';
import type { FishSlice } from './fishSlice.ts';

export type SharedSlice = {
  /** 다른 slice 의 액션을 재사용해 한 번에 처리한다 */
  addBoth: () => void;
  /** 상태를 저장하지 않고 계산해서 돌려준다 (파생 값) */
  getBoth: () => number;
  /** 두 slice 의 상태를 한 번의 set 으로 되돌린다 */
  resetBoth: () => void;
};

// 상태 필드가 하나도 없고 액션만 있는 slice 도 얼마든지 가능하다
export const createSharedSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  SharedSlice
> = (set, get) => ({
  addBoth: () => {
    // get() 은 합쳐진 전체 스토어를 준다 → 남의 액션을 그대로 재사용
    get().addBear();
    get().addFish();
    // 직접 써도 된다: set((s) => ({ bears: s.bears + 1, fishes: s.fishes + 1 }))
  },
  getBoth: () => get().bears + get().fishes,
  // set 도 전체 스토어 기준이라, 서로 다른 slice 의 필드를 한 번에 갱신할 수 있다
  resetBoth: () => set({ bears: 0, fishes: 0 }),
});
