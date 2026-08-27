import { useEffect, useState, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Notes from '../ui/Notes.tsx';

// 실무에서 실제로 쓰는 두 가지 모양을 나란히 둔다.
// 예제 10 은 공식문서를 따라 URL 해시를 persist 저장소로 썼지만, 실무에서는
// 두 관심사를 분리하는 쪽이 일반적이다.
//
//   저장(persist)  — 사용자 기기에 남길 값. localStorage. 링크로 공유하지 않는다.
//   주소(URL)      — 공유·북마크·뒤로가기의 대상. 라우터가 담당한다.
//
// 여기서는 라우터 없이 History API 로 직접 붙인다. 라우터가 내부에서 하는 일이
// 그대로 드러나서 구조를 익히기엔 오히려 낫다.

// ═════════════════════════════════════════════════════════════════════
// A. 표준 persist — localStorage + partialize + version/migrate
// ═════════════════════════════════════════════════════════════════════

type Theme = 'light' | 'dark';

type PrefState = {
  theme: Theme;
  sidebarOpen: boolean;
  recentSearches: string[];
  /** 화면에서만 쓰는 값. 저장 대상이 아니다 */
  draft: string;
};

type PrefStore = PrefState & {
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setDraft: (draft: string) => void;
  commitDraft: () => void;
};

/** partialize 가 돌려주는 모양 = 실제로 저장되는 모양 */
type PersistedPrefs = Pick<PrefState, 'theme' | 'sidebarOpen' | 'recentSearches'>;

const PREFS_KEY = 'study-prefs';

const usePrefStore = create<PrefStore>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      recentSearches: [],
      draft: '',

      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setDraft: (draft) => set({ draft }),
      commitDraft: () =>
        set((state) => {
          const keyword = state.draft.trim();
          if (!keyword) return {};
          // 중복 제거 후 맨 앞에, 최대 5개
          const next = [keyword, ...state.recentSearches.filter((s) => s !== keyword)];
          return { recentSearches: next.slice(0, 5), draft: '' };
        }),
    }),
    {
      name: PREFS_KEY,

      // 저장할 것을 "고른다". 새 상태 필드가 늘어도 자동으로 저장되지 않는다.
      partialize: (state): PersistedPrefs => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        recentSearches: state.recentSearches,
      }),

      // 저장 형식이 바뀔 때마다 올린다. 옛 데이터를 만나면 migrate 가 불린다.
      version: 2,

      // v1 은 recentSearches 대신 lastSearch: string 하나를 갖고 있었다고 하자.
      // migrate 를 주지 않으면 zustand 는 console.error 를 찍고 저장된 값을 통째로 버린다.
      migrate: (persisted, version): PersistedPrefs => {
        if (version < 2) {
          const old = persisted as Partial<PersistedPrefs> & { lastSearch?: string };
          return {
            theme: old.theme ?? 'light',
            sidebarOpen: old.sidebarOpen ?? true,
            recentSearches: old.lastSearch ? [old.lastSearch] : [],
          };
        }
        return persisted as PersistedPrefs;
      },

      // 복원 전에 불리고, 반환한 함수가 복원 후에 불린다.
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('[prefs] 복원 실패', error);
      },
    },
  ),
);

/**
 * 복원이 끝났는지 알려준다.
 * localStorage 는 동기라 첫 렌더부터 true 지만, AsyncStorage · IndexedDB · SSR 에서는
 * 첫 렌더가 "초기 상태"로 지나가므로 이 게이트가 필요하다. 그래서 패턴만 익혀둔다.
 */
function useHydrated() {
  const [hydrated, setHydrated] = useState(() => usePrefStore.persist.hasHydrated());

  useEffect(() => usePrefStore.persist.onFinishHydration(() => setHydrated(true)), []);

  return hydrated;
}

/** localStorage 를 그대로 들여다본다 */
function useStoredPrefs() {
  const raw = useSyncExternalStore(
    (onChange) => {
      // 같은 탭의 변경은 storage 이벤트가 안 온다. 스토어 구독으로 대신한다.
      const unsubStore = usePrefStore.subscribe(onChange);
      window.addEventListener('storage', onChange);
      return () => {
        unsubStore();
        window.removeEventListener('storage', onChange);
      };
    },
    () => window.localStorage.getItem(PREFS_KEY),
    () => null,
  );

  return raw;
}

