import { create, useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { devtools } from 'zustand/middleware';
import Notes from '../ui/Notes.tsx';

// 공식문서 Reference > Middlewares > devtools
//
// devtools 는 Redux DevTools 확장에 상태 변화를 흘려보내는 미들웨어다.
// 확장이 없으면 아무 일도 하지 않는다 — middleware.mjs 의 devtoolsImpl 첫머리:
//
//   extensionConnector = (enabled ?? MODE !== 'production') && window.__REDUX_DEVTOOLS_EXTENSION__
//   if (!extensionConnector) return fn(set, get, api);   // ← 그대로 통과
//
// 이 인앱 브라우저에는 확장이 없다. 그래서 여기서는 확장이 있는 척하는 가짜
// 연결기를 window 에 심어, zustand 가 실제로 무엇을 보내는지 화면에 그린다.
// 프로토콜은 세 개뿐이다: connect() · init(state) · send(action, state).

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: {
      connect: (options: unknown) => DevtoolsConnection;
    };
  }
}

type DevtoolsMessage = {
  type: string;
  payload?: { type: string };
  state?: string;
};

type DevtoolsConnection = {
  init: (state: unknown) => void;
  send: (action: { type: string } | null, state: unknown) => void;
  subscribe: (listener: (message: DevtoolsMessage) => void) => () => void;
  unsubscribe: () => void;
};

type Entry = {
  seq: number;
  action: string;
  state: Record<string, unknown>;
};

/** 화면에 그릴 타임라인. 이건 평범한 vanilla 스토어다(devtools 안 붙임). */
const logStore = createStore<{ entries: Entry[] }>(() => ({ entries: [] }));

/** 상태에서 함수를 걷어낸다 — 확장에 보내는 것도 직렬화 가능한 값뿐이다 */
const serializable = (state: unknown): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(state as Record<string, unknown>).filter(
      ([, value]) => typeof value !== 'function',
    ),
  );

const push = (action: string, state: unknown) => {
  logStore.setState((prev) => ({
    entries: [...prev.entries, { seq: prev.entries.length, action, state: serializable(state) }],
  }));
};

/** zustand 가 붙잡아 둔 리스너. 시간여행 메시지를 이쪽으로 밀어넣는다. */
let devtoolsListener: ((message: DevtoolsMessage) => void) | null = null;

// 스토어를 만들기 "전에" 심어야 한다 — devtoolsImpl 이 생성 시점에 window 를 읽는다.
window.__REDUX_DEVTOOLS_EXTENSION__ = {
  connect: () => ({
    init: (state) => push('@@INIT', state),
    send: (action, state) => push(action?.type ?? '(null)', state),
    subscribe: (listener) => {
      devtoolsListener = listener;
      return () => {
        devtoolsListener = null;
      };
    },
    unsubscribe: () => {
      devtoolsListener = null;
    },
  }),
};

// ─────────────────────────────────────────────────────────────────────
// 데모 스토어 — 문서의 jungle 예제
// ─────────────────────────────────────────────────────────────────────

type JungleStore = {
  bears: number;
  fishes: number;
  addBear: () => void;
  addFish: () => void;
};

const useJungleStore = create<JungleStore>()(
  devtools(
    (set) => ({
      bears: 0,
      fishes: 0,

      // TODO ① — set 의 세 번째 인자가 devtools 에 찍히는 액션 이름이다.
      //   set(partial, replace, actionName) 순서라 두 번째는 undefined 로 비워둔다:
      //     set((state) => ({ bears: state.bears + 1 }), undefined, 'jungle/addBear')
      //   지금은 이름을 안 줬다. 타임라인에 무엇으로 찍히는지 먼저 확인할 것.
      addBear: () => set((state) => ({ bears: state.bears + 1 })),

      // 이쪽은 비교용으로 이름을 붙여 두었다.
      addFish: () => set((state) => ({ fishes: state.fishes + 1 }), undefined, 'jungle/addFish'),
    }),
    { name: 'jungle' },
  ),
);

// ─────────────────────────────────────────────────────────────────────
// 시간여행
// ─────────────────────────────────────────────────────────────────────

function jumpTo(entry: Entry) {
  // TODO ② — 확장이 "저 시점으로 돌아가라"고 알릴 때 쓰는 메시지를 흉내 내라.
  //   zustand 는 connection.subscribe(listener) 로 리스너를 걸어두었고,
  //   그 리스너가 DISPATCH / JUMP_TO_ACTION 을 받으면 상태를 되돌린다:
  //
  //     devtoolsListener?.({
  //       type: 'DISPATCH',
  //       payload: { type: 'JUMP_TO_ACTION' },
  //       state: JSON.stringify(entry.state),
  //     });
  //
  //   state 가 문자열인 것이 포인트다 — 확장과는 JSON 으로만 오간다.
  void entry;
  void devtoolsListener; // TODO ② 에서 사용
}

// ─────────────────────────────────────────────────────────────────────
// 화면
// ─────────────────────────────────────────────────────────────────────

