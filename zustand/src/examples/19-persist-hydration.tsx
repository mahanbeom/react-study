import { useEffect, useState, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import Notes from '../ui/Notes.tsx';

// 공식문서 Reference > Middlewares > persist — 그중 hydration(복원) 부분만.
// persist 본체(partialize · version/migrate · onRehydrateStorage · 커스텀 storage)는
// 10 과 labs/practical-persist 에서 이미 다뤘다. 여기서는 "복원이 언제 끝나는가"만 본다.
//
// 핵심은 middleware.mjs 의 toThenable 하나다:
//
//   storage.getItem() 이 Promise 가 아니면 → .then 을 그 자리에서 동기 실행
//   Promise 면                            → 진짜 microtask 뒤에 실행
//
// 그래서 localStorage 는 create() 가 끝나기 전에 이미 복원돼 있고, IndexedDB ·
// AsyncStorage · 네트워크 같은 비동기 storage 는 첫 렌더가 "초기값"으로 한 번 지나간다.
// 로그인 여부를 persist 에 두면 이 한 프레임 동안 "비로그인 화면"이 깜빡인다.
//
// 이 예제는 localStorage 를 일부러 느리게 감싸서 그 한 프레임을 1.2초로 늘린다.

// ═════════════════════════════════════════════════════════════════════
// 느린 storage — 비동기 storage 의 "비용"을 눈에 보이게
// ═════════════════════════════════════════════════════════════════════

const HYDRATION_DELAY_MS = 1200;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * getItem 만 느리다. 실제 비동기 storage 처럼 "요청 시점의 값"을 들고 늦게 돌아온다.
 * (sleep 뒤에 읽으면 그 사이 바뀐 값을 보게 되어 아래 경쟁 조건이 재현되지 않는다.)
 */
const slowStorage: StateStorage = {
  getItem: async (name) => {
    const raw = window.localStorage.getItem(name);
    await sleep(HYDRATION_DELAY_MS);
    return raw;
  },
  setItem: (name, value) => window.localStorage.setItem(name, value),
  removeItem: (name) => window.localStorage.removeItem(name),
};

// ═════════════════════════════════════════════════════════════════════
// A. 로그인 세션 — 복원 게이트와 로그아웃
// ═════════════════════════════════════════════════════════════════════

const SESSION_KEY = 'study-session';

type SessionState = {
  user: string | null;
};

type SessionStore = SessionState & {
  login: (name: string) => void;
  logout: () => void;
};

/** 스토어가 만들어진(= 첫 복원이 시작된) 시각. 타임라인의 기준점 */
const bootAt = performance.now();

const useSessionStore = create<SessionStore>()(
  persist(
    (set, _get, store) => ({
      user: null,

      login: (name) => set({ user: name }),

      // 로그아웃 = 16 의 리셋 패턴(getInitialState + replace) + clearStorage().
      // 리셋만 하면 복원 도중에 로그아웃했을 때 늦게 돌아온 복원 결과가 옛 사용자를 되살린다
      // (복원 요청은 로그아웃 전에 이미 나갔다). clearStorage() 는 저장된 키를 지우고,
      // hydrationVersion 카운터를 올려 진행 중인 복원 결과를 버리게 한다.
      logout: () => {
        set(store.getInitialState(), true);
        store.persist.clearStorage();
      },
    }),
    {
      name: SESSION_KEY,
      storage: createJSONStorage(() => slowStorage),
    },
  ),
);

/**
 * 복원이 끝났는지를 React 상태로 옮긴다.
 * hasHydrated() 는 반응형이 아니라서(그냥 boolean 반환) 구독으로 갱신해야 한다.
 */
function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 예약 등록 — 지금 불리는 게 아니라 persist 가 복원을 시작·종료할 때 불러 준다.
    // onHydrate 는 rehydrate() 로 다시 복원할 때 false 로 되돌리기 위한 것이다.
    const unsubHydrate = useSessionStore.persist.onHydrate(() => setHydrated(false));
    const unsubFinish = useSessionStore.persist.onFinishHydration(() => setHydrated(true));
    // 보정 — 복원은 스토어 생성 시 시작되므로 이 컴포넌트가 마운트되기 전에 끝났을 수 있다.
    setHydrated(useSessionStore.persist.hasHydrated());
    // 언마운트(다른 예제 클릭) 때 예약 해제. StrictMode 는 마운트 직후에도 한 번 돌려 본다.
    return () => {
      unsubHydrate();
      unsubFinish();
    };
  }, []);

  return hydrated;
}

