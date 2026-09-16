import { create as actualCreate, type StateCreator } from 'zustand';
import Notes from '../ui/Notes.tsx';

// 공식문서 Testing and quality > How to reset state
//
// 문서는 45줄짜리로 제일 짧지만 실무 빈도는 가장 높다 — 로그아웃, 모달 닫기,
// 라우트 이탈, 그리고 테스트 사이 정리(17 에서 이어진다).
//
// 핵심은 12 에서 이미 본 한 줄이다:  set(store.getInitialState())
// initializer 의 세 번째 인자 store 가 스토어 API(= create 가 돌려주는 그 객체)다.
// vanilla.mjs 의 createState(setState, getState, api) 에서 api 가 그대로 넘어온다.

// ─────────────────────────────────────────────────────────────────────
// 0. create 래퍼 — 스토어마다 리셋 함수를 모아둔다
// ─────────────────────────────────────────────────────────────────────

const storeResetFns = new Set<() => void>();

const createUncurried = <T,>(stateCreator: StateCreator<T>) => {
  const store = actualCreate(stateCreator);

  // 이 스토어를 "전체 초기화" 대상으로 등록한다. 여기서 Set 에 들어가는 것은
  // 스토어가 아니라 "이 스토어 하나를 되돌리는 법" 을 적어둔 함수다. 화살표 함수가
  // 바로 위의 store 변수를 클로저로 붙들기 때문에, create 를 부를 때마다 서로 다른
  // 스토어를 가리키는 쪽지가 한 장씩 쌓인다.
  //
  // 이 줄이 도는 시점은 로그아웃이 아니라 "스토어가 태어날 때"(= 모듈 로드) 다.
  // 스토어가 스스로 등록하므로 나중에 스토어를 추가해도 등록을 잊을 자리가 없다.
  storeResetFns.add(() => {
    store.setState(store.getInitialState(), true);
  });

  return store;
};

/** zustand 의 create 를 가로챈 버전. 커링/비커링 두 형태를 모두 받는다. */
const create = (<T,>(stateCreator?: StateCreator<T>) =>
  stateCreator ? createUncurried(stateCreator) : createUncurried) as typeof actualCreate;

const resetAllStores = () => {
  storeResetFns.forEach((resetFn) => resetFn());
};

// ─────────────────────────────────────────────────────────────────────
// 1. 손으로 쓴 reset 은 반드시 뒤처진다
// ─────────────────────────────────────────────────────────────────────

type CounterState = {
  count: number;
  label: string;
  /** 초기 상태에는 없는 필드. 2번에서 setState 로 심는다. */
  ghost?: string;
  inc: () => void;
  rename: () => void;
  reset: () => void;
  hardReset: () => void;
};

const useCounterStore = create<CounterState>()((set, get, store) => {
  return {
    count: 0,
    label: '기본',

    inc: () => set((state) => ({ count: state.count + 1 })),
    rename: () => set({ label: `수정됨 ${get().count}` }),

    // 초기값을 손으로 적지 않는다. 필드가 늘어도 이 줄은 그대로다.
    // 다만 set 은 병합이라, 초기 상태에 없던 키는 지워지지 않는다(2번 패널).
    reset: () => set(store.getInitialState()),

    // 두 번째 인자가 replace 플래그. 병합이 아니라 통째로 갈아끼우므로
    // 초기 상태에 없던 키까지 사라진다.
    hardReset: () => set(store.getInitialState(), true),
  };
});

