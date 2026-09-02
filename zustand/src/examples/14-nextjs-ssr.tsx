import { createContext, useContext, useState, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { create, useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import Notes from '../ui/Notes.tsx';

// 공식문서 Frameworks and platforms > Setup with Next.js + SSR and Hydration
//
// 두 문서의 주제는 하나다: zustand 스토어는 "모듈 전역 변수"(module state)다.
// SPA 에서는 장점(Provider 없이 어디서든 import)이지만, 서버가 끼면 문제가 된다.
//   ① 요청 간 공유 — Next.js 서버 프로세스는 요청 여러 개를 동시에 처리하는데
//      모듈은 프로세스당 한 번만 평가된다. 전역 스토어 = 모든 요청이 공유하는 변수.
//   ② hydration mismatch — 서버 HTML 과 클라이언트 첫 렌더가 다르면 React 가 에러를 낸다.
//   ③ SPA 라우팅 시 리셋 — 전역 변수는 라우트를 옮겨도 안 지워진다.
//
// 이 프로젝트는 Vite SPA 라 진짜 서버가 없다. 대신 react-dom/server 의
// renderToStaticMarkup 은 브라우저 번들에도 들어 있어서(package.json exports 의
// "browser" 조건 → server.browser.js) "서버 렌더 한 번"을 브라우저에서 흉내낼 수 있다.

// ─────────────────────────────────────────────────────────────────────
// 1. 전역 스토어를 서버에서 렌더하면 — 두 경로가 다르게 동작한다
// ─────────────────────────────────────────────────────────────────────

type GreetState = {
  user: string;
  login: (name: string) => void;
};

// Next.js 문서가 "하지 말라"고 하는 형태. 모듈 최상단의 전역 스토어.
const useGlobalGreet = create<GreetState>()((set) => ({
  user: '손님',
  login: (name) => set({ user: name }),
}));

/** React 훅으로 읽는다 — 평범한 컴포넌트 */
function HookBadge() {
  const user = useGlobalGreet((state) => state.user);
  return <span>안녕하세요, {user}님</span>;
}

/** getState() 로 직접 읽는다 — 서버 유틸 · RSC 에서 흔한 형태 */
function DirectBadge() {
  return <span>안녕하세요, {useGlobalGreet.getState().user}님</span>;
}

/**
 * "요청 두 개"를 같은 서버 프로세스에서 연달아 처리한다고 치고 HTML 을 뽑는다.
 * 요청 1 에서만 로그인이 일어나고, 요청 2 는 아무 일도 하지 않는다.
 */
function renderTwoRequests(Badge: ComponentType): [string, string] {
  // TODO ① — 아래 순서대로 채워라.
  //   1) 서버 프로세스가 막 뜬 상태로 되돌린다:
  //        useGlobalGreet.setState({ user: '손님' })
  //   2) 요청 1 — 이 요청의 사용자가 로그인한다:
  //        useGlobalGreet.getState().login('민수')
  //      그리고 HTML 을 뽑는다: renderToStaticMarkup(<Badge />)
  //   3) 요청 2 — 로그인 없이 HTML 만 뽑는다: renderToStaticMarkup(<Badge />)
  //   4) [요청1HTML, 요청2HTML] 을 반환한다.
  //   읽는 법: 두 문자열이 "같으면" 요청 1 의 데이터가 요청 2 로 샌 것이다.
  void Badge;
  return ['(TODO ①)', '(TODO ①)'];
}

function GlobalStorePanel() {
  const [rows, setRows] = useState<{ label: string; result: [string, string] }[]>([]);

  const run = () => {
    setRows([
      { label: '훅 경로 (useGlobalGreet(selector))', result: renderTwoRequests(HookBadge) },
      { label: 'getState() 직접 접근', result: renderTwoRequests(DirectBadge) },
    ]);
  };

  return (
    <section>
      <h2>1. 전역 스토어를 서버에서 렌더하면</h2>
      <p>
        <button onClick={run}>요청 2개 처리하기</button>{' '}
        <small>
          요청 1 에서만 <code>login(&apos;민수&apos;)</code> 이 일어난다.
        </small>
      </p>
      {rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>읽는 방법</th>
              <th>요청 1 의 HTML</th>
              <th>요청 2 의 HTML</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>
                  <code>{row.result[0]}</code>
                </td>
                <td>
                  <code>{row.result[1]}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        <small>
          두 줄이 서로 다르게 나오는 것이 이 예제의 핵심이다. zustand 의 <code>useStore</code> 는{' '}
          <code>useSyncExternalStore</code> 의 세 번째 인자(서버 스냅샷)로 <code>getState</code> 가
          아니라{' '}
          <b>
            <code>getInitialState</code>
          </b>{' '}
          를 넘긴다 — 그래서 훅 경로는 누수가 화면에 안 보이는 대신 <b>서버에서는 늘 초기값만</b>{' '}
          렌더된다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2. 요청마다 스토어를 새로 만든다 — 스토어 팩토리 + Context
// ─────────────────────────────────────────────────────────────────────

type GreetStore = ReturnType<typeof createGreetStore>;

/** create 로 전역 훅을 만드는 대신, 부를 때마다 새 스토어를 뱉는 함수 */
const createGreetStore = (initState?: Partial<Pick<GreetState, 'user'>>) =>
  createStore<GreetState>()((set) => ({
    user: '손님',
    ...initState,
    login: (name) => set({ user: name }),
  }));

const GreetContext = createContext<GreetStore | null>(null);

/** 12 의 bounded hook 과 같은 모양. 다만 스토어를 클로저가 아니라 Context 에서 꺼낸다. */
function useGreetContext<T>(selector: (state: GreetState) => T): T {
  const store = useContext(GreetContext);
  if (!store) throw new Error('GreetContext.Provider 가 트리에 없다');
  return useStore(store, selector);
}

function ScopedBadge() {
  const user = useGreetContext((state) => state.user);
  return <span>안녕하세요, {user}님</span>;
}

/** 같은 두 요청을, 이번엔 요청마다 스토어를 새로 만들어 처리한다. */
function renderTwoRequestsIsolated(): [string, string] {
  // TODO ② — 요청 하나를 처리하는 모양은 이렇다:
  //     const store = createGreetStore({ user: '민수' });
  //     renderToStaticMarkup(
  //       <GreetContext.Provider value={store}>
  //         <ScopedBadge />
  //       </GreetContext.Provider>,
  //     )
  //   요청 1 은 '민수' 를 주입해서, 요청 2 는 아무것도 주입하지 않고(= 기본값 '손님')
  //   각각 렌더해 [요청1, 요청2] 를 반환하라.
  //
  //   함정 하나: 스토어를 만든 뒤 store.getState().login('민수') 로 바꾸면 SSR 에서는
  //   안 보인다 — 서버 스냅샷이 getInitialState 라서다. 요청 데이터는 반드시
  //   "만들 때" 넣어야 한다. 이것이 문서가 팩토리에 initState 인자를 두는 이유이고,
  //   다음 꼭지(Initialize state with props)의 주제이기도 하다.
  return ['(TODO ②)', '(TODO ②)'];
}

function FactoryPanel() {
  const [result, setResult] = useState<[string, string] | null>(null);

  return (
    <section>
      <h2>2. 요청마다 스토어를 새로 만든다</h2>
      <p>
        <button onClick={() => setResult(renderTwoRequestsIsolated())}>
          요청 2개 처리하기 (팩토리 + Context)
        </button>
      </p>
      {result && (
        <ul>
          <li>
            요청 1: <code>{result[0]}</code>
          </li>
          <li>
            요청 2: <code>{result[1]}</code>
          </li>
        </ul>
      )}
      <p>
        <small>
          이번엔 두 줄이 <b>달라야</b> 정상이다. 게다가 1번에서는 훅 경로로 아예 불가능했던
          &quot;요청별 데이터를 서버 HTML 에 담기&quot;가 여기서는 된다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 3. Hydration mismatch — 서버 스토어와 클라이언트 스토어는 다른 인스턴스다
// ─────────────────────────────────────────────────────────────────────

/** 서버가 이 요청에서 알고 있던 사용자 */
const SERVER_USER = '민수';

type HydrateMode = 'broken' | 'fixed';

/**
 * 클라이언트가 hydrate 할 때 쓸 스토어를 만든다.
 * 서버에서 만든 스토어는 서버 프로세스에 있었고, 브라우저에는 HTML 만 도착했다 —
 * 브라우저는 스토어를 "처음부터 다시" 만들어야 한다.
 */
function createClientStore(mode: HydrateMode): GreetStore {
  // TODO ③ — mode 에 따라 다르게 만들어라. 딱 두 줄이다.
  //   'fixed'  → 서버가 쓴 데이터를 그대로 주입: createGreetStore({ user: SERVER_USER })
  //   'broken' → 아무것도 주입하지 않음: createGreetStore()
  //   ('fixed' 에서 SERVER_USER 를 어떻게 브라우저까지 가져오느냐가 실제 Next.js 의 숙제다.
  //    보통 서버가 HTML 에 초기 데이터를 함께 실어 보내고 Provider 의 props 로 넘긴다.)
  void mode;
  return createGreetStore();
}

const roots = new Map<HydrateMode, Root>();

function HydrationPanel() {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const run = (mode: HydrateMode) => {
    const box = document.getElementById(`hydrate-${mode}`);
    if (!box) return;

    // 이전 실행이 남아 있으면 정리한다
    roots.get(mode)?.unmount();
    roots.delete(mode);

    // (a) 서버 — 이 요청의 데이터로 스토어를 만들어 HTML 문자열을 뽑는다
    const serverStore = createGreetStore({ user: SERVER_USER });
    const serverHtml = renderToStaticMarkup(
      <GreetContext.Provider value={serverStore}>
        <ScopedBadge />
      </GreetContext.Provider>,
    );
    box.innerHTML = serverHtml;

    // (b) 클라이언트 — 그 HTML 위로 React 트리를 겹쳐 맞춘다
    const captured: string[] = [];
    const root = hydrateRoot(
      box,
      <GreetContext.Provider value={createClientStore(mode)}>
        <ScopedBadge />
      </GreetContext.Provider>,
      {
        // hydration mismatch 는 "복구 가능한 에러"로 여기에 들어온다
        onRecoverableError: (error) => captured.push(String(error)),
      },
    );
    roots.set(mode, root);

    // hydration 렌더는 예약 실행이라 다음 매크로태스크에서 결과를 읽는다
    setTimeout(() => setErrors((prev) => ({ ...prev, [mode]: captured })), 50);
  };

  const renderCase = (mode: HydrateMode, label: string) => (
    <div>
      <h3>{label}</h3>
      <p>
        <button onClick={() => run(mode)}>hydrate 실행</button>
      </p>
      <blockquote id={`hydrate-${mode}`}>
        <small>아직 실행 전</small>
      </blockquote>
      {errors[mode] && (
        <p>
          <small>
            {errors[mode].length === 0 ? (
              <b>에러 없음 — 서버 HTML 과 클라이언트 첫 렌더가 일치했다.</b>
            ) : (
              <>
                <b>복구된 에러 {errors[mode].length}건:</b>
                <br />
                {errors[mode].map((message, index) => (
                  <code key={index}>{message}</code>
                ))}
              </>
            )}
          </small>
        </p>
      )}
    </div>
  );

  return (
    <section>
      <h2>3. Hydration mismatch</h2>
      <p>
        서버가 만든 HTML 을 상자에 넣고, 그 위에 <code>hydrateRoot</code> 로 실제 React 트리를
        겹친다. 클라이언트 스토어의 초기값이 서버와 다르면 그 자리에서 hydration 에러가 난다.
      </p>
      {renderCase('broken', '틀린 배선 — 클라이언트가 기본값으로 스토어를 만든다')}
      {renderCase('fixed', '맞는 배선 — 서버가 쓴 데이터를 그대로 주입한다')}
      <p>
        <small>
          TODO ③ 을 채우기 전에는 두 상자가 똑같이 동작한다(둘 다 &apos;틀린 배선&apos;).
        </small>
      </p>
    </section>
  );
}

export default function NextjsSsr() {
  return (
    <>
      <p>
        zustand 스토어는 <b>모듈 전역 변수</b>다. SPA 에서는 그게 편하지만 서버가 끼는 순간 요청끼리
        공유되고, hydration 이 어긋난다. 해법은 하나로 수렴한다 — 스토어를 전역에 두지 말고{' '}
        <b>만들어내는 함수</b>로 두고 Context 로 내려준다.
      </p>

      <GlobalStorePanel />
      <FactoryPanel />
      <HydrationPanel />

      <Notes
        points={[
          <>
            Next.js 문서가 말하는 세 가지 제약: <b>요청별 스토어</b>(서버 프로세스 하나가 요청
            여럿을 동시에 처리하므로 전역 변수를 공유하면 안 된다), <b>SSR 친화</b>(서버와
            클라이언트의 첫 렌더가 같아야 한다), <b>SPA 라우팅 친화</b>(라우트를 옮길 때 스토어를
            리셋하려면 컴포넌트 수준의 Context 가 필요하다).
          </>,
          <>
            <code>react.mjs</code> 실측: <code>useStore</code> 는{' '}
            <code>
              useSyncExternalStore(subscribe, () =&gt; selector(getState()), () =&gt;
              selector(getInitialState()))
            </code>
            . 세 번째 인자가 <b>서버 스냅샷</b>이다. 그래서 서버에서는 <code>setState</code> 로 바꾼
            값이 안 보이고 항상 초기 상태가 렌더된다.
          </>,
          <>
            그 결과 요청 데이터는 <b>스토어를 만들 때 주입</b>해야 한다 —{' '}
            <code>createGreetStore({'{ user }'})</code>. 만든 뒤 <code>setState</code> 하는 건
            클라이언트에서만 통한다.
          </>,
          <>
            RSC(React Server Component)는 훅도 Context 도 못 쓴다. 그래서 문서는{' '}
            <b>RSC 가 스토어를 읽지도 쓰지도 말라</b>고 못박는다. RSC 에서{' '}
            <code>store.getState()</code> 를 부르면 훅 경로의 방어(getInitialState)를 우회해 요청 간
            누수가 그대로 일어난다 — 1번 표의 아랫줄이 그것이다.
          </>,
          <>
            <code>ssr-and-hydration.md</code> 문서 자체에는 zustand 코드가 한 줄도 없다. express +{' '}
            <code>renderToPipeableStream</code> + <code>hydrateRoot</code> 로 SSR 이 무엇인지
            설명하는 배경 문서다. 실무에서는 이걸 직접 짤 일이 거의 없고 Next.js 같은 프레임워크가
            해준다.
          </>,
        ]}
      />
    </>
  );
}
