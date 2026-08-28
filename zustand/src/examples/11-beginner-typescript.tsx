import { useRef } from 'react';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import Notes from '../ui/Notes.tsx';

// 공식문서 TypeScript path > Beginner TypeScript Guide
//
// 01 부터 지금까지 이유 없이 써온 커링 형태 create<T>()(...) 의 "왜" 를 드디어 푼다.
//
// 핵심은 create 의 제네릭이 T 하나가 아니라 <T, Mos> 두 개라는 것이다.
// (node_modules/zustand/esm/react.d.mts)
//
//   type Create = {
//     <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
//       initializer: StateCreator<T, [], Mos>): UseBoundStore<Mutate<StoreApi<T>, Mos>>
//     <T>(): <Mos extends ...>(initializer: StateCreator<T, [], Mos>) => ...
//   }
//
// Mos 는 미들웨어가 스토어에 덧붙이는 변형 목록이다 — 05 에서 본 StateCreator 의
// 타입 인자 4개 중 세 번째(Mos)가 바로 이것. persist 를 끼우면 initializer 의 실제
// 타입이 StateCreator<T, [], [['zustand/persist', T]]] 가 된다.
//
// 문제는 TS 의 규칙: 제네릭은 "전부 명시하거나 전부 추론" 만 가능하다 (부분 명시 불가,
// microsoft/TypeScript#10571). create<T>(...) 라고 쓰는 순간 Mos 는 기본값 [] 로
// 고정되고, persist 가 만든 [['zustand/persist', T]] 는 [] 에 안 맞아 에러가 난다.
//
// 커링이 그 우회다. create<T>() 는 T 만 고정한 새 함수를 돌려주고, 그 함수를 부를 때
// Mos 가 새로 추론될 기회를 얻는다. 런타임에서는 아무 일도 안 한다
// (react.mjs: createState ? createImpl(createState) : createImpl — 인자가 없으면
// 구현 함수 자신을 그대로 돌려줄 뿐이다).

// ─────────────────────────────────────────────────────────────────────
// 1. 커링 실측 — 네 가지 형태를 tsc 로 검사한 결과 (2026-08-28, TS + zustand v5)
// ─────────────────────────────────────────────────────────────────────

const CURRY_PROBES: { form: string; result: string; why: string }[] = [
  {
    form: 'create((set) => ({ ... }))',
    result: 'T 가 unknown 으로 추론',
    why: 'StateCreator 는 T 를 반환하면서(공변) set/get 으로 받기도 한다(반변). 양쪽에 다 걸린 제네릭(불변)은 TS 가 추론을 포기한다 — 닭과 달걀.',
  },
  {
    form: 'create<T>((set) => ({ ... }))',
    result: '통과',
    why: '미들웨어가 없으면 Mos 는 기본값 [] 로 충분하다. 커링 없이도 실제로 컴파일된다.',
  },
  {
    form: 'create<T>(persist(...))',
    result: '에러',
    why: "T 를 명시하면 Mos 도 명시하거나 기본값이어야 한다(부분 명시 불가). persist 의 [['zustand/persist', T]] 가 [] 에 안 맞아 거부된다.",
  },
  {
    form: 'create<T>()(persist(...))',
    result: '통과',
    why: '첫 호출이 T 만 고정하고, 둘째 호출에서 Mos 가 새로 추론된다. 그래서 어떤 미들웨어든 그대로 낄 수 있다.',
  },
];

// 실측 재현 — set 을 쓰는 순간 추론이 무너진다.
// 상태만 있는 create(() => ({ n: 0 })) 은 추론이 된다(제네릭이 반환 위치에만 등장).
// set 이 등장해 T 를 "받기" 시작하면 불변이 되어 unknown 으로 떨어진다.
const useUntypedStore = create((set) => ({
  untyped: 0,
  bump: () => set({}),
}));

// @ts-expect-error — T 가 unknown 이라 어떤 필드에도 접근할 수 없다.
// 그런데 아래 CurryPanel 에서 보듯 런타임에는 값이 멀쩡히 나온다 —
// Vite dev 서버는 타입 검사를 하지 않고(esbuild 는 타입을 지울 뿐), TS 는 런타임에 없다.
const untypedValue: number = useUntypedStore.getState().untyped;