function CounterPanel() {
  const { count, label, inc, rename, reset } = useCounterStore();

  return (
    <section>
      <h2>1. 손으로 쓴 reset 은 뒤처진다</h2>
      <p>
        카운트 <strong>{count}</strong> / 라벨 <strong>{label}</strong>
      </p>
      <p>
        <button onClick={inc}>+1</button> <button onClick={rename}>라벨 바꾸기</button>{' '}
        <button onClick={reset}>reset</button>
      </p>
      <p>
        <small>
          둘 다 바꾼 뒤 <code>reset</code> 을 눌러 보라. 카운트만 돌아오고 <b>라벨은 그대로</b>다 —
          초기값을 손으로 적어둔 탓이다. <code>store.getInitialState()</code> 는 &quot;스토어가
          태어날 때의 그 객체&quot;를 통째로 돌려주므로 필드가 늘어도 따라올 필요가 없다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2. merge 냐 replace 냐 — reset 이 못 지우는 것
// ─────────────────────────────────────────────────────────────────────

function GhostPanel() {
  const ghost = useCounterStore((state) => state.ghost);
  const reset = useCounterStore((state) => state.reset);
  const hardReset = useCounterStore((state) => state.hardReset);

  return (
    <section>
      <h2>2. merge 냐 replace 냐</h2>
      <p>
        초기 상태에 없던 필드: <strong>{ghost ?? '(없음)'}</strong>
      </p>
      <p>
        <button onClick={() => useCounterStore.setState({ ghost: '👻' })}>필드 심기</button>{' '}
        <button onClick={reset}>reset (merge)</button>{' '}
        <button onClick={hardReset}>hardReset (replace)</button>
      </p>
      <p>
        <small>
          <code>set(초기상태)</code> 는 <b>병합</b>이라 초기 상태에 없던 키는 살아남는다. 지우려면{' '}
          <code>set(초기상태, true)</code> 로 <b>교체</b>해야 한다. 실무에서 임시 플래그나 에러
          메시지를 <code>setState</code> 로 심어두면 이 차이에 걸린다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 3. 로그아웃 — 스토어 전부를 한 번에
// ─────────────────────────────────────────────────────────────────────

const useUserStore = create<{ name: string; login: () => void }>()((set) => ({
  name: '손님',
  login: () => set({ name: '한범' }),
}));

const useCartStore = create<{ items: number; add: () => void }>()((set) => ({
  items: 0,
  add: () => set((state) => ({ items: state.items + 1 })),
}));

const usePrefsStore = create<{ dark: boolean; toggle: () => void }>()((set) => ({
  dark: false,
  toggle: () => set((state) => ({ dark: !state.dark })),
}));

function LogoutPanel() {
  const { name, login } = useUserStore();
  const { items, add } = useCartStore();
  const { dark, toggle } = usePrefsStore();

  return (
    <section>
      <h2>3. 로그아웃 — 스토어 전부를 한 번에</h2>
      <p>
        사용자 <strong>{name}</strong> / 장바구니 <strong>{items}</strong> / 다크모드{' '}
        <strong>{dark ? 'on' : 'off'}</strong>
      </p>
      <p>
        <button onClick={login}>로그인</button> <button onClick={add}>담기</button>{' '}
        <button onClick={toggle}>다크모드</button>
      </p>
      <p>
        <button onClick={resetAllStores}>로그아웃 (resetAllStores)</button>
      </p>
      <p>
        <small>
          &quot;로그아웃했는데 이전 사용자 데이터가 남아 있다&quot; 는 버그의 표준 해법이다.
          스토어가 늘어도 <code>create</code> 를 거치기만 하면 자동으로 대상에 포함된다 — 등록을
          잊을 자리가 없다. 위 1·2번의 카운터도 같은 <code>create</code> 로 만들었으니 함께
          초기화된다.
        </small>
      </p>
    </section>
  );
}

export default function HowToResetState() {
  return (
    <>
      <p>
        <code>set(store.getInitialState())</code> 한 줄이 전부다. 다만 <b>병합이냐 교체냐</b>,
        그리고 <b>스토어가 여러 개일 때</b>에서 갈린다.
      </p>

      <CounterPanel />
      <GhostPanel />
      <LogoutPanel />

      <Notes
        points={[
          <>
            initializer 의 세 번째 인자가 스토어 API 다 —{' '}
            <code>create((set, get, store) =&gt; ...)</code>. vanilla.mjs 의{' '}
            <code>createState(setState, getState, api)</code> 에서 넘어오는 그 <code>api</code>{' '}
            이고, <code>getInitialState</code> 는 <b>생성 시점에 고정된 const</b> 라 아무리{' '}
            <code>setState</code> 를 해도 변하지 않는다(14 에서 본 그 성질이 여기서는 장점이 된다).
          </>,
          <>
            <b>merge vs replace 실측</b>: 초기 상태에 없던 <code>ghost</code> 를 심은 뒤 —{' '}
            <code>set(초기상태)</code> → <code>{'{count:0, reset:[fn], ghost:"👻"}'}</code>{' '}
            (남는다), <code>set(초기상태, true)</code> → <code>{'{count:0, reset:[fn]}'}</code>{' '}
            (지워진다). 문서의 기본형은 merge, 고급형(resetAllStores)은 replace 를 쓴다 — 같은
            &quot;리셋&quot; 인데 결과가 다르다.
          </>,
          <>
            replace 로 리셋하면 <code>state === getInitialState()</code> 가 <b>true</b> 가
            된다(실측). 그래서 연달아 한 번 더 리셋하면 <code>setState</code> 의{' '}
            <code>Object.is(nextState, state)</code> 가드에 걸려 <b>알림이 0회</b>다 — 이미 초기
            상태이니 맞는 동작이지만, 이 상태에서 상태 객체를 직접 손대면 초기 상태 자체가 오염된다.
            불변으로 다루라는 06 의 원칙이 여기서도 걸린다.
          </>,
          <>
            <b>문서 원문의 오류</b> 두 가지. ①{' '}
            <code>
              import {'{'} create: actualCreate {'}'} from &apos;zustand&apos;
            </code>{' '}
            — import 구문에는 <code>:</code> 가 아니라 <code>as</code> 를 써야 한다. node 에서{' '}
            <code>SyntaxError: Unexpected token &apos;:&apos;</code> 로 아예 파싱되지 않는다(실측).
            ② 고급형 래퍼는 <code>create&lt;T&gt;()(fn)</code> 커링 형태만 받는다. 이 예제는 두
            형태를 모두 받도록 고쳤다.
          </>,
          <>
            <code>persist</code> 를 쓰는 스토어는 <b>리셋해도 localStorage 가 그대로 남는다.</b>{' '}
            저장소까지 비우려면 <code>useStore.persist.clearStorage()</code> 가 따로 필요하다 (18
            에서 다룬다). 로그아웃 처리에서 가장 자주 빠뜨리는 자리다.
          </>,
          <>
            여기서 만든 <code>storeResetFns</code> 패턴이{' '}
            <b>17(Testing)의 mock 과 글자 그대로 같다.</b> 테스트에서는 <code>afterEach</code> 가,
            여기서는 로그아웃 버튼이 부를 뿐이다 — &quot;모듈 전역 스토어를 경계마다 비운다&quot; 는
            같은 문제의 두 얼굴이다.
          </>,
        ]}
        questions={[
          {
            q: 'resetAllStores 에서 storeResetFns.add(...) 는 왜 필요한가?',
            a: (
              <>
                <code>add</code> 는 <code>Set</code> 에 원소를 넣는 메서드다(배열의{' '}
                <code>push</code> 와 같고, 중복이 안 쌓이는 점만 다르다). 중요한 건{' '}
                <b>거기에 스토어가 아니라 함수가 들어간다</b>는 것 — 실측으로 상자 안을 열면{' '}
                <code>[&apos;function&apos;, &apos;function&apos;, &apos;function&apos;]</code>{' '}
                이다. &quot;이 스토어 하나를 되돌리는 법&quot;을 적은 쪽지들이고, 각 쪽지는 화살표
                함수의 <b>클로저</b>로 자기 <code>store</code> 를 붙들고 있다.
                <br />
                <br />
                <b>도는 시점</b>도 헷갈리기 쉽다. <code>add</code> 는 로그아웃 때가 아니라{' '}
                <b>스토어가 태어날 때(= 모듈 로드)</b> 한 번 돈다. 실측하면 <code>create()</code> 를
                부를 때마다 Set 크기가 1 → 2 → 3 으로 늘고, 로그아웃은 그 상자를 순회하기만 한다.
                스토어가 스스로 등록하는 셈이다(self-registration).
                <br />
                <br />
                <b>왜 손으로 나열하지 않나.</b> 나열해도 동작은 같다. 하지만 그건 TODO ① 과 똑같은
                문제다 — ① 에서 <code>set({'{ count: 0 }'})</code> 가 <code>label</code> 을
                빠뜨렸듯, 스토어를 새로 만들 때 <code>resetAllStores</code> 에 한 줄 추가하는 것을
                잊는다. 그리고 <b>잊힌 그 스토어가 이전 사용자의 데이터를 흘린다.</b> 등록 방식에는
                잊을 자리가 없다.
                <br />
                <br />
                실무에서 하나 더 — <b>순환 import</b>를 피한다. 손으로 나열하면{' '}
                <code>resetAllStores</code> 가 모든 스토어를 import 해야 하는데, 스토어 쪽에
                로그아웃 액션을 두려면 거꾸로 import 해야 해서 순환이 생긴다. 등록 방식에서는
                스토어가 <code>resetAllStores</code> 의 존재를 몰라도 되므로 의존 방향이 한쪽이다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
