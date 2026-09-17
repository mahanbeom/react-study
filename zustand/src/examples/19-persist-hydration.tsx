import { useEffect, useSyncExternalStore } from 'react';
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

      // TODO ② — 지금은 메모리만 되돌린다. 게이트 없는 패널에서 "복원 중"에 로그아웃해 보라:
      //   복원이 끝나는 순간 옛 사용자가 되살아난다. 복원 요청은 로그아웃 전에 이미 나갔고,
      //   늦게 돌아온 결과가 set(…, true) 로 덮어쓰기 때문이다.
      //   clearStorage() 를 함께 불러라 — 저장된 키를 지우고, 진행 중인 복원도 버린다
      //   (middleware.mjs 의 hydrationVersion 카운터가 올라가서 늦게 온 결과는 무시된다):
      //     useSessionStore.persist.clearStorage();
      //   16 의 리셋 패턴(getInitialState + replace)에 이 한 줄이 더 붙는 것이 로그아웃이다.
      logout: () => set(store.getInitialState(), true),
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
  // TODO ① — 지금은 무조건 true 라서 "게이트 있음" 패널도 게이트 없는 것과 똑같이 깜빡인다.
  //   공식문서 FAQ 의 useHydration 패턴으로 바꿔라:
  //     const [hydrated, setHydrated] = useState(false);
  //     useEffect(() => {
  //       const unsubHydrate = useSessionStore.persist.onHydrate(() => setHydrated(false));
  //       const unsubFinish = useSessionStore.persist.onFinishHydration(() => setHydrated(true));
  //       setHydrated(useSessionStore.persist.hasHydrated());   // 구독 전에 이미 끝났을 수도 있다
  //       return () => {
  //         unsubHydrate();
  //         unsubFinish();
  //       };
  //     }, []);
  //     return hydrated;
  //   onHydrate 는 rehydrate() 로 다시 복원할 때 false 로 되돌리기 위한 것이다.
  return true;
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
        ]}
      />
    </>
  );
}
