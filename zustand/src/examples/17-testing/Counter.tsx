import { useCounterStore } from './use-counter-store.ts';

/** 전역 스토어를 쓰는 컴포넌트 */
export function Counter() {
  const count = useCounterStore((state) => state.count);
  const inc = useCounterStore((state) => state.inc);

  return (
    <div>
      <h3>전역 스토어</h3>
      <p>
        카운트 <strong>{count}</strong>
      </p>
      <button onClick={inc}>one up</button>
    </div>
  );
}
