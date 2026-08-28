import { create, useStore, type StateCreator, type StoreMutatorIdentifier } from 'zustand';
import { combine } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { createStore } from 'zustand/vanilla';
import Notes from '../ui/Notes.tsx';

// 공식문서 TypeScript path > Advanced TypeScript Guide
//
// 앞 절반(왜 추론이 안 되나 / 왜 커링인가)은 11 에서 실측까지 끝냈다.
// 여기서 새로 다루는 것은 넷이다:
//
//   1. combine 의 "선의의 거짓말" — set/get 은 첫 인자만이 전체 상태인 척 타입이 잡힌다.
//      대부분 무해하지만 replace 와 Object.keys 에서 함정이 된다. 그리고 이것이
//      "state 를 만드는 미들웨어(combine·redux)에는 커링을 쓰지 말라" 는 권장의 배경이다.
//   2. 미들웨어 겹치기 — create 바로 안에서 쓸 것, devtools 는 가장 바깥에.
//   3. 커스텀 미들웨어의 이중 타입 패턴 — 공개 타입(Mps/Mcs 통과 약속) 과
//      구현 타입([] 기준 근사) 을 따로 쓰고 as unknown as 로 잇는다.
//      create 자신이 쓰는 전략과 같다: 타입은 약속, 구현은 캐스트로 맞춘 근사치.
//   4. vanilla store + bounded hook — create = createStore + useStore 결합임을 손으로 재현.

// ─────────────────────────────────────────────────────────────────────
// 1. combine 의 거짓말 — replace 함정 실증
// ─────────────────────────────────────────────────────────────────────

// tsc 실측 (2026-08-28): combine 안에서
//   - get().addDuck        → 타입 에러 (get() 타입은 { ducks: number } 뿐이라고 주장)
//   - set({ ducks: 0 }, true) → 컴파일 통과 (타입상 그게 "전체 상태" 라고 믿으므로)
// node 실측: replace 실행 후 Object.keys → ['ducks'] 만 남고 액션은 전부 undefined.
const useDuckStore = create(
  combine({ ducks: 2 }, (set) => ({
    addDuck: () => set((s) => ({ ducks: s.ducks + 1 })),
    dangerousReset: () => {
      // TODO ① — set({ ducks: 0 }, true) 를 넣어라.
      //   이 한 줄이 "컴파일된다는 것 자체" 가 함정이다. 제대로 타입이 잡힌 스토어라면
      //   replace 에 액션까지 포함한 전체 상태를 요구해서 이런 실수를 막아준다.
      set({ ducks: 0 }, true);
    },
  })),
);

