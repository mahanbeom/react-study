import { CounterStoreProvider, useCounterStoreContext } from './counter-store-context.tsx';

function Inner() {
  const count = useCounterStoreContext((state) => state.count);
  const inc = useCounterStoreContext((state) => state.inc);

  return (
    <div>
      <h3>Context 스토어</h3>
      <p>
        카운트 <strong>{count}</strong>
      </p>
      <button onClick={inc}>one up (context)</button>
    </div>
  );
}

/** Provider 를 안에 품은 형태 — 렌더될 때마다 스토어가 새로 생긴다 */
export function CounterWithContext() {
  return (
    <CounterStoreProvider>
      <Inner />
    </CounterStoreProvider>
  );
}
