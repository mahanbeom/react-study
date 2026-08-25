import { useRef, useState } from 'react';
import { create } from 'zustand';
import Notes from '../ui/Notes.tsx';

// 공식문서 Core concepts > Map and Set Usage
// Map/Set 은 "변경 가능한" 자료구조라, 메서드를 부르면 원본이 바뀌고 참조는 그대로다.
// 그래서 갱신할 때마다 new Map(...) / new Set(...) 으로 복사본을 만들어야 한다.
//
// 03 의 mutation 함정과 겉모습은 같지만 막히는 지점이 다르다. 그걸 실측한다.

type CollectionStore = {
  tags: Set<string>;
  users: Map<string, string>;
  toggleTag: (tag: string) => void;
  mutateTag: (tag: string) => void;
  addUser: (id: string, name: string) => void;
  removeUser: (id: string) => void;
  reset: () => void;
};

const INITIAL_TAGS = ['react', 'zustand'];
const INITIAL_USERS: [string, string][] = [['u1', '김철수']];

const useCollectionStore = create<CollectionStore>()((set) => ({
  tags: new Set(INITIAL_TAGS),
  users: new Map(INITIAL_USERS),

  // 정석: 복사본을 만들고, 그 복사본을 고친 뒤 돌려준다
  toggleTag: (tag) =>
    set((state) => {
      const next = new Set(state.tags);
      // delete 는 boolean 을 반환하므로 체이닝할 수 없다. 여러 줄로 쓴다.
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return { tags: next };
    }),

  // 안티패턴: 원본 Set 을 직접 고치고 같은 참조를 돌려준다
  mutateTag: (tag) =>
    set((state) => {
      state.tags.add(tag);
      return { tags: state.tags };
      // 03 과 달리 반환값은 "새 객체"다 → 스토어는 구독자에게 알림을 보낸다.
      // 하지만 selector 가 뽑아내는 tags 의 참조는 그대로라 리렌더는 일어나지 않는다.
    }),

  // add 는 Set 자신을 반환하므로 이렇게 체이닝된다
  addUser: (id, name) => set((state) => ({ users: new Map(state.users).set(id, name) })),

  removeUser: (id) =>
    set((state) => {
      const next = new Map(state.users);
      next.delete(id);
      return { users: next };
    }),

  reset: () => set({ tags: new Set(INITIAL_TAGS), users: new Map(INITIAL_USERS) }),
}));

// 스토어가 "알림"을 몇 번 보냈는지 센다. 리렌더 횟수와 구별하기 위한 계측기.
let notifyCount = 0;
useCollectionStore.subscribe(() => {
  notifyCount += 1;
});

// ── 표시 전용 (구독) ────────────────────────────────────────────
function TagsDisplay() {
  const tags = useCollectionStore((state) => state.tags);
  const renders = useRef(0);
  renders.current += 1;

  return (
    <p>
      tags: <code>{[...tags].join(', ') || '(비어있음)'}</code> / size: {tags.size} / 이
      컴포넌트 렌더 횟수: <strong>{renders.current}</strong>
    </p>
  );
}

function UsersDisplay() {
  const users = useCollectionStore((state) => state.users);

  return (
    <p>
      users:{' '}
      <code>
        {[...users].map(([id, name]) => `${id}=${name}`).join(', ') || '(비어있음)'}
      </code>{' '}
      / size: {users.size}
    </p>
  );
}

// ── 조작 전용 (구독한 값을 화면에 쓰지 않는다) ──────────────────
function SetControls() {
  const toggleTag = useCollectionStore((state) => state.toggleTag);
  const mutateTag = useCollectionStore((state) => state.mutateTag);
  const [probe, setProbe] = useState('');

  const peek = () => {
    const { tags } = useCollectionStore.getState();
    setProbe(`알림 ${notifyCount}회 / 실제 size ${tags.size} / [${[...tags].join(', ')}]`);
  };

  return (
    <>
      <p>
        <button onClick={() => toggleTag('vite')}>정석 토글: vite</button>{' '}
        <button onClick={() => mutateTag('mutated')}>안티패턴 추가: mutated</button>{' '}
        <button onClick={peek}>실제 상태 들여다보기</button>
      </p>
      {probe && (
        <p>
          → <code>{probe}</code>
        </p>
      )}
    </>
  );
}

function SetPanel() {
  // TagsDisplay 와 SetControls 를 형제로 둔다.
  // 한 컴포넌트에 합치면 peek 의 로컬 state 변경만으로 TagsDisplay 가 같이 리렌더되어
  // selector 가 다시 읽히고, "안 바뀐 척"이 들통난다. (03 에서 겪은 것과 같은 함정)
  return (
    <section>
      <h2>1. Set — 같은 mutation 인데 03 과 막히는 곳이 다르다</h2>
      <TagsDisplay />
      <SetControls />
      <p>
        <small>
          <b>안티패턴 추가</b> 를 눌러도 화면의 tags 와 렌더 횟수는 그대로다. 그런데{' '}
          <b>실제 상태 들여다보기</b> 를 누르면 size 는 늘어 있고 <b>알림 횟수도 올라가 있다.</b>{' '}
          03 의 함정은 알림 자체가 안 갔지만, 이번엔 알림은 갔는데 selector 가 뽑은 Set 의
          참조가 그대로라 리렌더가 안 된 것이다. 같은 &quot;mutation 함정&quot;이지만 관문이
          다르다.
        </small>
      </p>
    </section>
  );
}