/** v1 형식 데이터를 심고 새로고침한다 — migrate 가 도는 걸 보기 위한 장치 */
function seedLegacyData() {
  window.localStorage.setItem(
    PREFS_KEY,
    JSON.stringify({
      state: { theme: 'dark', sidebarOpen: false, lastSearch: 'zustand' },
      version: 1,
    }),
  );
  window.location.reload();
}

function PrefsPanel() {
  const theme = usePrefStore((state) => state.theme);
  const sidebarOpen = usePrefStore((state) => state.sidebarOpen);
  const recentSearches = usePrefStore((state) => state.recentSearches);
  const draft = usePrefStore((state) => state.draft);
  const toggleTheme = usePrefStore((state) => state.toggleTheme);
  const toggleSidebar = usePrefStore((state) => state.toggleSidebar);
  const setDraft = usePrefStore((state) => state.setDraft);
  const commitDraft = usePrefStore((state) => state.commitDraft);

  const hydrated = useHydrated();
  const stored = useStoredPrefs();

  return (
    <section>
      <h2>A. 표준 persist — localStorage</h2>

      <p>
        복원 상태: <code>{hydrated ? '완료' : '진행 중'}</code>
      </p>

      <p>
        theme: <code>{theme}</code> / sidebar: <code>{sidebarOpen ? 'open' : 'closed'}</code>
      </p>
      <p>
        <button onClick={toggleTheme}>테마 토글</button>{' '}
        <button onClick={toggleSidebar}>사이드바 토글</button>
      </p>

      <p>
        검색어:{' '}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitDraft();
          }}
          placeholder="입력 후 Enter"
          className="border px-2 py-1"
        />{' '}
        <button onClick={commitDraft}>추가</button>
      </p>
      <p>
        최근 검색어: <code>{recentSearches.join(', ') || '(없음)'}</code>
      </p>

      <p>
        저장된 값: <code>{stored ?? '(없음)'}</code>
      </p>
      <p>
        <button onClick={seedLegacyData}>v1 형식 데이터 심고 새로고침</button>{' '}
        <button
          onClick={() => {
            usePrefStore.persist.clearStorage();
            window.location.reload();
          }}
        >
          저장소 비우고 새로고침
        </button>
      </p>

      <p>
        <small>
          <b>draft</b> 는 타이핑해도 저장된 값에 나타나지 않는다 — <code>partialize</code> 가
          골라내기 때문이다. <b>v1 형식 데이터 심고 새로고침</b> 을 누르면{' '}
          <code>lastSearch: &apos;zustand&apos;</code> 하나가 <code>recentSearches</code> 배열로
          변환되어 올라온다. <code>migrate</code> 가 도는 장면이다.
        </small>
      </p>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════
// B. URL 동기화 — History API
// ═════════════════════════════════════════════════════════════════════

type Sort = 'name' | 'price';

type Filters = {
  q: string;
  sort: Sort;
  page: number;
};

// 기본값은 URL 에 쓰지 않는다. 링크가 짧아지고 "손대지 않은 상태"가 명확해진다.
const DEFAULT_FILTERS: Filters = { q: '', sort: 'name', page: 1 };

/** URL → 상태. 값이 없거나 이상하면 기본값으로 떨어진다 (URL 은 사용자가 손댈 수 있다) */
function readFiltersFromUrl(): Filters {
  const params = new URLSearchParams(window.location.search);
  const page = Number(params.get('page'));

  return {
    q: params.get('q') ?? DEFAULT_FILTERS.q,
    sort: params.get('sort') === 'price' ? 'price' : DEFAULT_FILTERS.sort,
    page: Number.isInteger(page) && page > 0 ? page : DEFAULT_FILTERS.page,
  };
}

/** 상태 → URL */
function writeFiltersToUrl(filters: Filters, mode: 'push' | 'replace') {
  const params = new URLSearchParams(window.location.search);

  const put = (key: string, value: string, fallback: string) => {
    if (value === fallback) params.delete(key);
    else params.set(key, value);
  };

  put('q', filters.q, DEFAULT_FILTERS.q);
  put('sort', filters.sort, DEFAULT_FILTERS.sort);
  put('page', String(filters.page), String(DEFAULT_FILTERS.page));

  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;

  // 히스토리에 남길지 말지를 "변경의 의미"로 정한다. 이게 라우터가 하는 판단이다.
  if (mode === 'push') window.history.pushState(null, '', next);
  else window.history.replaceState(null, '', next);
}