/**
 * 복원의 시작·끝 타임라인. 첫 복원은 스토어가 만들어지는 순간(모듈 평가 시점) 시작되므로
 * 컴포넌트의 effect 로는 늦다 — 마운트 전에 이미 끝나 버린다. 그래서 여기서 바로 구독한다.
 * "+1200ms 복원 완료" 그 숫자가 곧 첫 렌더가 초기값으로 지나간 시간이다.
 */
const useHydrationLog = create<{ lines: string[] }>()(() => ({ lines: [] }));

const logHydration = (message: string) =>
  useHydrationLog.setState((state) => ({
    lines: [...state.lines, `+${Math.round(performance.now() - bootAt)}ms ${message}`],
  }));

useSessionStore.persist.onHydrate(() => logHydration('복원 시작'));
useSessionStore.persist.onFinishHydration((state) =>
  logHydration(`복원 완료 — user=${String(state.user)}`),
);

/** localStorage 에 실제로 저장된 값. 같은 탭의 변경은 storage 이벤트가 안 오므로 스토어 구독으로 대신한다 */
function useStoredSession() {
  return useSyncExternalStore(
    (onChange) => {
      // persist 는 set(...) 으로 구독자에게 알린 "뒤에" setItem() 을 부른다.
      // 그 자리에서 읽으면 한 박자 전 값이 보이므로 microtask 하나만큼 미룬다.
      const unsub = useSessionStore.subscribe(() => queueMicrotask(onChange));
      window.addEventListener('storage', onChange);
      return () => {
        unsub();
        window.removeEventListener('storage', onChange);
      };
    },
    () => window.localStorage.getItem(SESSION_KEY),
    () => null,
  );
}

function Greeting() {
  const user = useSessionStore((state) => state.user);
  const login = useSessionStore((state) => state.login);
  const logout = useSessionStore((state) => state.logout);

  return user ? (
    <p>
      환영합니다, <b>{user}</b> <button onClick={logout}>로그아웃</button>
    </p>
  ) : (
    <p>
      로그인이 필요합니다 <button onClick={() => login('alice')}>alice 로 로그인</button>
    </p>
  );
}

/** 복원을 기다리지 않는다 — 첫 렌더가 초기값으로 지나간다 */
function WithoutGate() {
  return (
    <div className="border p-3">
      <h3>게이트 없음</h3>
      <Greeting />
    </div>
  );
}

/** 복원이 끝날 때까지 아무것도 단정하지 않는다 */
function WithGate() {
  const hydrated = useHydration();

  return (
    <div className="border p-3">
      <h3>게이트 있음</h3>
      {hydrated ? <Greeting /> : <p>복원 중…</p>}
    </div>
  );
}

