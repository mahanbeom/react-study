import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import Notes from '../ui/Notes.tsx';

// 공식문서 Performance and rendering > Connect to state with URL hash
//
// 이 꼭지의 진짜 주제는 URL 이 아니라 persist 미들웨어다.
// 미들웨어가 하는 일은 한 줄로 요약된다 — set 을 가로채서 원래 동작 뒤에 자기 일을 덧붙인다.
// persistImpl 의 핵심부(node_modules/zustand/esm/middleware.mjs):
//
//   const configResult = config(
//     (...args) => { set(...args); return setItem(); },   // ← set 을 감싼다
//     get, api,
//   )
//   api.setState = (state, replace) => { savedSetState(state, replace); return setItem(); }
//
// 그래서 스토어를 쓰는 쪽 코드는 전혀 바뀌지 않는다. set 을 부르면 저장까지 따라온다.
//
// 저장소는 두 겹으로 나뉘어 있다.
//
//   StateStorage        문자열 in / 문자열 out. localStorage 와 같은 모양.
//                       getItem(key) => string | null,  setItem(key, value: string)
//   createJSONStorage   그 위에 JSON.stringify / JSON.parse 를 얹어
//                       { state, version } 객체를 주고받게 해주는 어댑터.
//
// 즉 직렬화는 createJSONStorage 담당이고, StateStorage 는 "문자열을 어디에 둘 것인가" 만
// 책임진다. localStorage 대신 URL 해시를 쓰겠다는 게 이 꼭지의 전부다.

// 해시가 바뀌면 다시 그린다. zustand 내부가 쓰는 것과 같은 API 로 붙여본다.
const subscribeHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

function HashView() {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => '',
  );

  return (
    <p>
      현재 해시: <code>{decodeURIComponent(hash) || '(비어있음)'}</code>
    </p>
  );
}

function clearHash() {
  window.location.hash = '';
}

// ─────────────────────────────────────────────────────────────────────
// 1. 공식문서 코드를 그대로 옮긴 것
// ─────────────────────────────────────────────────────────────────────

// 문서에 실린 hashStorage 다. 동작은 하지만 JSON 을 한 겹 더 씌운다 —
// createJSONStorage 가 이미 stringify 해서 넘겨준 문자열을 여기서 또 stringify 하고,
// 읽을 때 또 parse 한다. 두 실수가 서로 상쇄되어 왕복은 성공하지만
// URL 에는 따옴표가 이스케이프된 이중 인코딩 문자열이 남는다.
// 게다가 해시가 비어 있으면 JSON.parse('') 가 던진다 (persist 가 삼켜서 조용히 실패한다).
const docHashStorage: StateStorage = {
  getItem: (key) => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    const storedValue = searchParams.get(key) ?? '';
    return JSON.parse(storedValue);
  },
  setItem: (key, newValue) => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    searchParams.set(key, JSON.stringify(newValue));
    window.location.hash = searchParams.toString();
  },
  removeItem: (key) => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    searchParams.delete(key);
    window.location.hash = searchParams.toString();
  },
};

type FishStore = {
  fishes: number;
  addAFish: () => void;
};

const useFishStore = create<FishStore>()(
  persist(
    (set, get) => ({
      fishes: 0,
      addAFish: () => set({ fishes: get().fishes + 1 }),
    }),
    {
      name: 'food-storage',
      storage: createJSONStorage(() => docHashStorage),
    },
  ),
);

