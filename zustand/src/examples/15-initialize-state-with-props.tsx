import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { useShallow } from 'zustand/react/shallow';
import Notes from '../ui/Notes.tsx';

// 공식문서 Frameworks and platforms > Initialize state with props
//
// 14 에서 얻은 결론 — "요청 데이터는 스토어를 만들 때 넣어야 한다" — 의 배선을
// 실제로 짜는 꼭지다. 14 는 문자열만 뽑았지만 여기서는 브라우저에 진짜로 마운트한다.
//
// 문서가 말하는 목적은 의존성 주입(DI): 스토어의 초기값을 모듈이 아니라
// "쓰는 쪽" 이 정한다. 그러면 같은 스토어 정의를 서로 다른 초기값으로 여러 번
// 띄울 수 있고(1번), Provider 가 사라지면 스토어도 같이 사라진다.

type BearProps = {
  bears: number;
};

type BearState = BearProps & {
  addBear: () => void;
};

const DEFAULT_PROPS: BearProps = { bears: 0 };

/** 부를 때마다 새 스토어. initProps 로 초기값을 주입받는다 — 이 꼭지의 전부다. */
const createBearStore = (initProps?: Partial<BearProps>) =>
  createStore<BearState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    // 문서 원문은 ++state.bears 인데 그건 state 를 직접 건드린다(06 참고).
    // 여기서는 읽기만 하고 새 객체를 돌려주는 형태로 쓴다.
    addBear: () => set((state) => ({ bears: state.bears + 1 })),
  }));

type BearStore = ReturnType<typeof createBearStore>;

const BearContext = createContext<BearStore | null>(null);

// ─────────────────────────────────────────────────────────────────────
// Provider — 스토어를 만들어 트리 아래로 내려준다
// ─────────────────────────────────────────────────────────────────────

type BearProviderProps = PropsWithChildren<Partial<BearProps>>;

/**
 * TODO ① — 지금은 렌더할 때마다 스토어를 새로 만든다(= 아래 2번의 &quot;틀린 쪽&quot;과 같다).
 *
 *   const [store] = useState(() => createBearStore(props));
 *
 * 로 고쳐라. useState 의 초기화 함수는 그 컴포넌트 인스턴스당 딱 한 번만 실행되므로
 * 스토어의 수명이 "Provider 가 트리에 살아 있는 동안"으로 묶인다.
 * 고치고 나면 2번의 두 상자가 다르게 동작한다.
 */
function BearProvider({ children, ...props }: BearProviderProps) {
  const store = createBearStore(props);
  return <BearContext.Provider value={store}>{children}</BearContext.Provider>;
}

/** 일부러 틀리게 짠 Provider — 2번에서 비교용으로만 쓴다 */
function NaiveBearProvider({ children, ...props }: BearProviderProps) {
  const store = createBearStore(props);
  return <BearContext.Provider value={store}>{children}</BearContext.Provider>;
}

/** 14 의 useGreetContext 와 같은 모양. create 가 주던 bounded hook 을 손으로 만든 것. */
function useBearContext<T>(selector: (state: BearState) => T): T {
  const store = useContext(BearContext);
  if (!store) throw new Error('BearContext.Provider 가 트리에 없다');
  return useStore(store, selector);
}

// ─────────────────────────────────────────────────────────────────────
// 소비자 컴포넌트 — 어느 스토어인지 모른 채 useBearContext 만 부른다
// ─────────────────────────────────────────────────────────────────────

function BearCounter() {
  const bears = useBearContext((state) => state.bears);
  const addBear = useBearContext((state) => state.addBear);

  return (
    <p>
      🐻 <strong>{bears}</strong> 마리 <button onClick={addBear}>+1</button>
    </p>
  );
}

const MEALS = ['연어', '베리', '견과'];

function BearMeals() {
  void useShallow; // TODO ② 에서 사용
  void MEALS; // TODO ② 에서 사용

  // TODO ② — 곰 수만큼 식사를 배열로 만들어 보여라.
  //   const order = useBearContext((s) =>
  //     Array.from({ length: s.bears }, (_, index) => MEALS[index % MEALS.length]),
  //   );
  //   먼저 이렇게 useShallow 없이 써 보고 콘솔을 확인할 것 — selector 가 매 호출마다
  //   새 배열을 만들어 Object.is 가 항상 false 라, v5 는 "getSnapshot should be cached"
  //   무한 루프 경고를 낸다(09 에서 본 그것). 그다음 selector 를 useShallow(...) 로
  //   감싸면 조용해진다. 두 상태를 모두 눈으로 보고 넘어가라.
  const order: string[] = [];

  if (order.length === 0) {
    return (
      <p>
        <small>
          식사 없음 <em>(TODO ② 를 채우면 곰 수만큼 나온다)</em>
        </small>
      </p>
    );
  }

  return (
    <p>
      <small>식사 순서: {order.join(' · ')}</small>
    </p>
  );
}