type FilterStore = Filters & {
  setQ: (q: string) => void;
  setSort: (sort: Sort) => void;
  setPage: (page: number) => void;
  /** 뒤로가기 등으로 URL 이 바뀌었을 때 되읽는다 */
  syncFromUrl: () => void;
};

const useFilterStore = create<FilterStore>()((set) => ({
  // 진실의 원천은 스토어지만, 그 초기값은 URL 에서 온다.
  ...readFiltersFromUrl(),

  // 검색어나 정렬이 바뀌면 페이지는 1로 되돌린다 (목록 UI 의 관례)
  setQ: (q) => set({ q, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) => set({ page }),
  syncFromUrl: () => set(readFiltersFromUrl()),
}));

// 양방향 동기화의 필수품: "지금 이 변경은 URL 이 원인인가?"
// 이 플래그가 없으면 popstate → 상태 갱신 → 구독 발화 → 다시 pushState 로 되먹임이 돈다.
// 그 push 가 앞으로가기 히스토리를 지워서 뒤로가기만 되고 앞으로가기가 죽는다. (실측함)
let applyingFromUrl = false;

// ── 스토어 → URL (나가는 방향) ─────────────────────────────────────
// persist 와 달리 "언제 쓸지"를 우리가 정한다. 타이핑마다 히스토리를 쌓지 않기 위해서다.
let writeTimer: ReturnType<typeof setTimeout> | undefined;
let pendingPush = false;

useFilterStore.subscribe((state, prev) => {
  if (applyingFromUrl) return;

  if (state.page !== prev.page) pendingPush = true;

  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    // 지연 실행이므로 그때의 최신 상태를 다시 읽는다
    writeFiltersToUrl(useFilterStore.getState(), pendingPush ? 'push' : 'replace');
    pendingPush = false;
  }, 300);
});

// ── URL → 스토어 (들어오는 방향) ───────────────────────────────────
// 뒤로가기/앞으로가기는 popstate 로만 알 수 있다. 이게 없으면 주소는 바뀌는데 화면이 안 바뀐다.
window.addEventListener('popstate', () => {
  // 아직 안 나간 쓰기가 남아 있으면 취소한다. 사용자가 이미 다른 주소로 옮겼으므로 무효다.
  clearTimeout(writeTimer);
  pendingPush = false;

  applyingFromUrl = true;
  useFilterStore.getState().syncFromUrl();
  applyingFromUrl = false;
});

function useCurrentUrl() {
  return useSyncExternalStore(
    (onChange) => {
      const unsub = useFilterStore.subscribe(onChange);
      window.addEventListener('popstate', onChange);
      return () => {
        unsub();
        window.removeEventListener('popstate', onChange);
      };
    },
    () => window.location.search,
    () => '',
  );
}

function FiltersPanel() {
  const q = useFilterStore((state) => state.q);
  const sort = useFilterStore((state) => state.sort);
  const page = useFilterStore((state) => state.page);
  const setQ = useFilterStore((state) => state.setQ);
  const setSort = useFilterStore((state) => state.setSort);
  const setPage = useFilterStore((state) => state.setPage);

  const search = useCurrentUrl();

  return (
    <section>
      <h2>B. URL 동기화 — History API</h2>

      <p>
        현재 쿼리: <code>{search || '(비어있음)'}</code>
      </p>

      <p>
        검색어:{' '}
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="타이핑해보라"
          className="border px-2 py-1"
        />
      </p>
      <p>
        정렬:{' '}
        <button onClick={() => setSort('name')} aria-pressed={sort === 'name'}>
          이름순
        </button>{' '}
        <button onClick={() => setSort('price')} aria-pressed={sort === 'price'}>
          가격순
        </button>{' '}
        (현재 <code>{sort}</code>)
      </p>
      <p>
        페이지: <code>{page}</code>{' '}
        <button onClick={() => setPage(Math.max(1, page - 1))}>이전</button>{' '}
        <button onClick={() => setPage(page + 1)}>다음</button>
      </p>

      <p>
        <small>
          타이핑은 <code>replaceState</code> 라 히스토리가 쌓이지 않는다. <b>페이지 이동만</b>{' '}
          <code>pushState</code> 다 — 몇 번 넘긴 뒤 브라우저 <b>뒤로가기</b> 를 눌러보면 페이지만
          되돌아온다. 기본값(<code>page=1</code>, <code>sort=name</code>)은 URL 에서 아예 빠진다.
        </small>
      </p>
    </section>
  );
}

