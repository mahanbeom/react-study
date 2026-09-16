import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { counterStoreCreator, type CounterStore } from './counter-store-creator.ts';

// 15 에서 만든 배선 그대로. 여기서는 "테스트에 어떤 차이를 만드는가" 가 관심사다.

type CounterStoreApi = ReturnType<typeof createCounterStore>;

const createCounterStore = () => createStore<CounterStore>()(counterStoreCreator);

const CounterStoreContext = createContext<CounterStoreApi | null>(null);

export function CounterStoreProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => createCounterStore());
  return <CounterStoreContext.Provider value={store}>{children}</CounterStoreContext.Provider>;
}

export function useCounterStoreContext<T>(selector: (state: CounterStore) => T): T {
  const store = useContext(CounterStoreContext);
  if (!store) throw new Error('CounterStoreProvider 가 트리에 없다');
  return useStore(store, selector);
}