function CurryPanel() {
  return (
    <section>
      <h2>1. 커링 create&lt;T&gt;()(...) 의 이유 — 실측</h2>
      <table>
        <thead>
          <tr>
            <th>형태</th>
            <th>tsc 결과</th>
            <th>이유</th>
          </tr>
        </thead>
        <tbody>
          {CURRY_PROBES.map((probe) => (
            <tr key={probe.form}>
              <td>
                <code>{probe.form}</code>
              </td>
              <td>
                <strong>{probe.result}</strong>
              </td>
              <td>
                <small>{probe.why}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <small>
          위쪽 <code>useUntypedStore</code> 는 타입 인자 없이 만들어 T 가 unknown 이지만, 런타임
          값은 정상이다: <code>untyped = {untypedValue}</code>. 타입은 컴파일 타임 이야기일 뿐이다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2. 타입 붙인 스토어 — typeof initialState 로 상태 모양의 단일 소스 만들기
// ─────────────────────────────────────────────────────────────────────

// 상태 필드를 interface 에 한 번, 초기값에 또 한 번 적으면 둘이 어긋날 수 있다.
// 초기값 객체를 먼저 두고 typeof 로 타입을 뽑으면 소스가 하나가 된다.
const initialState = { bears: 2, foodPerBear: 3 };

type BearState = typeof initialState & {
  increase: (by: number) => void;
  reset: () => void;
};

// TODO ① — 커링 형태로 스토어를 완성해라.
//   increase 는 set 의 함수형 갱신(03 복습), reset 은 initialState 를 그대로 넘기면 된다.
//   set 콜백의 state 파라미터에 타입 표기가 필요 없다는 것도 확인할 것 —
//   create<BearState>() 가 고정한 T 에서 흘러들어온다.
const useBearStore = create<BearState>()(() => ({
  ...initialState,
  increase: () => {
    // TODO ① — (by) 파라미터를 받아라. 타입 표기 없이도 number 로 잡히는지 확인할 것.
  },
  reset: () => {
    // TODO ①
  },
}));

// ─────────────────────────────────────────────────────────────────────
// 3. ExtractState — 스토어에서 타입을 거꾸로 뽑기 / selector 로 파생값
// ─────────────────────────────────────────────────────────────────────

// TODO ② — BearState 를 직접 참조하지 말고 스토어에서 타입을 뽑아내라.
//   힌트: import { create, type ExtractState } from 'zustand' 로 임포트를 바꾸고,
//   ExtractState<typeof useBearStore> 로 교체. 타입 정의가 없는 스토어(combine 등)나
//   테스트 · 유틸 함수에서 스토어 타입이 필요할 때 쓰는 도구다.
type BearSnapshot = BearState; // TODO ②

// 스토어 밖의 평범한 함수 — 스냅샷 타입 덕에 자동완성과 오타 검출이 된다.
function describeBears(state: BearSnapshot): string {
  return `곰 ${state.bears}마리, 마리당 꿀 ${state.foodPerBear}병`;
}

function BearPanel() {
  const bears = useBearStore((state) => state.bears);
  const foodPerBear = useBearStore((state) => state.foodPerBear);
  const increase = useBearStore((state) => state.increase);
  const reset = useBearStore((state) => state.reset);

  // TODO ③ — 전체 꿀 병 수(bears * foodPerBear)는 스토어에 저장할 필요가 없다.
  //   selector 안에서 계산해 파생값으로 뽑아라. 결과가 number(원시값)라서
  //   useShallow 없이도 안전하다 — 09 에서 왜 그런지 다뤘다.
  const totalFood = useBearStore(() => 0); // TODO ③

  const renders = useRef(0);
  renders.current += 1;

  return (
    <section>
      <h2>2. 타입 붙인 스토어 · 파생값</h2>
      <p>
        곰 <strong>{bears}</strong>마리 · 마리당 꿀 {foodPerBear}병 → 전부 합쳐 꿀{' '}
        <strong>{totalFood}</strong>병 필요 / 렌더 <strong>{renders.current}</strong>
      </p>
      <p>
        <small>
          <code>describeBears(useBearStore.getState())</code> →{' '}
          {describeBears(useBearStore.getState())}
        </small>
      </p>
      <p>
        <button onClick={() => increase(1)}>곰 +1</button>{' '}
        <button onClick={() => increase(5)}>곰 +5</button> <button onClick={reset}>reset</button>
      </p>
      <p>
        <small>
          <b>reset</b> 은 로그아웃 · 세션 초기화에서 흔한 패턴이다. <code>set(initialState)</code>{' '}
          는 병합(merge)이라 액션 함수들은 살아남는다 — 04 에서 실측한 <code>replace</code> 함정과
          비교해볼 것.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 4. combine — interface 없이 추론에 맡기기 / async 액션
// ─────────────────────────────────────────────────────────────────────

type FishData = { count: number };

// 가짜 API — 진짜 네트워크 대신 0.5초 뒤 물고기 수를 돌려준다
const fetchFishFromApi = (): Promise<FishData> =>
  new Promise((resolve) => {
    setTimeout(() => resolve({ count: Math.floor(Math.random() * 90) + 10 }), 500);
  });

// TODO ④ — combine 은 "초기 상태" 와 "액션" 을 분리해 받고, 타입을 스스로 추론한다.
//   interface 도, 타입 인자도, 커링도 없는 이유를 완성한 뒤 생각해볼 것 —
//   T 가 첫 인자(구체적인 객체)에서 바로 확정되므로 불변 제네릭 문제가 생기지 않는다.
//   완성 후 useFishStore.getState() 에 마우스를 올려 추론된 타입을 확인해라.
// TODO ⑤ — fetchFish 를 async 로 바꿔라: loading true → await 가짜 API → fish 반영
//   → loading false. data 가 FishData 로 타입이 잡히는지 확인할 것.
const useFishStore = create(
  combine({ fish: 0, loading: false }, () => ({
    addFish: () => {
      // TODO ④
    },
    fetchFish: () => {
      void fetchFishFromApi(); // TODO ⑤
    },
  })),
);

function FishPanel() {
  const fish = useFishStore((state) => state.fish);
  const loading = useFishStore((state) => state.loading);
  const addFish = useFishStore((state) => state.addFish);
  const fetchFish = useFishStore((state) => state.fetchFish);

  return (
    <section>
      <h2>3. combine — 추론에 맡기기 · async 액션</h2>
      <p>
        물고기 <strong>{fish}</strong>마리{loading && <em> — 서버에서 가져오는 중…</em>}
      </p>
      <p>
        <button onClick={addFish}>물고기 +1</button>{' '}
        <button onClick={fetchFish} disabled={loading}>
          서버에서 가져오기 (0.5초)
        </button>
      </p>
      <p>
        <small>
          이 스토어에는 interface 가 한 줄도 없다. 그런데도 위 selector 들에서{' '}
          <code>state.fish</code> 자동완성이 되는지 에디터에서 확인해볼 것.
        </small>
      </p>
    </section>
  );
}

export default function BeginnerTypeScript() {
  return (
    <>
      <p>
        01 부터 이유 없이 써온 <code>create&lt;T&gt;()(...)</code> 커링의 정체를 푼다. 핵심:{' '}
        <code>create</code> 의 제네릭은 <code>&lt;T, Mos&gt;</code> 두 개인데 TS 는{' '}
        <b>제네릭의 부분 명시</b>를 허용하지 않는다. 그래서 T 를 명시하는 호출과 Mos 를 추론하는
        호출을 <b>두 단계로 쪼갠 것</b>이 커링이다. 런타임에서는 아무 일도 하지 않는다.
      </p>

      <CurryPanel />
      <BearPanel />
      <FishPanel />

      <Notes
        points={[
          <>
            <code>create((set) =&gt; ...)</code> 에서 T 추론이 실패하는 이유: T 가 반환 위치(공변)와{' '}
            <code>set</code>/<code>get</code> 파라미터 위치(반변)에 동시에 등장하는{' '}
            <b>불변(invariant) 제네릭</b>이기 때문. TS 는 추론을 포기하고 unknown 을 준다. 상태만
            있고 set 을 안 쓰면 추론이 된다 — 경계는 &quot;set 을 쓰는 순간&quot; 이다.
          </>,
          <>
            커링 <code>()(...)</code> 는 TS 의 <b>부분 제네릭 명시 불가</b>(TS#10571) 우회다.{' '}
            <code>create&lt;T&gt;()</code> 가 T 만 고정한 함수를 돌려주고, 둘째 호출에서 미들웨어가
            만드는 Mos 가 새로 추론된다. 미들웨어가 없으면 <code>create&lt;T&gt;(...)</code> 도
            컴파일되지만, 형태 통일을 위해 처음부터 커링으로 쓰는 것이 관례다.
          </>,
          <>
            <code>Mos</code> 는 05 의 <code>StateCreator&lt;T, Mis, Mos, U&gt;</code> 에서 본
            미들웨어 변형 목록이다. <code>persist</code> 를 끼우면{' '}
            <code>[[&apos;zustand/persist&apos;, T]]</code> 가 들어온다.
          </>,
          <>
            <code>typeof initialState</code> 로 상태 모양의 <b>단일 소스</b>를 만든다. 초기값이
            바뀌면 타입이 따라오고, reset 액션도 같은 객체를 재사용한다.
          </>,
          <>
            <code>ExtractState&lt;typeof useStore&gt;</code> 는 스토어에서 타입을 거꾸로 뽑는다.
            테스트 · 유틸 함수 · combine 처럼 타입 선언이 따로 없는 스토어에서 유용하다.
          </>,
          <>
            <code>combine(초기상태, (set) =&gt; 액션들)</code> 은 interface 없이 타입을 추론한다. T
            가 첫 인자의 구체적인 객체에서 확정되므로 불변 제네릭 문제가 아예 생기지 않는다.
          </>,
          <>
            타입은 컴파일 타임 이야기다. T 가 unknown 인 스토어도 <b>런타임에는 멀쩡히 돈다</b> —
            Vite dev 서버(esbuild)는 타입을 지우기만 할 뿐 검사하지 않는다. 검사는{' '}
            <code>pnpm typecheck</code>(tsc)의 몫이다.
          </>,
        ]}
      />
    </>
  );
}
