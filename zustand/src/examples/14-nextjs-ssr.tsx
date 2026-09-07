import { createContext, useContext, useState, type ComponentType } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
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
  useGlobalGreet.setState({ user: '손님' });

  useGlobalGreet.getState().login('한범');
  const request1 = renderToStaticMarkup(<Badge />);

  const request2 = renderToStaticMarkup(<Badge />);

  return [request1, request2];
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
          요청 1 에서만 <code>login(&apos;한범&apos;)</code> 이 일어난다.
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
  console.log('ScopedBadge user: ', user);
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
  const store1 = createGreetStore({ user: '민수' });
  const req1 = renderToStaticMarkup(
    <GreetContext.Provider value={store1}>
      <ScopedBadge />
    </GreetContext.Provider>,
  );
  const store2 = createGreetStore();
  const req2 = renderToStaticMarkup(
    <GreetContext.Provider value={store2}>
      <ScopedBadge />
    </GreetContext.Provider>,
  );
  return [req1, req2];
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
  if (mode === 'fixed') return createGreetStore({ user: SERVER_USER });
  else return createGreetStore();
}

const roots = new Map<HydrateMode, Root>();

// 이 파일을 고치면 모듈이 다시 평가되면서 GreetContext 가 "새 객체"가 된다. 그런데
// 이미 hydrate 해둔 루트는 옛 GreetContext 를 들고 살아 있어서, Fast Refresh 가 그
// 루트를 다시 그릴 때 useContext(새 Context) 가 null 이라 throw 한다. 모듈이 교체되기
// 직전에 루트를 정리해 그 상황을 막는다. (개발 편의용이고 zustand 와는 무관하다)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    roots.forEach((root) => root.unmount());
    roots.clear();
  });
}