function JunglePanel() {
  const { bears, fishes, addBear, addFish } = useJungleStore();

  return (
    <section>
      <h2>1. 스토어</h2>
      <p>
        곰 <strong>{bears}</strong> / 물고기 <strong>{fishes}</strong>
      </p>
      <p>
        <button onClick={addBear}>곰 추가 (이름 없음)</button>{' '}
        <button onClick={addFish}>물고기 추가 (이름 있음)</button>{' '}
        <button onClick={() => useJungleStore.setState({ bears: 0, fishes: 0 })}>
          setState 직접
        </button>
      </p>
    </section>
  );
}

function TimelinePanel() {
  const entries = useStore(logStore, (state) => state.entries);

  return (
    <section>
      <h2>2. zustand 가 확장에 보낸 것</h2>
      {entries.length === 0 ? (
        <p>
          <small>아직 없음</small>
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>action.type</th>
              <th>보낸 상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.seq}>
                <td>{entry.seq}</td>
                <td>
                  <code>{entry.action}</code>
                </td>
                <td>
                  <code>{JSON.stringify(entry.state)}</code>
                </td>
                <td>
                  <button onClick={() => jumpTo(entry)}>이 시점으로</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        <small>
          이 표가 곧 Redux DevTools 패널이 보여주는 것이다. 왼쪽이{' '}
          <code>connection.send(action, state)</code> 의 첫 인자, 오른쪽이 두 번째 인자다.{' '}
          <b>&quot;이 시점으로&quot;</b> 는 TODO ② 를 채우면 동작한다.
        </small>
      </p>
    </section>
  );
}

export default function Devtools() {
  return (
    <>
      <p>
        <code>devtools</code> 는 Redux DevTools 확장에 상태 변화를 흘려보내는 미들웨어다. 확장이
        없으면 <b>아무 일도 하지 않고 그대로 통과</b>한다. 이 인앱 브라우저에는 확장이 없으므로,
        확장인 척하는 가짜 연결기를 심어 zustand 가 실제로 보내는 것을 아래에 그린다.
      </p>

      <JunglePanel />
      <TimelinePanel />

      <Notes
        points={[
          <>
            <b>도입 비용이 거의 0 이다.</b> 런타임은{' '}
            <code>window.__REDUX_DEVTOOLS_EXTENSION__</code> 만 본다 — npm 패키지(
            <code>@redux-devtools/extension</code>)는 타입용이고, 확장이 없으면{' '}
            <code>devtoolsImpl</code> 이 <code>return fn(set, get, api)</code> 로 즉시 빠져나간다.{' '}
            <code>enabled</code> 기본값도 <code>MODE !== &apos;production&apos;</code> 이라
            프로덕션에서는 알아서 꺼진다.
          </>,
          <>
            프로토콜은 셋뿐이다 — <code>connect(options)</code> 로 연결하고,{' '}
            <code>init(초기상태)</code> 를 한 번 보내고, 이후 <code>setState</code> 마다{' '}
            <code>send({'{ type }'}, 현재상태)</code> 를 보낸다. 되돌리기는 반대 방향으로{' '}
            <code>subscribe(listener)</code> 에 걸어둔 리스너로 들어온다.
          </>,
          <>
            <code>devtools</code> 는 <b>api.setState 를 통째로 갈아끼운다.</b> 그래서 액션을 거치든{' '}
            <code>useStore.setState()</code> 를 직접 부르든 전부 타임라인에 남는다. 다만{' '}
            <b>확장이 되돌린 변경은 안 남는다</b> — <code>isRecording</code> 플래그를 잠시 꺼서
            시간여행이 타임라인을 더럽히지 않게 한다.
          </>,
          <>
            <code>set</code> 의 <b>세 번째 인자</b>가 액션 이름이다.{' '}
            <code>set(partial, replace, name)</code> 순서라 두 번째를 <code>undefined</code> 로
            비워야 한다는 점이 걸리기 쉽다. 이름을 안 주면 zustand 는 스택 트레이스에서 호출자
            이름을 추론해 보고(<code>findCallerName</code> 이 <code>api.setState</code> 가 들어간
            줄의 다음 줄을 읽는다), 그래도 못 찾으면 <code>anonymousActionType</code> 또는{' '}
            <code>&apos;anonymous&apos;</code> 로 찍는다.{' '}
            <b>
              실측: 이 프로젝트에서는 추론이 실패해 그냥 <code>anonymous</code> 로 떨어졌다
            </b>{' '}
            — 번들러가 스택의 함수 이름을 바꿔 놓기 때문이다. 결국{' '}
            <b>이름은 손으로 주는 수밖에 없다</b>고 보는 편이 안전하다.
          </>,
          <>
            문서 Troubleshooting 의 두 항목이 실무에서 바로 걸리는 것들이다 —{' '}
            <b>스토어가 여러 개면 한 번에 하나만 보인다</b>(패널의 스토어 선택기로 전환). 그리고{' '}
            <b>액션 이름이 전부 anonymous</b> 로 뜨면 <code>set</code> 세 번째 인자를 안 준 것이다.
            슬라이스 패턴이라면 <code>&apos;jungle:bear/addBear&apos;</code> 처럼 접두어를 붙여 어느
            슬라이스인지 드러내는 것이 문서의 권장이다.
          </>,
        ]}
      />
    </>
  );
}