function MapPanel() {
  const addUser = useCollectionStore((state) => state.addUser);
  const removeUser = useCollectionStore((state) => state.removeUser);
  const reset = useCollectionStore((state) => state.reset);
  const nextId = useRef(2);

  return (
    <section>
      <h2>2. Map — 복사 후 수정</h2>
      <UsersDisplay />
      <p>
        <button
          onClick={() => {
            addUser(`u${nextId.current}`, `사용자${nextId.current}`);
            nextId.current += 1;
          }}
        >
          추가
        </button>{' '}
        <button onClick={() => removeUser('u1')}>u1 삭제</button>{' '}
        <button onClick={reset}>reset</button>
      </p>
      <p>
        <small>
          추가는 <code>new Map(state.users).set(id, name)</code> 한 줄이다 —{' '}
          <code>Map.prototype.set</code> 이 <b>Map 자신을 반환</b>하기 때문에 체이닝된다.
          삭제는 그렇게 못 쓴다. <code>delete</code> 는 <b>boolean 을 반환</b>하므로 복사 ·
          삭제 · 반환을 여러 줄로 나눠야 한다.
        </small>
      </p>
    </section>
  );
}

export default function MapsAndSets() {
  return (
    <>
      <p>
        Map 과 Set 은 변경 가능한 자료구조다. <code>add</code> · <code>set</code> ·{' '}
        <code>delete</code> 를 부르면 원본이 바뀌지만 <b>참조는 그대로</b>다. zustand 는 참조로
        변경을 판단하므로, 갱신할 때마다 <code>new Set(...)</code> /{' '}
        <code>new Map(...)</code> 으로 복사본을 만들어야 한다. 지금까지의 불변 갱신 규칙이
        자료구조만 바뀐 채 되풀이되는 셈이다.
      </p>

      <SetPanel />
      <MapPanel />

      <Notes
        points={[
          <>
            갱신은 항상 <b>복사본을 만들고 → 복사본을 고치고 → 복사본을 반환</b>한다.{' '}
            <code>new Set(state.tags)</code>, <code>new Map(state.users)</code>.
          </>,
          <>
            <code>Set.add</code> 와 <code>Map.set</code> 은 <b>자기 자신을 반환</b>해서
            체이닝이 되지만, <code>delete</code> 는 <b>boolean 을 반환</b>한다. 그래서 삭제는
            반드시 여러 줄로 쓴다 — 체이닝하면 상태가 <code>true</code> 가 되어버린다.
          </>,
          <>
            이번 mutation 함정은 <b>두 번째 관문</b>에서 막힌다. 반환값이 새 객체(
            <code>{'{ tags: ... }'}</code>)라 스토어는 알림을 보내지만, selector 가 뽑은 Set 의
            참조가 같아 리렌더되지 않는다. 03 은 첫 번째 관문(<code>setState</code> 의 참조
            비교)에서 막혔었다.
          </>,
          <>
            빈 컬렉션 타입 함정: <code>new Set([])</code> 는 <code>Set&lt;never&gt;</code> 로,{' '}
            <code>new Map([])</code> 은 <code>Map&lt;unknown, unknown&gt;</code> 으로 추론된다.{' '}
            <code>new Set([] as string[])</code> 처럼 힌트를 준다.
          </>,
          <>
            다만 <code>create&lt;State&gt;()</code> 로 스토어 타입을 <b>명시했다면</b> 문맥
            타이핑이 채워주므로 <code>new Set([])</code> 로도 문제가 없다. 이 함정은 타입을
            추론에 맡겼을 때 터진다.
          </>,
          <>
            복사는 <code>O(n)</code> 이다. 항목이 수만 개면 갱신마다 전체 복사 비용이 든다.
            그때는 Immer 같은 구조적 공유 라이브러리를 검토한다.
          </>,
        ]}
        questions={[
          {
            q: '빈 Set/Map 타입 힌트가 정말 필요한가?',
            a: (
              <>
                추론에 맡기면 필요하다. 실측 결과 <code>new Set()</code> →{' '}
                <code>Set&lt;unknown&gt;</code>, <code>new Set([])</code> →{' '}
                <code>Set&lt;never&gt;</code>, <code>new Map([])</code> →{' '}
                <code>Map&lt;unknown, unknown&gt;</code> 이었다.{' '}
                <code>create(() =&gt; ({'{'} ids: new Set([]) {'}'}))</code> 처럼 타입을 안
                적으면 나중에 <code>.add(&apos;x&apos;)</code> 가{' '}
                <b>&quot;&apos;x&apos; is not assignable to parameter of type
                &apos;never&apos;&quot;</b> 로 막힌다. 반대로{' '}
                <code>create&lt;{'{ ids: Set<string> }'}&gt;()</code> 처럼 명시하면 문맥
                타이핑이 <code>Set&lt;string&gt;</code> 으로 채워줘서 힌트가 없어도 통과한다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