function SessionPanel() {
  const stored = useStoredSession();
  const log = useHydrationLog((state) => state.lines);

  return (
    <section>
      <h2>A. 로그인 세션 — 복원 게이트와 로그아웃</h2>

      <p>
        <small>
          storage 의 <code>getItem</code> 이 {HYDRATION_DELAY_MS}ms 걸린다. <b>alice 로 로그인</b>{' '}
          후 <b>새로고침</b>하면 두 패널의 차이가 보인다.
        </small>
      </p>

      <div className="flex gap-4">
        <WithoutGate />
        <WithGate />
      </div>

      <p>
        <button onClick={() => void useSessionStore.persist.rehydrate()}>
          다시 복원 (rehydrate)
        </button>{' '}
        <button onClick={() => window.location.reload()}>새로고침</button>
      </p>

      <p>
        저장된 값: <code>{stored ?? '(없음)'}</code>
      </p>

      <ul>
        {log.map((line, index) => (
          <li key={index}>
            <code>{line}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════
// B. skipHydration — 복원 시점을 내가 정한다
// ═════════════════════════════════════════════════════════════════════

const DRAFT_KEY = 'study-draft';

type DraftStore = {
  note: string;
  setNote: (note: string) => void;
};

// storage 는 보통 localStorage(동기)다. 그런데도 skipHydration 이 켜져 있으면
// create() 시점에 복원하지 않고 rehydrate() 를 부를 때까지 초기값으로 남는다.
const useDraftStore = create<DraftStore>()(
  persist((set) => ({ note: '', setNote: (note) => set({ note }) }), {
    name: DRAFT_KEY,
    skipHydration: true,
  }),
);

/** hasHydrated() 를 반응형으로 — useHydration 과 같은 일을 useSyncExternalStore 로 */
function useDraftHydrated() {
  return useSyncExternalStore(
    (onChange) => {
      const unsubHydrate = useDraftStore.persist.onHydrate(onChange);
      const unsubFinish = useDraftStore.persist.onFinishHydration(onChange);
      return () => {
        unsubHydrate();
        unsubFinish();
      };
    },
    () => useDraftStore.persist.hasHydrated(),
    () => false,
  );
}

function DraftPanel() {
  const note = useDraftStore((state) => state.note);
  const setNote = useDraftStore((state) => state.setNote);
  const hydrated = useDraftHydrated();

  return (
    <section>
      <h2>B. skipHydration — 복원 시점을 내가 정한다</h2>

      <p>
        hasHydrated: <code>{String(hydrated)}</code>{' '}
        <button onClick={() => void useDraftStore.persist.rehydrate()}>
          지금 복원 (rehydrate)
        </button>
      </p>
      <p>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="타이핑 후 새로고침"
          className="border px-2 py-1"
        />
      </p>

      <p>
        <small>
          타이핑은 곧바로 저장된다(<code>set</code> 은 언제나 <code>setItem</code> 을 부른다).
          그런데 <b>새로고침하면 빈칸</b>이다 — 쓰기는 자동이지만 <b>읽기는 내가 시켜야 한다</b>.{' '}
          <b>지금 복원</b>을 누르면 돌아온다. SSR 에서 서버 HTML 과 클라이언트 첫 렌더를 맞춘 뒤{' '}
          <code>useEffect</code> 안에서 <code>rehydrate()</code> 를 부르는 용도다. Vite SPA 에서는
          쓸 일이 없다.
        </small>
      </p>
    </section>
  );
}

export default function PersistHydration() {
  // 다른 탭에서 로그인·로그아웃하면 이 탭도 따라간다 — 공식문서 FAQ "rehydrate on storage event".
  // storage 이벤트는 "다른 탭"의 변경에만 온다. 모듈 최상단이 아니라 effect 에 두는 이유는
  // HMR 로 모듈이 다시 평가될 때 리스너가 중복되지 않게 하기 위해서다.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === useSessionStore.persist.getOptions().name) {
        void useSessionStore.persist.rehydrate();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <>
      <p>
        <code>persist</code> 의 복원(hydration)은 <b>storage 가 동기냐 비동기냐</b>에 따라 시점이
        다르다. localStorage 는 <code>create()</code> 안에서 끝나지만, 비동기 storage 는 첫 렌더가
        초기값으로 한 번 지나간다. 여기서는 localStorage 를 일부러 느리게 감싸 그 순간을 늘려 본다.
      </p>
      <p>
        <small>
          실무에서 필요한 것은 둘이다 — 비동기 storage 나 SSR 이면 <b>복원 게이트</b>를 두는 것,
          로그아웃에는 리셋과 함께{' '}
          <b>
            <code>clearStorage()</code>
          </b>{' '}
          를 부르는 것. <code>skipHydration</code> / <code>rehydrate()</code> 는 SSR 에서만 만난다.
        </small>
      </p>

      <SessionPanel />
      <DraftPanel />

      <Notes
        points={[
          <>
            <b>동기·비동기는 storage 가 정한다.</b> <code>toThenable</code> 이 <code>getItem</code>{' '}
            결과가 Promise 가 아니면 <code>.then</code> 을 그 자리에서 실행한다. localStorage 는 첫
            렌더 전에 복원이 끝나 있고, IndexedDB · AsyncStorage · 네트워크는 그렇지 않다.
          </>,
          <>
            <b>
              <code>hasHydrated()</code> 는 반응형이 아니다.
            </b>{' '}
            그냥 boolean 을 돌려준다. 화면에 반영하려면 <code>onHydrate</code> /{' '}
            <code>onFinishHydration</code> 구독으로 React 상태를 갱신해야 한다(TODO ①).{' '}
            <code>useSyncExternalStore</code> 로 써도 된다(B 패널).
          </>,
          <>
            <b>
              로그아웃은 리셋 + <code>clearStorage()</code>.
            </b>{' '}
            복원 도중 로그아웃하면 늦게 돌아온 복원 결과가 옛 사용자를 되살린다(TODO ②).{' '}
            <code>clearStorage()</code> 는 키를 지울 뿐 아니라 <code>hydrationVersion</code> 을 올려
            진행 중인 복원을 버린다.
          </>,
          <>
            단, 그러면 <code>hasHydrated()</code> 가 <code>false</code> 로 남는다 — 취소만 했지 다시
            복원하지 않았기 때문이다. 게이트가 있으면 로그아웃 자체가 복원 뒤에만 가능하므로 이
            경로를 안 탄다. 이미 탔다면 <code>rehydrate()</code> 로 닫는다.
          </>,
          <>
            <b>
              <code>skipHydration</code> 은 SSR 용이다.
            </b>{' '}
            서버 HTML 과 클라이언트 첫 렌더를 같게 유지한 뒤 <code>useEffect</code> 에서{' '}
            <code>rehydrate()</code>. 14 에서 본 hydration mismatch 를 persist 쪽에서 피하는
            방법이다.
          </>,
          <>
            <b>
              기본 <code>merge</code> 는 얕은 병합이다.
            </b>{' '}
            중첩 객체를 부분만 저장하면 저장 안 된 하위 필드가 사라진다. 그런 구조면{' '}
            <code>merge</code> 옵션에 깊은 병합을 준다 — 보통은 상태를 납작하게 두는 편이 낫다.
          </>,
          <>
            <b>로그인 상태를 persist 로 관리하는 것 자체는 권장이 아니다.</b> 여기서 로그인을 소재로
            쓴 것은 &quot;복원 전의 잘못된 판단&quot;이 가장 직관적으로 드러나서다. 실무의 최종
            판정은 서버가 하고(cookie·토큰 검사), 클라이언트는 화면을 그리려고 상태를 <b>알고만</b>{' '}
            있다. 흔한 방식은 httpOnly cookie + 앱 시작 시 <code>/me</code> 호출 → 메모리에만 두기.
            그래도 응답이 오기 전 &quot;모름&quot; 구간은 똑같이 생기고, React Query 의{' '}
            <code>isPending</code> 이 이 예제의 <code>hydrated</code> 자리다.
          </>,
          <>
            <b>이 게이트를 실제로 짜게 되는 곳</b>은 React Native(AsyncStorage 가 비동기), Next.js
            SSR, 그리고 테마·온보딩 완료 여부처럼 첫 화면 분기에 쓰이는 저장값이다. Vite SPA 에서
            localStorage 만 쓰는 동안은 짤 일이 없다. 원칙 하나만 가져간다 —{' '}
            <b>&quot;아직 모름&quot;을 &quot;없음&quot;으로 착각하지 않는다.</b>
          </>,
        ]}
        questions={[
          {
            q: 'useHydration 의 사전적 의미와 개발적 의미는?',
            a: (
              <>
                hydrate 는 &quot;물을 채우다&quot; — 말라 있던 것에 내용물을 넣어 되살린다.
                개발에서는 &quot;죽은 형태(문자열·HTML)를 살아 있는 객체로 되돌린다&quot;. React 의
                hydration 은 서버 HTML 에 이벤트·상태를 붙이는 것(14), persist 의 hydration 은
                storage 의 문자열을 스토어 상태로 되돌리는 것(19). 이름만 같고 대상이 다르다.{' '}
                <code>useHydration</code> 은 &quot;persist 복원이 끝났는가&quot;를 React 가 지켜볼
                수 있게 하는 훅이다.
              </>
            ),
          },
          {
            q: 'onHydrate · onFinishHydration · hasHydrated 는 persist 의 기본 객체인가?',
            a: (
              <>
                persist 미들웨어가 스토어에 <code>persist</code> 라는 속성 하나를 덧붙인다(소스의{' '}
                <code>
                  api.persist = {'{'}…{'}'}
                </code>
                ). 그 안의 일곱 개는 전부 함수다. <code>hasHydrated()</code> 는 내부 변수를 지금
                읽어 줄 뿐 알려 주지 않고, <code>onFinishHydration(fn)</code> 은 내부{' '}
                <code>Set</code> 에 fn 을 넣어 두는 &quot;끝나면 불러 달라&quot;는 예약이다.{' '}
                <code>store.subscribe</code> 와 같은 모양이고, 돌려주는 함수를 부르면 예약이 빠진다.
              </>
            ),
          },
          {
            q: '게이트는 펜딩 표시를 보여 주려는 건가?',
            a: (
              <>
                펜딩 표시는 결과일 뿐이다. 목적은 복원이 끝나기 전에 화면이 <b>잘못된 판단</b>을
                내리는 것을 막는 것 — <code>null</code> 이 &quot;비로그인&quot;인지 &quot;아직 안
                읽었음&quot;인지 구분이 안 되는 것이 문제의 뿌리다. 게이트가 없으면 로그인 페이지로
                리다이렉트하거나, 비로그인용 API 를 부르거나, 복원 결과와 충돌하는 액션을 누르게
                된다.
              </>
            ),
          },
          {
            q: 'useEffect 안의 onHydrate / onFinishHydration 은 마운트 때 실행되는 건가?',
            a: (
              <>
                마운트 때 실행되는 것은 <b>등록</b>이다. 넘긴 콜백은 그 자리에서 불리지 않고, 나중에
                persist 가 복원을 시작·종료할 때 persist 쪽에서 불러 준다. 전화번호를 남기는 것이지
                전화를 거는 게 아니다. 그 다음 줄의 <code>setHydrated(hasHydrated())</code> 는
                &quot;이미 끝났으면?&quot;에 대한 보정 — 복원은 스토어 생성 시 시작되므로 마운트
                전에 끝나 있을 수 있고, 그러면 예약은 영영 안 불린다.
              </>
            ),
          },
          {
            q: '정리 함수(return () => …)는 언제 도나? 가만히 기다리면 안 도는 것 아닌가?',
            a: (
              <>
                맞다. effect 는 정리 함수를 <b>만들어서 React 에 맡겨만</b> 두고, React 가 언마운트
                순간에 대신 부른다. 이 프로젝트에서는 왼쪽 목록에서 다른 예제를 클릭할 때가 그
                순간이다(<code>App</code> 이 <code>current.Component</code> 하나만 그리므로). 그
                밖에 조건부 렌더링으로 사라질 때, 라우터 페이지 이동, 목록에서 항목 삭제. 예외는
                개발 모드 StrictMode — 마운트 직후 &quot;정리 → 재실행&quot;을 일부러 한 번 끼워
                넣어 정리가 제대로 짜였는지 검사한다.
              </>
            ),
          },
          {
            q: '복원은 어디서 진행되나? 내부에서?',
            a: (
              <>
                전부 persist 내부의 <code>hydrate()</code> 함수다. storage 에서 읽고 →{' '}
                <code>merge</code> 로 현재 상태와 합치고 → <code>set(merged, true)</code> 로 넣고 →
                내부 변수 <code>hasHydrated = true</code> → 예약된 콜백들을 부른다. 스토어 생성 시
                마지막 줄에서 persist 가 스스로 한 번 부르고(<code>skipHydration</code> 이 아니면),{' '}
                <code>rehydrate()</code> 는 같은 함수를 다시 부르는 것이다. 우리가 직접 건드리는
                순간은 이 둘뿐이다.
              </>
            ),
          },
          {
            q: 'storage: createJSONStorage(() => slowStorage) 는 slowStorage 객체를 저장하는 건가?',
            a: (
              <>
                반대다. <code>storage</code> 옵션은 &quot;무엇을&quot;이 아니라{' '}
                <b>&quot;어디에&quot;</b> 저장할지다. 저장되는 것은 상태(
                <code>
                  {'{'}&quot;state&quot;:{'{'}&quot;user&quot;:…{'}'}
                  ,&quot;version&quot;:0{'}'}
                </code>
                )이고, 경로는 persist → createJSONStorage(객체 ↔ 문자열 변환) → slowStorage(1.2초
                지연, 학습용) → <code>window.localStorage</code> 세 겹이다. 함수로 감싸는 이유는 SSR
                에서 <code>window</code> 가 없을 때 모듈 로드가 터지지 않게 늦게 부르려는 것.{' '}
                <code>SESSION_KEY</code> 의 session 은 로그인 세션이지 <code>sessionStorage</code>{' '}
                가 아니다.
              </>
            ),
          },
          {
            q: 'useStoredSession 이 스토어를 구독해서 localStorage 에 저장하는 건가?',
            a: (
              <>
                저장하지 않는다. 화면의 &quot;저장된 값&quot; 한 줄을 그리려고 <b>읽기만</b> 하는
                거울이다. 저장은 persist 가 <code>set</code> 마다 한다.{' '}
                <code>useSyncExternalStore</code> 의 두 번째 인자가 실제로 읽는 함수, 첫 번째 인자는
                &quot;다시 읽어라&quot;를 언제 알릴지 — 이 탭의 스토어 변경(구독)과 다른 탭의 변경(
                <code>storage</code> 이벤트) 두 경우다. <code>queueMicrotask</code> 는 persist 가
                구독자에게 알린 <b>뒤에</b> <code>setItem</code> 을 부르기 때문에 한 박자 미루는 것.
              </>
            ),
          },
          {
            q: '실무에서는 로그인 여부를 라우터·API 에서 확인하니 클라이언트에서 이럴 필요가 없지 않나?',
            a: (
              <>
                최종 판정은 서버가 한다는 점은 맞다. 그래도 클라이언트는 화면을 그리려고 상태를
                알고는 있어야 하고(헤더, 라우터 가드, 보호 API 호출 여부), 그 상태가 비동기로 오는
                동안의 &quot;모름&quot; 구간은 어디서 가져오든 똑같이 생긴다. 정리 항목의 마지막 두
                개 참고.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
