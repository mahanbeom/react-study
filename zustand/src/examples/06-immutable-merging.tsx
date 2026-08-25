import { create } from 'zustand';
import Notes from '../ui/Notes.tsx';

// 공식문서 Core concepts > Immutable state and merging
// 03(Updating state)과 겹치는 부분이 많다. 여기서 새로 얻는 건 두 가지다.
//   ① set 에 ...state 를 붙이든 말든 결과가 같다 (병합이 대신 해준다)
//   ② replace 플래그로 그 병합을 끌 수 있다
// 그런데 ①과 ②를 겹치면 함정이 생긴다. 그걸 2x2 로 만져본다.

// 액션을 모듈 레벨로 뺐다(04 에서 배운 방식). 상태가 순수 데이터라
// replace 를 눌러도 액션이 날아가지 않고, JSON.stringify 로 전부 들여다볼 수 있다.
type ShapeState = {
  count: number;
  label: string; // 병합 여부를 확인하는 이웃 필드
};

const INITIAL: ShapeState = { count: 0, label: 'sibling' };

const useShapeStore = create<ShapeState>()(() => INITIAL);

// ── 2x2: 병합/교체 × ...state 유무 ──────────────────────────────
/** 병합 + spread 없음 — 가장 흔한 코드 */
const mergeBare = () => useShapeStore.setState((state) => ({ count: state.count + 1 }));

/** 병합 + spread 있음 — 위와 결과가 완전히 같다. ...state 가 하는 일이 없다 */
const mergeSpread = () => useShapeStore.setState((state) => ({ ...state, count: state.count + 1 }));

/** 교체 + spread 없음 — label 이 사라진다. TS 가 막는 걸 캐스팅으로 뚫어야 재현된다 */
const replaceBare = () =>
  useShapeStore.setState((state) => ({ count: state.count + 1 }) as ShapeState, true);

/** 교체 + spread 있음 — 안전하다. replace 를 쓸 때는 ...state 가 필수가 된다 */
const replaceSpread = () =>
  useShapeStore.setState((state) => ({ ...state, count: state.count + 1 }), true);

const reset = () => useShapeStore.setState(INITIAL, true);

function Matrix() {
  // selector 없이 부르면 상태 객체 전체를 구독한다
  const state = useShapeStore();

  return (
    <section>
      <h2>병합 / 교체 × spread 유무</h2>
      <p>
        지금 상태: <code>{JSON.stringify(state)}</code>
      </p>
      <p>
        키 목록: <code>{Object.keys(state).join(', ')}</code>
      </p>

      <div className="panels">
        <div className="panel">
          <strong>병합 (기본)</strong>
          <p className="note">
            <code>setState(fn)</code>
          </p>
          <p>
            <button onClick={mergeBare}>spread 없이 +1</button>
          </p>
          <p>
            <button onClick={mergeSpread}>...state 붙여서 +1</button>
          </p>
          <p className="note">둘 다 label 이 남는다. ...state 는 있으나 마나다.</p>
        </div>

        <div className="panel">
          <strong>교체 (replace: true)</strong>
          <p className="note">
            <code>setState(fn, true)</code>
          </p>
          <p>
            <button onClick={replaceBare}>spread 없이 +1</button>
          </p>
          <p>
            <button onClick={replaceSpread}>...state 붙여서 +1</button>
          </p>
          <p className="note">
            위는 label 이 사라지고, 아래는 살아남는다. 단, 위를 먼저 눌러 label 을 날린 뒤에는
            아래를 눌러도 <b>돌아오지 않는다</b> — reset 후 하나씩 눌러볼 것.
          </p>
        </div>
      </div>

      <p>
        <button onClick={reset}>reset</button>
      </p>
      <p>
        <small>
          reset 후 하나씩 눌러보면 규칙이 드러난다. <b>병합에서는 ...state 가 무의미하고,
          교체에서는 필수다.</b> 03 에서 중첩 객체에 전개 연산자를 썼던 것과 같은 이유가
          최상위에서 되풀이되는 것뿐이다 — 병합이 안 해주는 층은 손으로 복사해야 한다.
          그리고 <code>...state</code> 는 <b>지금 있는 것을 지킬 뿐, 이미 사라진 것을 되살리지
          못한다.</b> 교체로 한 번 날아간 필드는 초기값을 다시 넣어줘야 돌아온다.
        </small>
      </p>
    </section>
  );
}

export default function ImmutableMerging() {
  return (
    <>
      <p>
        문서는 &quot;<code>set</code> 은 원래 <code>{'{ ...state, count }'}</code> 처럼 써야
        하지만, 흔한 패턴이라 zustand 가 대신 병합해주므로 <code>...state</code> 를 생략할 수
        있다&quot;고 설명한다. 그리고 그 병합을 끄는 스위치로 <code>replace</code> 를 소개한다.
        둘을 조합하면 규칙이 하나로 정리된다.
      </p>

      <Matrix />

      <Notes
        points={[
          <>
            <code>set((s) =&gt; ({'{'} ...s, count {'}'}))</code> 와{' '}
            <code>set((s) =&gt; ({'{'} count {'}'}))</code> 는 결과가 <b>같다</b>. zustand 가{' '}
            <code>Object.assign({'{}'}, state, partial)</code> 로 대신 병합해주기 때문이다.
            그래서 보통 <code>...state</code> 를 생략한다.
          </>,
          <>
            <code>replace: true</code> 는 그 병합을 끈다. 이때는 <b><code>...state</code> 가
            필수</b>가 된다 — 안 붙이면 넘기지 않은 필드가 그대로 사라진다.
          </>,
          <>
            규칙은 하나다: <b>병합이 닿지 않는 층은 손으로 복사한다.</b> 중첩 객체의 안쪽(03)도,
            replace 를 켠 최상위(여기)도 같은 이유다.
          </>,
          <>
            TypeScript 가 1차 방어선이다. <code>replace: true</code> 는 완전한 상태를 요구하므로{' '}
            <code>{'{ count }'}</code> 만 넘기면 컴파일 에러다. 이 예제는 캐스팅으로 뚫어서
            재현했다.
          </>,
          <>
            이 예제의 스토어는 액션을 모듈 레벨로 뺐다(04). 덕분에 상태가 순수 데이터라{' '}
            <code>JSON.stringify</code> 로 전부 보이고, replace 를 눌러도 액션이 날아가지 않는다.
            05 에서 <code>JSON.stringify</code> 가 함수를 통째로 빼먹던 것과 대비된다.
          </>,
        ]}
      />
    </>
  );
}