export default function PracticalPersist() {
  return (
    <>
      <p>
        예제 10 은 공식문서를 따라 URL 해시를 <code>persist</code> 저장소로 썼다. 실무에서는 두
        관심사를 나눈다 — <b>기기에 남길 값</b>은 <code>persist</code> 로 localStorage 에,{' '}
        <b>공유·북마크·뒤로가기의 대상</b>은 URL 에. 여기서는 라우터 없이 History API 로 직접
        붙여서, 라우터가 내부에서 하는 일을 드러낸다.
      </p>

      <PrefsPanel />
      <FiltersPanel />

      <Notes
        points={[
          <>
            <b>저장 대상은 고른다.</b> <code>partialize</code> 를 화이트리스트로 쓰면 상태 필드가
            늘어도 저장 대상이 저절로 늘지 않는다. 반환 타입을 별도 이름(
            <code>PersistedPrefs</code>)으로 두면 <code>migrate</code> 의 반환 타입도 여기에
            맞춰진다.
          </>,
          <>
            <b>저장 형식을 바꾸면 version 을 올린다.</b> <code>migrate</code> 없이 버전만 올리면
            zustand 는 <code>console.error</code> 를 찍고 저장된 값을 <b>통째로 버린다</b>. 옛
            사용자의 설정이 조용히 초기화되는 경로다.
          </>,
          <>
            <code>hasHydrated()</code> / <code>onFinishHydration()</code> 게이트는 localStorage
            에서는 필요 없다(동기라 첫 렌더부터 완료). AsyncStorage · IndexedDB · SSR 에서는 필수다.
            패턴을 미리 익혀두는 자리다.
          </>,
          <>
            URL 쪽은 <b>진실의 원천이 스토어</b>이고 URL 은 그 투영이다. 초기값만 URL 에서 읽고,
            이후 <code>subscribe</code> 로 내보내고 <code>popstate</code> 로 되받는다. 이 양방향이
            라우터 연동의 최소 골격이다.
          </>,
          <>
            <b>persist 와 결정적으로 다른 점</b>: URL 은 &quot;언제 쓸지&quot;를 우리가 정한다.
            타이핑은 <code>replaceState</code>, 페이지 이동은 <code>pushState</code>.{' '}
            <code>persist</code> 는 모든 <code>set</code> 을 똑같이 취급하므로 이 구분을 할 수 없다
            — 예제 10 에서 뒤로가기가 지저분해지는 이유다.
          </>,
          <>
            <b>기본값은 URL 에 쓰지 않는다.</b> 링크가 짧아지고, &quot;손대지 않은 상태&quot;가
            명확해지며, 기본값을 나중에 바꿔도 옛 링크가 새 기본값을 따라간다.
          </>,
          <>
            <b>URL 은 공개 인터페이스다.</b> <code>?q=apple&amp;sort=price</code> 처럼 납작하게
            쓴다.{' '}
            <code>
              ?store={'{'}&quot;state&quot;:...{'}'}
            </code>{' '}
            처럼 내부 저장 포맷을 노출하면 스토어를 리팩터링하는 순간 옛 링크가 깨진다.
          </>,
          <>
            읽는 쪽(<code>readFiltersFromUrl</code>)은 <b>방어적으로</b> 쓴다. URL 은 사용자가 직접
            고칠 수 있는 입력이다. <code>page=abc</code> 가 와도 기본값으로 떨어져야 한다.
          </>,
          <>
            <b>양방향 동기화의 함정</b>: <code>popstate</code> 로 상태를 갱신하면 그 갱신이 다시
            구독을 깨워 URL 을 또 쓴다. 그 <code>pushState</code> 가{' '}
            <b>앞으로가기 히스토리를 지운다</b> — 뒤로가기는 되는데 앞으로가기가 죽는다.{' '}
            <code>applyingFromUrl</code> 플래그로 &quot;URL 이 원인인 변경&quot;을 구분해 끊어야
            한다. 라우터를 쓰면 이 처리가 이미 안에 들어 있다.
          </>,
        ]}
      />
    </>
  );
}