function DuckPanel() {
  // 09 의 useShallow 복습 — Object.keys 는 매번 새 배열이므로 얕은 비교로 감싼다.
  const keys = useDuckStore(useShallow((state) => Object.keys(state)));
  const ducks = useDuckStore((state) => state.ducks);
  const addDuck = useDuckStore((state) => state.addDuck);
  const dangerousReset = useDuckStore((state) => state.dangerousReset);

  return (
    <section>
      <h2>1. combine 의 거짓말 — replace 함정</h2>
      <p>
        오리 <strong>{ducks}</strong>마리 / 타입이 주장하는 상태 모양:{' '}
        <code>{'{ ducks: number }'}</code> / 실제 런타임 키: <code>{keys.join(', ')}</code>
      </p>
      <p>
        <code>addDuck</code> 의 런타임 타입: <strong>{typeof addDuck}</strong>
      </p>
      <p>
        <button onClick={addDuck} disabled={typeof addDuck !== 'function'}>
          오리 +1
        </button>{' '}
        <button onClick={dangerousReset} disabled={typeof dangerousReset !== 'function'}>
          replace 로 리셋 (함정!)
        </button>{' '}
        <button onClick={() => useDuckStore.setState(useDuckStore.getInitialState(), true)}>
          getInitialState 로 복구
        </button>
      </p>
      <p>
        <small>
          <b>replace 로 리셋</b>을 누르면 액션까지 전부 지워져 버튼들이 죽는다 — 컴파일은
          통과했는데도. 복구 버튼은 v5 의 <code>getInitialState()</code> 로 initializer 가 만든 최초
          상태(액션 포함)를 통째로 되돌린다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2. 커스텀 미들웨어 — logger (스토어 타입을 바꾸지 않는 미들웨어)
// ─────────────────────────────────────────────────────────────────────

// 로그를 화면에 보여주기 위한 스토어 (04 의 "액션 없는 스토어" 패턴)
type LogEntry = { id: number; text: string };
const useLogStore = create<{ entries: LogEntry[] }>()(() => ({ entries: [] }));

let logId = 0;
const recordLog = (name: string | undefined, state: unknown) => {
  logId += 1;
  useLogStore.setState((prev) => ({
    entries: [
      ...prev.entries,
      { id: logId, text: `${name ?? 'store'} → ${JSON.stringify(state)}` },
    ].slice(-6),
  }));
};

// 공개 타입 — "나는 미들웨어 조합(Mps/Mcs) 사이 어디에 껴도 그대로 통과시킨다" 는 약속.
// 05 에서 본 StateCreator<T, Mis, Mos, U> 의 Mis/Mos 가 여기서 전부 쓰인다.
type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string,
) => StateCreator<T, Mps, Mcs>;

// 구현 타입 — 구현은 변형 목록을 다룰 수 없으니 빈 목록 [] 기준으로 단순하게.
type LoggerImpl = <T>(f: StateCreator<T, [], []>, name?: string) => StateCreator<T, [], []>;

// TODO ② (완료) — set 을 감싼 loggedSet 을 만들어 f 에 넘긴다.
// 갱신 경로가 둘이라 둘 다 감싼다:
//   - loggedSet: 액션들이 쓰는 set (initializer 파라미터)
//   - store.setState: useCamelStore.setState 처럼 스토어 API 로 직접 부르는 경로
const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...a) => {
    set(...(a as Parameters<typeof set>)); // 원래 set 을 그대로 호출하고
    recordLog(name, get()); // 호출 직후의 상태를 기록한다
  };

  const setState = store.setState; // 원본을 붙들어둔 뒤
  store.setState = (...a) => {
    setState(...(a as Parameters<typeof setState>)); // 원본을 호출하고
    recordLog(name, store.getState()); // 마찬가지로 기록
  };

  // 핵심: f(진짜 initializer)에게 "가짜 set" 을 쥐여준다.
  // 이후 모든 액션은 자기도 모르게 loggedSet 을 부르게 된다.
  return f(loggedSet, get, store);
};

// 거짓말 캐스트 — create 자신이 쓰는 전략과 같다. 타입은 약속, 구현은 근사치.
const logger = loggerImpl as unknown as Logger;

type CamelState = {
  camels: number;
  addCamel: () => void;
};

// TODO ③ (완료) — logger 를 끼웠다. initializer 는 한 글자도 안 바뀌었다는 것이 포인트 —
// 미들웨어는 initializer 를 감싸는 함수일 뿐이다. Logger 의 공개 타입이 Mps/Mcs 를
// 통과시키므로 persist 등과 겹쳐도 그대로 동작한다.
const useCamelStore = create<CamelState>()(
  logger(
    (set) => ({
      camels: 0,
      addCamel: () => set((s) => ({ camels: s.camels + 1 })),
    }),
    'camel-store',
  ),
);

