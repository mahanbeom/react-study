import { create } from 'zustand';
import Notes from '../ui/Notes.tsx';

// 공식문서 Getting Started > Comparison
// "Zustand vs Redux — 상태 모델은 같고, Provider 유무만 다르다"를 코드로 확인한다.
// 같은 카운터를 두 가지 스타일로 만들어 나란히 돌려본다.

type CountState = {
  count: number;
};

// ── 스타일 A: 액션을 스토어에 담는다 (Zustand 기본형) ──────────────
type CountActions = {
  increment: (qty: number) => void;
  decrement: (qty: number) => void;
};

const useCountStore = create<CountState & CountActions>()((set) => ({
  count: 0,
  increment: (qty) => set((state) => ({ count: state.count + qty })),
  decrement: (qty) => set((state) => ({ count: state.count - qty })),
}));

// ── 스타일 B: reducer + dispatch (Redux 스타일을 Zustand 안에서) ────
type Action = {
  type: 'increment' | 'decrement';
  qty: number;
};

// 순수 함수. 스토어 밖에 있으므로 단위 테스트가 쉽다
const countReducer = (state: CountState, action: Action): CountState => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + action.qty };
    case 'decrement':
      return { count: state.count - action.qty };
    default:
      return state;
  }
};

type DispatchActions = {
  dispatch: (action: Action) => void;
};

const useDispatchStore = create<CountState & DispatchActions>()((set) => ({
  count: 0,
  dispatch: (action) => set((state) => countReducer(state, action)),
}));

// ── 화면 ────────────────────────────────────────────────────────
function ActionStyle() {
  const count = useCountStore((state) => state.count);
  const increment = useCountStore((state) => state.increment);
  const decrement = useCountStore((state) => state.decrement);

  return (
    <section>
      <h2>A. 액션 스타일 (Zustand 기본)</h2>
      <p>count: {count}</p>
      <button onClick={() => increment(1)}>+1</button>{' '}
      <button onClick={() => decrement(1)}>-1</button>{' '}
      <button onClick={() => increment(10)}>+10</button>
    </section>
  );
}

function DispatchStyle() {
  const count = useDispatchStore((state) => state.count);
  const dispatch = useDispatchStore((state) => state.dispatch);

  return (
    <section>
      <h2>B. dispatch 스타일 (Redux 방식)</h2>
      <p>count: {count}</p>
      <button onClick={() => dispatch({ type: 'increment', qty: 1 })}>+1</button>{' '}
      <button onClick={() => dispatch({ type: 'decrement', qty: 1 })}>-1</button>{' '}
      <button onClick={() => dispatch({ type: 'increment', qty: 10 })}>+10</button>
    </section>
  );
}

export default function Comparison() {
  return (
    <>
      <p>
        두 스토어는 동작이 같다. Zustand는 아키텍처를 강제하지 않으므로 Redux식
        reducer/dispatch도 그대로 쓸 수 있다. 다만 Provider는 어느 쪽도 필요 없다.
      </p>
      <ActionStyle />
      <DispatchStyle />

      <Notes
        points={[
          <>
            zustand 는 아키텍처를 강제하지 않는다. 같은 카운터를 액션 스타일로도,
            reducer + dispatch 스타일로도 만들 수 있고 둘 다 정상 동작한다.
          </>,
          <>
            Redux 와의 진짜 차이는 상태 모델이 아니라 <b>보일러플레이트와 Provider 유무</b>다.
            어느 스타일을 쓰든 zustand 는 Provider 가 없다.
          </>,
          <>
            액션 스타일이 기본형이다. dispatch 스타일의 이점은 reducer 가 스토어 밖 순수
            함수라 단위 테스트가 쉽다는 것.
          </>,
          <>
            Context 와 달리 Provider 가 없으므로, 리렌더 범위를 정하는 건 컴포넌트의 트리
            위치가 아니라 <b>selector</b> 다.
          </>,
        ]}
      />
    </>
  );
}
