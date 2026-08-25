import { useRef, useState } from 'react';
import { create } from 'zustand';
import Notes from '../ui/Notes.tsx';

// 공식문서 Core concepts > Updating state
// 1) 평평한 상태: set 이 "얕은 병합"이라 건드린 필드만 바꾸면 된다
// 2) 중첩된 상태: 얕은 병합은 최상위 1단계뿐이므로, 안쪽은 손으로 다 복사해야 한다
// 3) 직접 변경(mutation)하면 왜 화면이 안 바뀌는지를 눈으로 확인한다

// ── 1. Flat updates ────────────────────────────────────────────
type PersonState = {
  firstName: string;
  lastName: string;
};

type PersonActions = {
  updateFirstName: (firstName: PersonState['firstName']) => void;
  updateLastName: (lastName: PersonState['lastName']) => void;
};

const usePersonStore = create<PersonState & PersonActions>()((set) => ({
  firstName: '',
  lastName: '',
  // set 에 { firstName } 만 넘겨도 lastName 은 사라지지 않는다.
  // zustand 가 Object.assign({}, state, partial) 로 병합해주기 때문.
  updateFirstName: (firstName) => set(() => ({ firstName })),
  updateLastName: (lastName) => set(() => ({ lastName })),
}));

function FlatUpdates() {
  const firstName = usePersonStore((state) => state.firstName);
  const lastName = usePersonStore((state) => state.lastName);
  const updateFirstName = usePersonStore((state) => state.updateFirstName);
  const updateLastName = usePersonStore((state) => state.updateLastName);

  return (
    <section>
      <h2>1. 평평한 상태 — set 은 얕은 병합</h2>
      <p>
        <label>
          First name{' '}
          <input value={firstName} onChange={(e) => updateFirstName(e.currentTarget.value)} />
        </label>
      </p>
      <p>
        <label>
          Last name{' '}
          <input value={lastName} onChange={(e) => updateLastName(e.currentTarget.value)} />
        </label>
      </p>
      <p>
        Hello, <strong>{firstName || '(비어있음)'}</strong>{' '}
        <strong>{lastName || '(비어있음)'}</strong>!
      </p>
      <p>
        <small>
          한쪽만 입력해도 다른 쪽이 지워지지 않는다. set 이 넘긴 조각을 기존 state 에
          덮어쓰기 때문. 단, 병합은 <b>최상위 한 단계</b>에서만 일어난다.
        </small>
      </p>
    </section>
  );
}

// ── 2. Deeply nested object ────────────────────────────────────
type DeepState = {
  deep: {
    label: string; // 병합이 안쪽까지 가지 않는다는 걸 보여주는 이웃 필드
    nested: {
      obj: { count: number };
    };
  };
};

type DeepActions = {
  /** 정석: 각 단계를 전개 연산자로 복사하며 새 객체를 만든다 */
  normalInc: () => void;
  /** 안티패턴: 기존 객체를 직접 고치고 그대로 돌려준다 */
  mutateInc: () => void;
  reset: () => void;
};

const useDeepStore = create<DeepState & DeepActions>()((set) => ({
  deep: { label: '건드리면 안 되는 이웃 필드', nested: { obj: { count: 0 } } },

  normalInc: () =>
    set((state) => ({
      // deep 을 통째로 새로 만든다 → label 은 직접 복사해와야 살아남는다
      deep: {
        ...state.deep,
        nested: {
          ...state.deep.nested,
          obj: {
            ...state.deep.nested.obj,
            count: state.deep.nested.obj.count + 1,
          },
        },
      },
    })),

  mutateInc: () =>
    set((state) => {
      state.deep.label = 'sfwg';
      state.deep.nested.obj.count += 1; // 원본을 직접 수정
      console.log(state)
      return state; // 그리고 같은 참조를 반환
      // zustand 내부: Object.is(nextState, state) 가 true 라서
      // 아예 구독자에게 알리지 않고 조용히 끝난다.
    }),

  reset: () =>
    set({ deep: { label: '건드리면 안 되는 이웃 필드', nested: { obj: { count: 0 } } } }),
}));

// count 를 구독해서 "보여주기만" 하는 쪽.
// 조작 UI 와 형제로 떼어놨다. 같은 컴포넌트에 두면 getState 버튼의 로컬 state 변경만으로도
// 이쪽이 같이 리렌더되면서 selector 가 다시 읽혀, 안 바뀐 척이 들통나기 때문.
function DeepCount() {
  const count = useDeepStore((state) => state.deep.nested.obj.count);
  const label = useDeepStore((state) => state.deep.label);

  // 이 컴포넌트가 실제로 몇 번 렌더됐는지 센다 (StrictMode 라 2씩 오른다)
  const renders = useRef(0);
  renders.current += 1;

  return (
    <p>
      화면의 count: <strong>{count}</strong> / 렌더 횟수: {renders.current} / deep.label:{' '}
      <em>{label}</em>
    </p>
  );
}

