import { create, type StoreApi, type UseBoundStore } from 'zustand';
import Notes from '../ui/Notes.tsx';

// 공식문서 TypeScript path > Auto Generating Selectors
//
// selector 를 매번 (state) => state.필드 로 쓰는 반복이 지겹다면,
// 스토어의 키를 순회하며 "필드마다 훅 하나" 를 미리 만들어둘 수 있다:
//
//   const rabbits = useRabbitStore.use.rabbits();   // == useRabbitStore((s) => s.rabbits)
//
// 12 와 달리 타입이 어렵지 않다 — WithSelectors 는 이미 아는 두 조각의 조합이다:
//   1) S extends { getState: () => infer T } — 11 에서 쓴 ExtractState 의 정의 그대로
//   2) { [K in keyof T]: () => T[K] } — mapped type. "T 의 모든 키 K 에 대해,
//      키 이름은 그대로 두고 값 타입만 () => T[K] 로 바꾼 새 객체 타입"

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>;
  // 타입은 "모든 키가 준비된 use" 를 약속하지만 런타임은 빈 객체에서 시작한다 —
  // 12 에서 본 "타입은 약속, 구현은 근사치" 가 여기도 반복된다.
  store.use = {} as (typeof store)['use'];
  const use = store.use as Record<string, () => unknown>;

  // TODO ① — 스토어의 현재 키들을 순회하며 use 를 채워라:
  //   for (const k of Object.keys(store.getState())) {
  //     use[k] = () => store((s) => s[k as keyof typeof s]);
  //   }
  //   포인트: use.rabbits 에 담기는 것은 "값" 이 아니라 "구독하는 훅" 이다.
  //   () => store(selector) — 바깥 화살표가 훅, 안쪽이 늘 쓰던 selector.
  for (const k of Object.keys(store.getState())) {
    use[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};

// ─────────────────────────────────────────────────────────────────────
// 데모 — 문서 예제 구조 그대로 (필드 1 + 액션 2)
// ─────────────────────────────────────────────────────────────────────

type RabbitState = {
  rabbits: number;
  increase: (by: number) => void;
  increment: () => void;
};

const useRabbitStoreBase = create<RabbitState>()((set) => ({
  rabbits: 0,
  increase: (by) => set((s) => ({ rabbits: s.rabbits + by })),
  increment: () => set((s) => ({ rabbits: s.rabbits + 1 })),
}));

// 원본 스토어를 감싸 use 네임스페이스가 붙은 스토어를 얻는다.
// (원본도 그대로 훅이다 — createSelectors 는 기능을 "추가" 할 뿐 빼앗지 않는다)
const useRabbitStore = createSelectors(useRabbitStoreBase);

function RabbitPanelInner() {
  // 자동 생성된 selector 훅들 — 각 호출이 그 필드 하나의 구독이다
  const rabbits = useRabbitStore.use.rabbits();
  const increment = useRabbitStore.use.increment();
  const increase = useRabbitStore.use.increase();

  // 같은 값을 기존 방식으로도 구독해 비교
  const classic = useRabbitStore((state) => state.rabbits);

  return (
    <>
      <p>
        <code>use.rabbits()</code> → <strong>{rabbits}</strong> / 기존 방식{' '}
        <code>(state) =&gt; state.rabbits</code> → <strong>{classic}</strong>
      </p>
      <p>
        <button onClick={increment}>토끼 +1</button>{' '}
        <button onClick={() => increase(5)}>토끼 +5</button>
      </p>
    </>
  );
}

function RabbitPanel() {
  const ready = typeof useRabbitStore.use.rabbits === 'function';

  return (
    <section>
      <h2>자동 생성 selector</h2>
      {ready ? (
        <RabbitPanelInner />
      ) : (
        <p>
          <small>
            아직 <code>use</code> 가 비어 있다. TODO ① 을 완성하면 여기에 데모가 나타난다.
          </small>
        </p>
      )}
    </section>
  );
}

export default function AutoGeneratingSelectors() {
  return (
    <>
      <p>
        <code>(state) =&gt; state.필드</code> 반복이 지겨울 때, 스토어 키마다 훅을 미리 만들어{' '}
        <code>use.필드()</code> 로 쓰는 유틸 — <code>createSelectors</code>. 문서가 권하는 건
        어디까지나 <b>선택 사항</b>이다.
      </p>

      <RabbitPanel />

      <Notes
        points={[
          <>
            <code>WithSelectors</code> 는 아는 조각 둘의 조합 — <code>infer T</code> 부분은 11 의{' '}
            <code>ExtractState</code> 정의 그대로이고,{' '}
            <code>{'{ [K in keyof T]: () => T[K] }'}</code> 은 <b>mapped type</b>(키는 유지, 값
            타입만 변환한 새 객체 타입)이다.
          </>,
          <>
            <code>use.rabbits()</code> 는 겉보기엔 평범한 함수 호출이지만 <b>훅 호출</b>이다 —
            안에서 <code>store(selector)</code> 구독이 일어난다. 따라서 <b>훅 규칙</b>(컴포넌트
            최상위에서만 호출, 조건문 · 루프 금지)이 그대로 적용된다. 함수처럼 생겨서 조건문 안에
            넣기 쉬운 것이 이 패턴의 대표적인 함정이다.
          </>,
          <>
            런타임은 <code>Object.keys(getState())</code> 순회로 만들어지므로{' '}
            <b>스토어 생성 시점의 키</b>만 커버한다. 파생값이나 여러 필드 조합은 못 만든다 — 그럴 땐
            평소의 selector(+ useShallow)로 돌아간다.
          </>,
          <>
            타입은 &quot;모든 키가 준비된 use&quot; 를 약속하지만 런타임은 빈 객체에 키를 채워넣는다
            — 12 의 <b>&quot;타입은 약속, 구현은 근사치&quot;</b> 전략의 반복. 문서 원문은{' '}
            <code>as any</code> 를 쓰고, 여기서는 lint 를 위해 <code>Record</code> 캐스트로 같은
            일을 했다.
          </>,
          <>
            vanilla 스토어 버전도 문서에 있다 — 안쪽이 <code>store(selector)</code> 대신{' '}
            <code>useStore(_store, selector)</code> 인 것만 다르다(12 의 bounded hook 과 같은 원리).
            직접 만들기 싫으면 <code>zustood</code> 등 서드파티 라이브러리도 있다.
          </>,
        ]}
        questions={[
          {
            q: 'use 는 zustand 에 기본 내장된 것인가, 아니면 공통 모듈처럼 직접 만들어 쓰는 것인가?',
            a: (
              <>
                <b>내장이 아니다.</b> createStore 가 만드는 스토어의 전부는{' '}
                <code>{'{ setState, getState, getInitialState, subscribe }'}</code> 4개다
                (vanilla.mjs 실측). React 용 create 는 여기에 &quot;훅으로 호출 가능&quot; 만
                얹는다. <code>use</code> 는 이 예제의 <code>store.use = ...</code> 줄이 태어나게 한{' '}
                <b>우리 쪽 확장</b>이고, 문서 제목이 &quot;Create the following function&quot; 인
                이유다.
                <br />
                <br />
                실무 도입 형태: ① 대부분은 유틸 없이 selector 를 직접 쓴다(가장 흔함). ② 도입한다면{' '}
                <code>src/lib/createSelectors.ts</code> 같은 <b>공통 모듈 하나</b>를 전 스토어가
                공유하고, 각 스토어 파일에서 <code>createSelectors(useXxxBase)</code> 로 감싸 export
                한다. ③ zustood 등 서드파티도 있다. 팀 컨벤션 문제이지 필수가 아니다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
