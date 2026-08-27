import { Component, useRef, type ReactNode } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { shallow } from 'zustand/vanilla/shallow';
import Notes from '../ui/Notes.tsx';

// 공식문서 Performance and rendering > Prevent rerenders with useShallow
//
// 지금까지의 규칙: selector 반환값을 Object.is 로 비교해서 다르면 리렌더.
// 문제는 selector 안에서 "계산"을 하는 순간 결과가 매번 새 객체/새 배열이 된다는 것이다.
// 내용은 똑같은데 참조만 다르니 Object.is 는 항상 false → 리렌더가 멈추지 않는다.
//
// useShallow 는 그 비교를 Object.is 대신 "얕은 비교(shallow)" 로 바꿔준다.
// 구현은 열 줄이 안 된다 (node_modules/zustand/esm/react/shallow.mjs):
//
//   function useShallow(selector) {
//     const prev = React.useRef(undefined)
//     return (state) => {
//       const next = selector(state)
//       return shallow(prev.current, next) ? prev.current : (prev.current = next)
//     }
//   }
//
// 즉 "새로 계산한 값이 이전 값과 얕게 같으면 이전 값을 그대로 돌려준다".
// 반환되는 참조가 유지되므로 그 뒤의 Object.is 비교는 통과하고, 리렌더는 일어나지 않는다.

// ─────────────────────────────────────────────────────────────────────
// 1. 공식문서 예제 — selector 가 매번 새 배열을 만들면 어떻게 되는가
// ─────────────────────────────────────────────────────────────────────

type Meals = {
  papaBear: string;
  mamaBear: string;
  littleBear: string;
};

// 04 에서 다룬 "액션 없는 스토어". 갱신은 useMeals.setState 로 직접 한다.
const useMeals = create<Meals>()(() => ({
  papaBear: 'large porridge-pot',
  mamaBear: 'middle-size porridge pot',
  littleBear: 'A little, small, wee pot',
}));

// 안티패턴: Object.keys 는 호출할 때마다 새 배열을 만든다.
// 문서는 "불필요한 리렌더가 난다" 고만 적었지만, v5(useSyncExternalStore) 에서는
// 렌더 → 스냅샷 비교 → 다름 → 다시 렌더 가 끝없이 반복되어 아예 터진다.
function NamesNaive() {
  const names = useMeals((state) => Object.keys(state));
  const renders = useRef(0);
  renders.current += 1;

  return (
    <p>
      이름: <code>{names.join(', ')}</code> / 렌더 <strong>{renders.current}</strong>
    </p>
  );
}

// 정석: 같은 selector 를 useShallow 로 감싼다.
function NamesWithShallow() {
  const names = useMeals(useShallow((state) => Object.keys(state)));
  const renders = useRef(0);
  renders.current += 1;

  return (
    <p>
      이름: <code>{names.join(', ')}</code> / 렌더 <strong>{renders.current}</strong>
    </p>
  );
}

// 조작부는 표시부와 형제로 둔다. 자식으로 두면 조작부의 상태 변경만으로
// 표시부까지 리렌더되어 계측이 오염된다. (03 · 07 에서 두 번 겪은 함정)
function MealControls() {
  return (
    <p>
      <button onClick={() => useMeals.setState({ papaBear: 'a large pizza' })}>
        papaBear → 피자
      </button>{' '}
      <button onClick={() => useMeals.setState({ papaBear: 'large porridge-pot' })}>
        papaBear → 원래대로
      </button>
    </p>
  );
}

// 무한 루프가 나도 페이지 전체가 죽지 않도록 감싸둔다.
type BoundaryProps = { children: ReactNode; fallback: ReactNode };
type BoundaryState = { failed: boolean };