function BearPanel({ label }: { label: string }) {
  return (
    <div>
      <h3>{label}</h3>
      <BearCounter />
      <BearMeals />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 1. Provider 마다 다른 스토어 — 같은 컴포넌트, 다른 초기값
// ─────────────────────────────────────────────────────────────────────

function IsolationLab() {
  return (
    <section>
      <h2>1. Provider 마다 다른 스토어</h2>
      <p>
        <code>BearCounter</code> 는 어느 스토어를 보는지 모른다. 트리에서 가장 가까운{' '}
        <code>BearProvider</code> 가 정해준다 — 전역 스토어라면 불가능한 일이다.
      </p>
      <BearProvider bears={2}>
        <BearPanel label="숲 A — bears={2}" />
      </BearProvider>
      <BearProvider bears={10}>
        <BearPanel label="숲 B — bears={10}" />
      </BearProvider>
      <BearProvider>
        <BearPanel label="숲 C — props 없음 (DEFAULT_PROPS)" />
      </BearProvider>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2. 왜 useState(() => ...) 로 감싸야 하는가
// ─────────────────────────────────────────────────────────────────────

function RerenderLab() {
  const [tick, setTick] = useState(0);

  return (
    <section>
      <h2>2. 왜 useState(() =&gt; ...) 로 감싸는가</h2>
      <p>
        양쪽 곰을 몇 마리 늘린 뒤 아래 버튼으로 <b>부모만</b> 리렌더시켜 보라.
        <br />
        <button onClick={() => setTick((value) => value + 1)}>부모 리렌더 ({tick})</button>
      </p>
      <NaiveBearProvider>
        <BearPanel label="틀린 쪽 — 렌더마다 createBearStore()" />
      </NaiveBearProvider>
      <BearProvider>
        <BearPanel label="맞는 쪽 — useState(() => createBearStore())" />
      </BearProvider>
      <p>
        <small>
          틀린 쪽은 부모가 리렌더될 때마다 스토어가 통째로 갈아치워져 늘린 곰이 사라진다. 메모리
          누수가 아니라 <b>상태 유실 버그</b>다(옛 스토어는 아무도 참조하지 않으니 GC 된다). TODO ①
          을 채우기 전에는 두 상자가 똑같이 망가진다.
        </small>
      </p>
    </section>
  );
}

export default function InitializeStateWithProps() {
  return (
    <>
      <p>
        스토어의 초기값을 모듈이 아니라 <b>쓰는 쪽</b>이 정하게 만드는 배선 — 의존성 주입(DI). 14
        에서 &quot;요청 데이터는 스토어를 만들 때 넣어야 한다&quot;고 결론 냈던 그 &quot;넣는
        방법&quot;이 이것이다.
      </p>

      <IsolationLab />
      <RerenderLab />

      <Notes
        points={[
          <>
            조각은 셋뿐이다 — <b>팩토리</b>(<code>createBearStore(initProps)</code>), <b>Context</b>
            (<code>createContext&lt;BearStore | null&gt;(null)</code>), <b>커스텀 훅</b>(
            <code>useBearContext</code>). 14 에서 이미 다 나왔고, 여기서 새로 붙는 건{' '}
            <code>useState(() =&gt; ...)</code> 로 감싼 <b>Provider 래퍼</b> 하나다.
          </>,
          <>
            <code>type BearStore = ReturnType&lt;typeof createBearStore&gt;</code> — 스토어 타입을
            손으로 쓰지 않고 팩토리에서 뽑아낸다. 팩토리의 상태 모양이 바뀌면 Context 타입도 따라
            바뀐다.
          </>,
          <>
            Context 에 담긴 것은 <b>상태가 아니라 스토어 손잡이</b>다. 스토어 객체 참조는 바뀌지
            않으므로 Context 가 유발하는 리렌더는 0회이고, 값 변화 감지는 여전히 zustand 의
            subscribe + selector 가 한다. Context 만으로 전역 상태를 만들 때 생기는 &quot;Provider
            아래 전부 리렌더&quot; 문제를 물려받지 않는 이유다.
          </>,
          <>
            <b>문서 원문의 함정</b>:{' '}
            <code>
              addBear: () =&gt; set((state) =&gt; ({'{'} bears: ++state.bears {'}'}))
            </code>{' '}
            — <code>++state.bears</code> 는 상태 객체를 직접 건드린다. 결과가 우연히 맞아 보여도
            06(Immutable state and merging)에서 본 원칙에 어긋난다. 이 예제는{' '}
            <code>state.bears + 1</code> 로 바꿔 썼다.
          </>,
          <>
            문서에는 <code>useStore</code> 대신 <code>zustand/traditional</code> 의{' '}
            <code>useStoreWithEqualityFn</code> 을 써서 커스텀 비교 함수를 받는 변형도 있다. 다만 그
            모듈은 <code>use-sync-external-store</code> 패키지를 필요로 하는데 이 프로젝트에는
            설치돼 있지 않아 여기서는 재현하지 않았다. v4 호환 경로이고 v5 에서는{' '}
            <code>useShallow</code> 가 권장이라 <b>몰라도 되는 쪽</b>이다.
          </>,
        ]}
      />
    </>
  );
}