function HydrationPanel() {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const run = (mode: HydrateMode) => {
    const box = document.getElementById(`hydrate-${mode}`);
    if (!box) return;

    // 이전 실행이 남아 있으면 정리한다
    roots.get(mode)?.unmount();
    roots.delete(mode);
    box.replaceChildren();

    // (a) 서버 — 이 요청의 데이터로 스토어를 만들어 HTML 문자열을 뽑는다.
    //     여기서만 renderToStaticMarkup 이 아니라 renderToString 을 쓴다:
    //     "안녕하세요, {user}님" 은 텍스트 노드 3개인데, 그 경계를 <!-- --> 로 표시해줘야
    //     hydration 이 노드를 쪼갤 수 있다. staticMarkup 은 그 마커를 넣지 않아
    //     데이터가 맞아도 구조가 어긋난다(= hydration 전용이 아니다).
    const serverStore = createGreetStore({ user: SERVER_USER });
    const serverHtml = renderToString(
      <GreetContext.Provider value={serverStore}>
        <ScopedBadge />
      </GreetContext.Provider>,
    );
    // 실행마다 새 노드를 만들어 그 안에 서버 HTML 을 넣는다. 같은 노드를 두 번
    // hydrateRoot 에 넘기면 React 가 거부하기 때문이다(HMR 로도 쉽게 걸린다).
    const mount = document.createElement('div');
    mount.innerHTML = serverHtml;
    box.appendChild(mount);

    // (b) 클라이언트 — 그 HTML 위로 React 트리를 겹쳐 맞춘다
    const captured: string[] = [];
    const root = hydrateRoot(
      mount,
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
      {/* React 는 이 노드를 빈 채로 두고, 안쪽은 위 run() 이 직접 관리한다 */}
      <blockquote id={`hydrate-${mode}`} />
      {!errors[mode] && (
        <p>
          <small>아직 실행 전</small>
        </p>
      )}
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
          두 상자의 차이는 <code>createClientStore</code> 한 줄뿐이다 — 클라이언트가 스토어를 만들
          때 서버가 쓴 값을 넣었는가. 틀린 쪽의 에러 diff 가 <code>+ 손님 / - 민수</code> 로
          <b>데이터 차이만</b> 가리키는 것도 봐 둘 것.
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
          <>
            <b>hydration 용 HTML 은 renderToStaticMarkup 으로 만들면 안 된다.</b> 실측:{' '}
            <code>&lt;span&gt;안녕하세요, {'{user}'}님&lt;/span&gt;</code> 을 두 렌더러로 뽑으면{' '}
            <code>renderToStaticMarkup</code> → <code>{'<span>안녕하세요, 민수님</span>'}</code>,{' '}
            <code>renderToString</code> →{' '}
            <code>{'<span>안녕하세요, <!-- -->민수<!-- -->님</span>'}</code>. 이 텍스트는 노드
            3개인데 그 경계를 <code>&lt;!-- --&gt;</code> 로 표시해줘야 hydration 이 노드를 쪼갤 수
            있다. staticMarkup 으로 만들면 <b>데이터가 맞아도</b> 구조가 어긋나 mismatch 가 난다 —
            처음 이 예제를 짤 때 실제로 걸렸던 함정이다. 이름 그대로 <b>static</b>(하이드레이션하지
            않을) 마크업 전용이다.
          </>,
        ]}
        questions={[
          {
            q: '스토어의 액션은 getState 로 부르고, 상태는 setState 로 바꾸는 건가?',
            a: (
              <>
                그런 짝이 아니다. <b>getState = 읽기, setState = 쓰기</b>다. vanilla.mjs 의{' '}
                <code>createState(setState, getState, api)</code> 줄이 우리 initializer 의{' '}
                <code>set</code> 자리에 <code>setState</code> 를 그대로 넘긴다 — 실측{' '}
                <code>set === store.setState</code> 는 <code>true</code>.
                <br />
                <br />
                zustand 에는 <b>&quot;액션&quot;이라는 개념이 아예 없다.</b> 소스에 그런 단어가
                없다. <code>getState()</code> 는 상태 객체를 통째로 돌려주고(실측:{' '}
                <code>[&apos;user&apos;, &apos;login&apos;]</code>), <code>login</code> 은 그 객체의
                한 필드인데 값이 함수일 뿐이다. 그래서 <code>getState().login(&apos;A&apos;)</code>{' '}
                는 특별한 문법이 아니라 그냥 <code>obj.foo()</code> 다. 꺼내는 경로도 상관없다 —
                미리 구조분해해두거나 훅으로 꺼내도 <b>같은 함수 객체 하나</b>다. 액션은{' '}
                <code>setState</code> 를 감싼 포장지이고, 그 포장을 벗기고 <code>setState</code> 를
                직접 불러도 똑같이 동작한다.
              </>
            ),
          },
          {
            q: '컴포넌트에서 setState 로 값을 바꿔도, 구독이 아니니까 리렌더가 안 되는 것 아닌가?',
            a: (
              <>
                <b>리렌더된다.</b> 쓰기와 구독은 완전히 별개다. <code>setState</code> 는 상태를 바꾼
                뒤 <code>listeners.forEach(...)</code> 로 <b>항상 전원에게 알린다</b> — 누가 어떤
                방법으로 불렀는지 따지지 않는다. 구독은 <b>읽는 쪽</b>이 거는 것이고, 컴포넌트에서
                그걸 하는 건 selector 훅 한 줄이다.
                <br />
                <br />즉 리렌더는 <b>누가 바꿨나가 아니라 누가 듣고 있나</b>로 정해진다. 다만 알림이
                곧 리렌더는 아니다: 알림 → 각 훅이 selector 재실행 → <code>Object.is</code> 로 이전
                결과와 비교 → 같으면 건너뛴다. 그래서 값이 실제로 안 바뀐 <code>setState</code> 는
                알림은 가도 리렌더는 없다(09 의 useShallow 가 필요한 이유도 여기서 갈린다).
              </>
            ),
          },
          {
            q: '요청마다 스토어를 새로 만들면 메모리 누수가 나지 않나? 스토어는 안 없애도 되나?',
            a: (
              <>
                없앨 API 자체가 없다 — <code>StoreApi</code> 는{' '}
                <code>{'{ setState, getState, getInitialState, subscribe }'}</code> 4개뿐이고{' '}
                <code>destroy</code> 가 없다. 스토어는 전역 레지스트리에 등록되지 않는{' '}
                <b>평범한 클로저 객체</b>라, 아무도 참조하지 않으면 그냥 GC 된다.
                <br />
                <br />
                핵심은 <b>방향</b>이다. <code>listeners</code> 는 <b>스토어가 리스너를 붙드는</b>{' '}
                구조다. 그래서 스토어가 죽으면 리스너와 그것이 붙들던 것까지 같이 죽는다.{' '}
                <code>--expose-gc</code> + <code>WeakRef</code> 실측: 구독 해제를 일부러 안 한
                팩토리 스토어는 <b>스토어도 리스너가 붙든 객체도 전부 수거</b>됐고(true/true), 전역
                스토어에 붙인 리스너의 객체는 <b>수거되지 않았다</b>(false).
                <br />
                <br />
                결론이 직관과 반대다 — <b>팩토리 스토어가 전역 스토어보다 안전하다.</b> 진짜 누수는
                ① 전역 스토어에 <code>subscribe</code> 를 직접 걸고 해제하지 않기(훅으로 구독한 건
                useSyncExternalStore 가 언마운트 때 해제해준다), ② 전역 스토어에 큰 데이터를 쌓고 안
                비우기 쪽이다. 그리고 <b>렌더 중에 createStore 를 부르는 것</b>은 메모리가 아니라
                상태 유실 버그다 — 그래서 문서가 <code>useState(() =&gt; createStore())</code> 로
                감싼다. 기준은 개수가 아니라 &quot;그 스토어가 살아 있어야 할 기간&quot;이다.
              </>
            ),
          },
          {
            q: '2번은 Context 를 쓴 건데, 1번과의 차이가 정확히 뭔가?',
            a: (
              <>
                <b>Context 가 고친 게 아니다. 팩토리가 고쳤다.</b> 바뀐 건 둘이다.
                <br />
                <br />① <b>스토어를 언제 만드나</b> — 서버 HTML 에 데이터를 실을 수 있는 유일한
                순간은 <code>initialState</code> 가 확정되는 <b>스토어 생성 시점</b>뿐이다(그 뒤로는{' '}
                <code>const</code> 라 못 바꾼다). 1번은 그 순간이 모듈 로드 시 한 번이라 이미 지나가
                있었고, 2번은 요청 시점으로 끌어왔다. 격리는 덤이다.
                <br />
                <br />② <b>스토어를 어떻게 찾나</b> — 전역일 땐 <code>import</code> 가 곧 지목이라
                질문이 없었다. 스토어가 여러 개가 되는 순간 &quot;어느 것이냐&quot;를 답해야 하고,
                prop drilling 대신 Context 를 쓴 것이다. 즉 Context 는 팩토리가 만든 배선 비용이지
                해결책이 아니다.
                <br />
                <br />
                놓치기 쉬운 점: Context 에 담은 건 <b>상태가 아니라 스토어 손잡이</b>다. 스토어 객체
                참조는 절대 바뀌지 않으므로 <b>Context 가 유발하는 리렌더는 0회</b>이고, 값 변화
                감지는 여전히 zustand 의 subscribe + selector 가 한다. Context 의 편의(트리 스코프,
                언마운트 시 자동 정리)는 얻고 단점(전체 리렌더)은 물려받지 않는 조합이다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
