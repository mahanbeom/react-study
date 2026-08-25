import type { StateCreator } from 'zustand';
import type { BearSlice } from './bearSlice.ts';

export type FishSlice = {
  fishes: number;
  addFish: () => void;
};

export const createFishSlice: StateCreator<BearSlice & FishSlice, [], [], FishSlice> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
});