function DeepControls() {
  const normalInc = useDeepStore((state) => state.normalInc);
  const mutateInc = useDeepStore((state) => state.mutateInc);
  const reset = useDeepStore((state) => state.reset);

  // 버튼을 눌러 "지금 스토어에 진짜 들어있는 값"을 직접 확인한다
  const [peeked, setPeeked] = useState<number | null>(null);

  const handleLog = () => {
    console.log(useDeepStore.getState().deep)
  }

  return (
    <>
      <p>
        <button onClick={normalInc}>정석 +1 (전개 복사)</button>{' '}
        <button onClick={mutateInc}>안티패턴 +1 (직접 변경)</button>{' '}
        <button onClick={() => setPeeked(useDeepStore.getState().deep.nested.obj.count)}>
          getState 로 실제 값 보기
        </button>{' '}
        <button onClick={handleLog}>
          getState 로 객체 값 보기
        </button>{' '}
        <button onClick={reset}>reset</button>
      </p>
      {peeked !== null && (
        <p>
          getState() 가 알려준 실제 count: <strong>{peeked}</strong>
        </p>
      )}
    </>
  );
}

function DeepUpdates() {
  return (
    <section>
      <h2>2. 중첩된 상태 — 안쪽은 손으로 다 복사해야 한다</h2>
      <DeepCount />
      <DeepControls />
      <p>
        <small>
          실험: <b>안티패턴 +1</b> 을 세 번 누른다 → 화면은 0 그대로다. 이때{' '}
          <b>getState 로 실제 값 보기</b> 를 누르면 값은 이미 3 이다. 이어서 <b>정석 +1</b> 을
          한 번 누르면 화면이 0 에서 4 로 튄다. 상태는 계속 바뀌고 있었는데 아무도 통보받지
          못했던 것이다.
        </small>
      </p>
    </section>
  );
}

export default function UpdatingState() {
  return (
    <>
      <p>
        상태 갱신 규칙은 하나다: <b>새 객체를 만들어 돌려준다.</b> 평평한 상태에서는
        zustand 의 얕은 병합 덕에 바꿀 필드만 적으면 되지만, 중첩 구조에서는 경로 위의
        모든 단계를 새로 만들어야 한다. 문서는 이 장황함을 줄이는 대안으로 Immer /
        optics-ts / Ramda 를 소개하는데, Immer 는 Reference 의 immer 미들웨어에서 다시 다룬다.
      </p>
      <FlatUpdates />
      <DeepUpdates />

      <Notes
        points={[
          <>
            <code>set</code> 의 병합은 <code>{'Object.assign({}, state, partial)'}</code> —{' '}
            <b>최상위 한 단계</b>뿐이다. 그래서 평평한 상태는 바꿀 필드만 적으면 되고, 중첩
            상태는 경로 위의 모든 객체를 새로 만들어야 한다.
          </>,
          <>
            불변 갱신을 하는 진짜 이유는 &quot;필드를 지키려고&quot;가 아니다.{' '}
            <b>새 참조가 변경 알림의 유일한 방아쇠</b>이기 때문이다.
          </>,
          <>
            원본을 직접 고치고 같은 참조를 반환하면 <code>setState</code> 첫 줄의{' '}
            <code>Object.is(nextState, state)</code> 에 걸려 <b>구독자 통보 자체가 생략</b>된다.
            selector 는 실행조차 되지 않는다.
          </>,
          <>
            관문이 둘이다. (1) <code>setState</code> 의 참조 비교 → 알릴지 말지, (2) selector
            반환값의 비교 → 리렌더할지 말지. 이번 함정은 <b>(1)</b> 에서 막힌 경우다.
          </>,
          <>
            장황함을 줄이는 대안으로 문서는 Immer / optics-ts / Ramda 를 제시한다. Immer 는
            Reference 의 immer 미들웨어에서 다시 다룬다.
          </>,
        ]}
        questions={[
          {
            q: '복잡한 객체에서 원하는 필드만 바꾸기 어려운 구조를 확인한 건가?',
            a: (
              <>
                절반만 맞다. <b>어려운</b> 게 아니라 <b>장황한</b> 것이다. 규칙은 한 줄이다 —
                바꿀 값까지 가는 경로 위의 객체를 전부 새로 만든다. 그리고 이 예제가 확인한 건
                두 가지다. 병합 깊이가 1단계라는 것, 그리고 새 참조가 알림의 방아쇠라는 것.
                후자가 더 중요하다.
              </>
            ),
          },
          {
            q: '이 DeepState 에 Slices pattern 을 적용하면 어떻게 나뉘나?',
            a: (
              <>
                <b>안 나뉜다.</b> Slices 는 <code>create</code> 에 넘기는 함수를 여러 개로 쪼개
                spread 로 합치는 것일 뿐, 상태 트리를 쪼개지 않는다. 결과물은 여전히 스토어
                하나다. 즉 Slices 는 <b>넓이</b>(최상위 키가 너무 많음)를 다루는 도구고,
                DeepState 의 문제는 <b>깊이</b>다. 축이 다르다.
              </>
            ),
          },
          {
            q: '평탄화 후 도메인별 slice 가 실무에서 많이 쓰이나?',
            a: (
              <>
                도메인별 slice 는 맞지만 <b>기본값은 아니다</b>. 공식 문서(Flux inspired
                practice)는 &quot;전역 상태는 단일 스토어에, 애플리케이션이 <b>크다면</b> slice
                로 분할&quot;이라고 한다. 실무에서 가장 흔한 건 slice 없는 스토어 하나다 —
                서버 상태가 TanStack Query 로 빠지면 zustand 에 남는 건 모달 · 토스트 · 테마 ·
                필터 정도라 작기 때문. 또 <b>1단 중첩은 비용이 0</b> 이므로 응집된 것은 묶어둔다
                (<code>coupon: {'{'} code, rate {'}'}</code>). 문제는 3단부터다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