function LoggerPanel() {
  const camels = useCamelStore((state) => state.camels);
  const addCamel = useCamelStore((state) => state.addCamel);
  const entries = useLogStore((state) => state.entries);

  return (
    <section>
      <h2>2. 커스텀 미들웨어 — logger</h2>
      <p>
        낙타 <strong>{camels}</strong>마리
      </p>
      <p>
        <button onClick={addCamel}>낙타 +1</button>{' '}
        <button onClick={() => recordLog('수동 테스트', { hello: 'world' })}>
          로그 패널 테스트
        </button>{' '}
        <button onClick={() => useLogStore.setState({ entries: [] })}>로그 지우기</button>
      </p>
      <h3>set 호출 로그 (최근 6개)</h3>
      {entries.length === 0 ? (
        <p>
          <small>아직 로그가 없다. 낙타 +1 을 누르면 logger 가 여기에 기록한다.</small>
        </p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              <code>{entry.text}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 3. vanilla store + bounded hook — create 를 손으로 분해하기
// ─────────────────────────────────────────────────────────────────────

type CounterState = {
  count: number;
  inc: () => void;
};

// React 가 전혀 없는 순수 스토어. 커링 형태는 create 와 똑같이 쓴다.
const counterStore = createStore<CounterState>()((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));

// React 밖에서도 쓸 수 있다는 증거 — 모듈 로드 시점에 한 번 올려둔다.
counterStore.getState().inc();

// TODO ④ (완료) — bounded hook. create 가 내부에서 해주던 결합(react.mjs 의 createImpl)을
// 손으로 재현한 것이다. 스토어를 클로저로 붙들고 selector 만 받는다.
const useCounter = <T,>(selector: (state: CounterState) => T): T =>
  useStore(counterStore, selector);

function CounterPanel() {
  const count = useCounter((state) => state.count);
  const inc = useCounter((state) => state.inc);

  return (
    <section>
      <h2>3. vanilla store + bounded hook</h2>
      <p>
        카운트 <strong>{count}</strong>{' '}
        <small>(모듈 로드 시점에 React 밖에서 이미 1 이 됐다)</small>
      </p>
      <p>
        <button onClick={inc}>+1</button>
      </p>
      <p>
        <small>
          <code>create</code> = <code>createStore</code>(vanilla) + <code>useStore</code> 훅 결합.
          오늘 <code>react.mjs</code> 소스에서 본 <code>createImpl</code> 이 정확히 이 일을 한다.
        </small>
      </p>
    </section>
  );
}

export default function AdvancedTypeScript() {
  return (
    <>
      <p>
        커링의 &quot;왜&quot; 는 11 에서 끝냈다. 이번에는 그 너머 — <b>combine 의 거짓말</b>과
        replace 함정, <b>커스텀 미들웨어의 이중 타입 패턴</b>, 그리고 <b>vanilla store</b> 로{' '}
        <code>create</code> 를 손으로 분해해본다.
      </p>

      <DuckPanel />
      <LoggerPanel />
      <CounterPanel />

      <Notes
        points={[
          <>
            combine 안의 <code>set</code>/<code>get</code> 은 <b>첫 인자만이 전체 상태인 척</b>{' '}
            타입이 잡힌다(선의의 거짓말). 부분집합이라 대부분 무해하지만, <code>set(x, true)</code>
            (replace) 가 컴파일되면서 런타임에 액션을 지우는 함정과 <code>
              Object.keys(get())
            </code>{' '}
            의 키 개수가 어긋나는 함정이 있다.
          </>,
          <>
            combine · redux 처럼 <b>state 를 만드는 미들웨어에는 커링을 쓰지 않는다</b> — T 가
            인자에서 확정되어 추론이 되므로, 수동 명시(커링)가 필요 없고 권장되지도 않는다.
          </>,
          <>
            미들웨어 겹치기: <code>create</code> <b>바로 안에서</b> 조합할 것(밖으로 빼면 문맥
            추론이 끊긴다), <b>devtools 는 가장 바깥에</b>(setState 에 덧붙이는 액션 이름 파라미터를
            다른 미들웨어가 덮지 않도록).
          </>,
          <>
            커스텀 미들웨어는 타입을 두 벌 쓴다 — <b>공개 타입</b>(Mps/Mcs 를 그대로 통과시킨다는
            약속)과 <b>구현 타입</b>([] 기준 근사), 그리고 <code>as unknown as</code> 캐스트.{' '}
            <code>create</code> 자신이 쓰는 전략과 같다: <b>타입은 약속, 구현은 근사치</b>.
          </>,
          <>
            <code>StateCreator&lt;T, Mis, Mos, U&gt;</code> 완전체 — <b>Mis</b> 는 내가 받는 시점에
            이미 적용된 변형 목록(<code>set</code> 의 모양을 바꾼다), <b>Mos</b> 는 내가 만들어낼
            변형 목록, <b>U</b> 는 반환 조각(05 슬라이스). 미들웨어별 mutator 이름은 문서 맨 끝
            레퍼런스에 있다 — persist 는 <code>[&apos;zustand/persist&apos;, 저장되는 타입]</code>.
          </>,
          <>
            <code>create</code> = vanilla <code>createStore</code> + <code>useStore</code> 훅 결합.
            bounded hook 은 그 결합을 손으로 재현한 것으로, React 밖(테스트 · 이벤트 핸들러)과
            스토어를 공유할 때의 기본 구조다.
          </>,
        ]}
      />
    </>
  );
}