function DocPanel() {
  const fishes = useFishStore((state) => state.fishes);
  const addAFish = useFishStore((state) => state.addAFish);

  return (
    <section>
      <h2>1. 공식문서 코드 그대로</h2>
      <p>fishes: {fishes}</p>
      <p>
        <button onClick={addAFish}>물고기 추가</button>{' '}
        <button onClick={clearHash}>해시 비우기</button>
      </p>
      <p>
        <small>
          몇 번 누른 뒤 <b>새로고침</b>해보라. 상태가 살아남는다. 왼쪽 예제 선택은{' '}
          <code>useState</code> 라 Introduction 으로 돌아가지만, 이 값은 URL 에 있으니 복원된다.
          <br />
          다만 아래 해시를 보면 <code>&quot;{'{'}\&quot;state\&quot;...&quot;</code> 처럼 따옴표가
          이스케이프되어 있다. JSON 이 두 번 씌워진 것이다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2. StateStorage 계약대로 고치기
// ─────────────────────────────────────────────────────────────────────

// TODO ① — StateStorage 는 "문자열을 넣고 문자열을 꺼내는" 계약이다.
//   직렬화는 createJSONStorage 가 이미 해준다. 지금은 문서 코드를 그대로 옮겨놔서
//   JSON.stringify / JSON.parse 가 한 겹씩 더 들어가 있다. 그 두 줄을 고쳐라.
//   (getItem 은 값이 없을 때 무엇을 돌려줘야 하는지도 같이 생각해볼 것 —
//    createJSONStorage 의 parse 는 null 을 특별 취급한다)
const hashStorage: StateStorage = {
  getItem: (key) => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    return JSON.parse(searchParams.get(key) ?? '');
  },
  setItem: (key, newValue) => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    searchParams.set(key, JSON.stringify(newValue));
    window.location.hash = searchParams.toString();
  },
  removeItem: (key) => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    searchParams.delete(key);
    window.location.hash = searchParams.toString();
  },
};

type ZooStore = {
  bears: number;
  /** 화면에만 쓰는 값. URL 에는 넣고 싶지 않다 */
  draftNote: string;
  addBear: () => void;
  setDraftNote: (note: string) => void;
};

const useZooStore = create<ZooStore>()(
  persist(
    (set) => ({
      bears: 0,
      draftNote: '',
      addBear: () => set((state) => ({ bears: state.bears + 1 })),
      setDraftNote: (note) => set({ draftNote: note }),
    }),
    {
      name: 'zoo-storage',
      storage: createJSONStorage(() => hashStorage),
      // TODO ② — 지금은 상태 전체가 URL 에 실린다. draftNote 는 빼라.
      //   persist 옵션 하나면 된다. 기본값은 (state) => state 다.
    },
  ),
);

