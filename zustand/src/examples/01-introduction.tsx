import { create } from 'zustand';

// 공식문서 Getting Started > Introduction 의 곰 카운터 예제
type BearStore = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

const useBearStore = create<BearStore>()((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

useBearStore.subscribe((state, prev) => {
  console.log(`bears: ${prev.bears} -> ${state.bears}`)
})

export default function Introduction() {
  const bears = useBearStore((state) => state.bears);
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  const removeAllBears = useBearStore((state) => state.removeAllBears);

  return (
    <>
      <p>{bears} bears around here...</p>
      <button onClick={increasePopulation}>one up</button>{' '}
      <button onClick={removeAllBears}>remove all</button>
    </>
  );
}