class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function MealsPanel() {
  return (
    <section>
      <h2>1. selector 가 매번 새 배열을 만들면</h2>

      <h3>안티패턴 — 그냥 Object.keys</h3>
      <ErrorBoundary
        fallback={
          <p>
            <code>Maximum update depth exceeded</code> — 무한 루프로 터졌다. 콘솔의{' '}
            <code>The result of getSnapshot should be cached</code> 경고도 함께 확인해볼 것.
          </p>
        }
      >
        <NamesNaive />
      </ErrorBoundary>

      <h3>정석 — useShallow 로 감싼 같은 selector</h3>
      <NamesWithShallow />
      <MealControls />

      <p>
        <small>
          두 컴포넌트의 selector 는 <code>(state) =&gt; Object.keys(state)</code> 로 완전히 같다.
          차이는 <code>useShallow</code> 하나뿐이다. <b>papaBear → 피자</b> 를 눌러도 이름 목록(
          <code>Object.keys</code>) 은 변하지 않으므로 아래쪽 렌더 횟수는 그대로여야 한다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2. 내용은 같은데 참조만 새로운 값 / 여러 값을 한 번에 뽑기
// ─────────────────────────────────────────────────────────────────────

type ItemStore = {
  items: string[];
  page: number;
  add: (name: string) => void;
  /** 원소는 그대로 두고 배열만 새로 만든다 — 참조는 바뀌고 내용은 같다 */
  copyItems: () => void;
  nextPage: () => void;
};

const useItemStore = create<ItemStore>()((set) => ({
  items: ['사과', '바나나'],
  page: 1,
  add: (name) => set((state) => ({ items: [...state.items, name] })),
  copyItems: () => set((state) => ({ items: [...state.items] })),
  nextPage: () => set((state) => ({ page: state.page + 1 })),
}));

function ItemList() {
  // TODO ① — 지금은 items 를 그대로 뽑고 있다.
  //   "배열 복사" 를 누르면 원소는 그대로인데 참조가 바뀌어 리렌더가 일어난다.
  //   이 줄을 useShallow 로 감싸서, 내용이 같으면 리렌더되지 않게 만들어라.
  const items = useItemStore((state) => state.items);

  const renders = useRef(0);
  renders.current += 1;

  return (
    <p>
      items: <code>{items.join(', ')}</code> / 렌더 <strong>{renders.current}</strong>
    </p>
  );
}

function ItemSummary() {
  // TODO ② — 지금까지는 "selector 를 한 줄에 하나씩" 쓰라는 제약이 있었다.
  //   새 객체를 반환하면 무한 루프가 났기 때문이다. useShallow 가 그 제약을 푼다.
  //   아래 두 줄을 { count, first } 를 한 번에 반환하는 selector 한 줄로 합쳐라.
  const count = useItemStore((state) => state.items.length);
  const first = useItemStore((state) => state.items[0]);

  const renders = useRef(0);
  renders.current += 1;

  return (
    <p>
      개수 {count} / 첫 항목 <code>{first ?? '(없음)'}</code> / 렌더{' '}
      <strong>{renders.current}</strong>
    </p>
  );
}

function ItemControls() {
  const add = useItemStore((state) => state.add);
  const copyItems = useItemStore((state) => state.copyItems);
  const nextPage = useItemStore((state) => state.nextPage);
  const nextId = useRef(1);

  return (
    <p>
      <button
        onClick={() => {
          add(`과일${nextId.current}`);
          nextId.current += 1;
        }}
      >
        항목 추가
      </button>{' '}
      <button onClick={copyItems}>배열 복사 (내용 그대로)</button>{' '}
      <button onClick={nextPage}>page + 1 (무관한 필드)</button>
    </p>
  );
}

function ItemPanel() {
  return (
    <section>
      <h2>2. 파생값과 &quot;한 줄에 하나씩&quot; 제약</h2>
      <ItemList />
      <ItemSummary />
      <ItemControls />
      <p>
        <small>
          <b>배열 복사</b> 는 <code>[...state.items]</code> 로 원소가 똑같은 새 배열을 만든다.
          zustand 는 참조로만 판단하므로 &quot;바뀌었다&quot; 고 본다. 실제 화면에 보이는 값은
          하나도 안 변했는데도. <b>page + 1</b> 은 두 컴포넌트가 구독하지 않는 필드라 아무 일도
          없어야 한다.
        </small>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 3. v5 의 shallow 는 Map / Set 을 직접 안다
// ─────────────────────────────────────────────────────────────────────

type TagStore = {
  tags: Set<string>;
  addTag: (tag: string) => void;
  /** 원소는 그대로, Set 만 새로 만든다 */
  copyTags: () => void;
};

const useTagStore = create<TagStore>()((set) => ({
  tags: new Set(['react', 'zustand']),
  addTag: (tag) => set((state) => ({ tags: new Set(state.tags).add(tag) })),
  copyTags: () => set((state) => ({ tags: new Set(state.tags) })),
}));

function TagList() {
  // TODO ③ — Set 도 마찬가지다. "Set 복사" 를 누르면 내용은 같은데 리렌더가 난다.
  //   useShallow 로 감싸면 어떻게 되는지 확인해라.
  //   (07 에서 미뤄둔 숙제다 — v5 의 shallow 가 Map/Set 을 어떻게 다루는지는 아래 표에 있다)
  const tags = useTagStore((state) => state.tags);

  const renders = useRef(0);
  renders.current += 1;

  return (
    <p>
      tags: <code>{[...tags].join(', ')}</code> / 렌더 <strong>{renders.current}</strong>
    </p>
  );
}

function TagControls() {
  const addTag = useTagStore((state) => state.addTag);
  const copyTags = useTagStore((state) => state.copyTags);
  const nextId = useRef(1);

  return (
    <p>
      <button
        onClick={() => {
          addTag(`tag${nextId.current}`);
          nextId.current += 1;
        }}
      >
        태그 추가
      </button>{' '}
      <button onClick={copyTags}>Set 복사 (내용 그대로)</button>
    </p>
  );
}

// shallow 를 직접 불러 결과를 눈으로 확인한다. 주장은 실측으로 뒷받침한다.
const PROBES: { expr: string; result: boolean; why: string }[] = [
  {
    expr: 'shallow({ a: 1 }, { a: 1 })',
    result: shallow({ a: 1 }, { a: 1 }),
    why: '평범한 객체 — Object.entries 를 떠서 키/값을 하나씩 Object.is 로 비교',
  },
  {
    expr: "shallow(new Set(['a']), new Set(['a']))",
    result: shallow(new Set(['a']), new Set(['a'])),
    why: 'Set 은 entries 를 가지므로 compareEntries 로 간다',
  },
  {
    expr: "shallow(new Set(['a', 'b']), new Set(['b', 'a']))",
    result: shallow(new Set(['a', 'b']), new Set(['b', 'a'])),
    why: 'Set 의 entries 는 [값, 값] 쌍 → 값이 키가 되므로 순서는 상관없다',
  },
  {
    expr: "shallow(new Map([['a', 1]]), new Map([['a', 1]]))",
    result: shallow(new Map([['a', 1]]), new Map([['a', 1]])),
    why: 'Map 도 compareEntries. 키가 있고 값은 Object.is 로 비교',
  },
  {
    expr: 'shallow([1, 2], [2, 1])',
    result: shallow([1, 2], [2, 1]),
    why: '배열의 entries 는 [인덱스, 값] → 인덱스가 키라서 순서가 다르면 다르다',
  },
  {
    expr: 'shallow(new Set([{ x: 1 }]), new Set([{ x: 1 }]))',
    result: shallow(new Set([{ x: 1 }]), new Set([{ x: 1 }])),
    why: '"얕은" 비교라 원소끼리는 Object.is — 안쪽 객체는 들여다보지 않는다',
  },
  {
    expr: "shallow(new Set(['a']), ['a'])",
    result: shallow<unknown>(new Set(['a']), ['a']),
    why: '비교 전에 prototype 이 같은지부터 본다. 다르면 바로 false',
  },
];

function ShallowProbeTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>식</th>
          <th>결과</th>
          <th>이유</th>
        </tr>
      </thead>
      <tbody>
        {PROBES.map((probe) => (
          <tr key={probe.expr}>
            <td>
              <code>{probe.expr}</code>
            </td>
            <td>
              <strong>{String(probe.result)}</strong>
            </td>
            <td>
              <small>{probe.why}</small>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TagPanel() {
  return (
    <section>
      <h2>3. shallow 와 Map / Set</h2>
      <TagList />
      <TagControls />

      <h3>shallow 를 직접 호출해본 결과</h3>
      <ShallowProbeTable />
      <p>
        <small>
          위 결과는 실제로 <code>zustand/vanilla/shallow</code> 를 불러 계산한 값이다. 구현은{' '}
          <code>node_modules/zustand/esm/vanilla/shallow.mjs</code> 에 있고,{' '}
          <code>compareEntries</code> 와 <code>compareIterables</code> 두 갈래로 나뉜다.
        </small>
      </p>
    </section>
  );
}

export default function UseShallow() {
  return (
    <>
      <p>
        selector 안에서 계산을 하면 결과가 매번 새 객체 · 새 배열이 된다. 내용은 같아도 참조가
        다르니 <code>Object.is</code> 는 늘 &quot;바뀌었다&quot; 고 답한다. <code>useShallow</code>{' '}
        는 그 비교를 <b>얕은 비교</b>로 바꾸고, 얕게 같으면 <b>이전 참조를 그대로 재사용</b>해
        리렌더를 막는다.
      </p>

      <MealsPanel />
      <ItemPanel />
      <TagPanel />

      <Notes
        points={[
          <>
            <code>useShallow(selector)</code> 는 selector 를 감싼 <b>새 selector</b> 를 돌려준다.
            안에서 <code>useRef</code> 로 직전 결과를 들고 있다가, 새 결과가 얕게 같으면{' '}
            <b>이전 참조를 반환</b>한다. 그래서 zustand 쪽 <code>Object.is</code> 비교가 통과한다.
          </>,
          <>
            v5 에서 selector 가 매번 새 값을 만들면 &quot;불필요한 리렌더&quot; 정도가 아니라{' '}
            <b>무한 루프</b>다. <code>useSyncExternalStore</code> 가 렌더마다 스냅샷을 다시 읽어
            비교하기 때문이다. 콘솔 경고는 <code>The result of getSnapshot should be cached</code>.
          </>,
          <>
            그래서 01 부터 지켜온 &quot;selector 는 한 줄에 하나씩&quot; 제약이 있었다.{' '}
            <code>useShallow</code> 가 그 제약을 푼다 — 여러 값을 객체 하나로 묶어 뽑아도 된다.
          </>,
          <>
            얕은 비교는 <b>한 겹만</b> 본다. 값이 객체나 배열이면 그 안은 들여다보지 않고{' '}
            <code>Object.is</code> 로 끝낸다. 중첩 구조를 selector 로 새로 만들어 반환하면 여전히
            매번 다르다.
          </>,
          <>
            v5 의 <code>shallow</code> 는 <b>Map 과 Set 을 직접 지원</b>한다.{' '}
            <code>Symbol.iterator</code> 가 있으면 순회 비교로 가고, <code>entries</code> 까지
            있으면 <code>compareEntries</code> 로 키 기준 비교를 한다. 07 에서 &quot;Map/Set 은
            복사본을 만들어야 한다&quot; 고 했던 것의 반대편 이야기다.
          </>,
          <>
            <code>useShallow</code> 는 <b>리렌더를 줄이는 도구지 계산을 줄이는 도구가 아니다</b>.
            selector 자체는 여전히 매번 실행된다. 비싼 계산이면 selector 밖에서 메모이제이션을 따로
            해야 한다.
          </>,
        ]}
      />
    </>
  );
}