function FixedPanel() {
  const bears = useZooStore((state) => state.bears);
  const draftNote = useZooStore((state) => state.draftNote);
  const addBear = useZooStore((state) => state.addBear);
  const setDraftNote = useZooStore((state) => state.setDraftNote);

  return (
    <section>
      <h2>2. 계약대로 고치기</h2>
      <p>bears: {bears}</p>
      <p>
        <button onClick={addBear}>곰 추가</button>
      </p>
      <p>
        메모(저장하지 않을 값):{' '}
        <input
          value={draftNote}
          onChange={(event) => setDraftNote(event.target.value)}
          placeholder="아무거나 입력"
          className="border px-2 py-1"
        />
      </p>
      <p>
        <small>
          TODO ① 을 고치면 해시에서 이스케이프가 사라진다. TODO ② 를 고치면 메모를 입력해도 해시에{' '}
          <code>draftNote</code> 가 나타나지 않는다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 3. Set 을 저장하면 — 07 에서 미뤄둔 숙제
// ─────────────────────────────────────────────────────────────────────

type TagStore = {
  tags: Set<string>;
  addTag: (tag: string) => void;
};

/**
 * 저장소에서 {} 로 돌아온 값까지 견디게 하는 임시 방어막.
 * TODO ③ 을 고치면 tags 는 항상 Set 이므로 이 함수는 지워도 된다.
 * (없으면 새로고침 직후 [...tags] 가 "tags is not iterable" 로 페이지를 통째로 죽인다)
 */
const asSet = (value: unknown): Set<string> =>
  value instanceof Set ? (value as Set<string>) : new Set<string>();

const useTagStore = create<TagStore>()(
  persist(
    (set) => ({
      tags: new Set<string>(),
      addTag: (tag) => set((state) => ({ tags: asSet(state.tags).add(tag) })),
    }),
    {
      name: 'tag-storage',
      // TODO ③ — 07 에서 남긴 숙제다. JSON.stringify(new Set(['a'])) 는 {} 를 뱉는다.
      //   지금 상태로 태그를 추가하고 해시를 보면 tags 가 {} 로 비어 있고,
      //   새로고침하면 태그가 사라진다.
      //   createJSONStorage 는 두 번째 인자로 { replacer, reviver } 를 받는다
      //   (JSON.stringify / JSON.parse 에 그대로 넘어가는 그 콜백이다).
      //   Set 을 저장 가능한 모양으로 바꿨다가 되돌려라.
      storage: createJSONStorage(() => hashStorage),
    },
  ),
);

function TagPanel() {
  const tags = useTagStore((state) => state.tags);
  const addTag = useTagStore((state) => state.addTag);

  // 새로고침 뒤에는 이 값이 Set 이 아닐 수 있다. 그 사실 자체가 이 패널의 관찰 대상이다.
  const isSet = tags instanceof Set;

  return (
    <section>
      <h2>3. Set 을 URL 에 저장하면</h2>
      <p>
        tags: <code>{[...asSet(tags)].join(', ') || '(비어있음)'}</code>
      </p>
      <p>
        복원된 값의 정체: <code>{isSet ? 'Set' : Object.prototype.toString.call(tags)}</code>{' '}
        {!isSet && (
          <b>
            — 저장소에서 <code>{'{}'}</code> 로 돌아왔다.{' '}
            <code>JSON.stringify(new Set([...]))</code> 가 <code>{'{}'}</code> 를 뱉기 때문이다.
          </b>
        )}
      </p>
      <p>
        {['react', 'zustand', 'vite'].map((tag) => (
          <span key={tag}>
            <button onClick={() => addTag(tag)}>{tag} 추가</button>{' '}
          </span>
        ))}
      </p>
      <p>
        <small>
          고치기 전에는 해시의 <code>tags</code> 가 <code>{'{}'}</code> 로 남고 새로고침하면 목록이
          비어버린다. 고친 뒤에는 <code>instanceof Set</code> 까지 복원되어야 한다.
        </small>
      </p>
    </section>
  );
}

export default function UrlHash() {
  return (
    <>
      <p>
        <code>persist</code> 미들웨어는 <code>set</code> 을 가로채 저장을 덧붙이고, 스토어가
        만들어질 때 저장소에서 읽어 상태를 복원(hydrate)한다. 저장소는 <code>localStorage</code> 가
        기본이지만 <b>문자열을 넣고 꺼낼 수만 있으면</b> 무엇이든 된다. 여기서는 URL 해시를 저장소로
        쓴다 — 그러면 상태가 <b>공유 가능한 링크</b>가 된다.
      </p>

      <HashView />
      <DocPanel />
      <FixedPanel />
      <TagPanel />

      <Notes
        points={[
          <>
            미들웨어의 정체는 <b>set 을 감싼 함수</b>다. <code>persist</code> 는 <code>set</code> 을
            부를 때마다 <code>storage.setItem</code> 을 뒤에 붙이고, <code>api.setState</code> 도
            같은 방식으로 덮어쓴다. 그래서 스토어를 쓰는 쪽 코드는 한 글자도 바뀌지 않는다.
          </>,
          <>
            저장 단위는 상태 그대로가 아니라 <code>{'{ state, version }'}</code> 객체다.{' '}
            <code>version</code> 이 있어서 나중에 <code>migrate</code> 로 스키마 변경을 처리할 수
            있다.
          </>,
          <>
            <code>StateStorage</code> 는 <b>문자열만</b> 다룬다. 직렬화는 그 위의{' '}
            <code>createJSONStorage</code> 가 맡는다. 이 경계를 헷갈려 <code>StateStorage</code>{' '}
            안에서 <code>JSON.parse</code> 를 하면 JSON 이 두 겹으로 씌워진다.
          </>,
          <>
            hydration 은 <code>set(stateFromStorage, true)</code> — <b>replace 모드</b>다. 04 에서
            실측한 &quot;replace 는 액션까지 지운다&quot; 가 여기서도 유효하다. 기본{' '}
            <code>merge</code> 가 <code>{'{ ...currentState, ...persistedState }'}</code> 라 액션이
            살아남을 뿐이다. <code>merge</code> 를 직접 쓸 때 주의할 것.
          </>,
          <>
            액션은 저장되지 않는다 — <code>JSON.stringify</code> 가 함수를 통째로 빼기 때문이다.
            반면 <code>partialize</code> 는 <b>의도적으로</b> 저장 대상을 고르는 옵션이다.
          </>,
          <>
            URL 해시를 저장소로 쓰면 상태가 링크가 된다. 대신 제약이 붙는다 — 길이 한계, 노출
            (민감한 값 금지), 그리고 <code>location.hash =</code> 는 히스토리에 항목을 쌓는다
            (뒤로가기가 지저분해진다. <code>history.replaceState</code> 를 쓰면 피할 수 있다).
          </>,
        ]}
      />
    </>
  );
}
