import { useState } from 'react';
import { create } from 'zustand';
import Notes from '../ui/Notes.tsx';

// 공식문서 Core concepts > Practice with no store actions
// 같은 카운터를 두 가지로 만든다.
//   A. 액션을 상태와 같은 객체에 담는다 (문서가 "recommended" 라고 부르는 기본형)
//   B. 상태에는 데이터만 두고, 액션은 모듈 레벨 함수로 뺀다
// 동작은 같다. 갈리는 건 "액션을 꺼내는 방법"과 "상태 객체에 뭐가 들어있느냐"다.

// ── A. 액션을 스토어 안에 (colocated) ───────────────────────────
type ColocatedStore = {
  count: number;
  inc: () => void;
  reset: () => void;
};

const useColocatedStore = create<ColocatedStore>()((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));

// ── B. 액션을 모듈 레벨로 (no store actions) ────────────────────
// create 에 넘기는 함수가 set 을 아예 안 받는다. 순수 데이터만 반환한다.
type CounterState = {
  count: number;
};

const useDataStore = create<CounterState>()(() => ({
  count: 0,
}));

// 훅이 아니라 그냥 함수다. 컴포넌트 밖 어디서든 import 해서 부를 수 있다.
// set 대신 스토어의 setState 를 쓴다 — 하는 일은 똑같다.
export const incCount = () => useDataStore.setState((state) => ({ count: state.count + 1 }));
export const resetCount = () => useDataStore.setState({ count: 0 });

// ── 1. 두 스타일을 나란히 ───────────────────────────────────────
function ColocatedPanel() {
  const count = useColocatedStore((state) => state.count);
  // 액션을 쓰려면 훅을 한 번 더 호출해서 꺼내와야 한다
  const inc = useColocatedStore((state) => state.inc);
  const reset = useColocatedStore((state) => state.reset);

  return (
    <div className="panel">
      <strong>A. 액션을 스토어 안에</strong>
      <p className="note">
        액션도 selector 로 꺼낸다 — <code>useStore((s) =&gt; s.inc)</code>
      </p>
      <p className="renders">count: {count}</p>
      <p>
        <button onClick={inc}>+1</button> <button onClick={reset}>reset</button>
      </p>
    </div>
  );
}

function DataOnlyPanel() {
  const count = useDataStore((state) => state.count);
  // 액션은 그냥 import 한 함수다. 훅 호출이 없다.

  return (
    <div className="panel">
      <strong>B. 액션을 모듈 레벨로</strong>
      <p className="note">
        액션은 import 해서 바로 쓴다 — 훅 호출 없음
      </p>
      <p className="renders">count: {count}</p>
      <p>
        <button onClick={incCount}>+1</button> <button onClick={resetCount}>reset</button>
      </p>
    </div>
  );
}

// ── 2. React 밖에서 부르기 ──────────────────────────────────────
function OutsideReact() {
  const [log, setLog] = useState<string[]>([]);

  const fireLater = () => {
    setLog((prev) => [...prev, '1초 뒤 실행 예약...']);
    // setTimeout 콜백은 컴포넌트가 아니다 → 훅을 쓸 수 없는 자리
    setTimeout(() => {
      incCount(); // B: 그냥 함수 호출
      useColocatedStore.getState().inc(); // A: getState 로 한 번 꺼내야 한다
      setLog((prev) => [...prev, '둘 다 +1 완료']);
    }, 1000);
  };

  return (
    <section>
      <h2>2. 컴포넌트 밖에서 액션 부르기</h2>
      <p>
        <button onClick={fireLater}>1초 뒤 양쪽 다 +1</button>{' '}
        <button onClick={() => setLog([])}>로그 지우기</button>
      </p>
      <ul>
        {log.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
      <p>
        <small>
          A 도 <code>getState().inc()</code> 로 부를 수 있으니 <b>불가능한 건 아니다.</b>{' '}
          차이는 능력이 아니라 손맛이다. B 는 <code>incCount()</code> 한 줄이고, 타이머 ·
          웹소켓 핸들러 · 라우터 가드처럼 컴포넌트가 아닌 자리에서 특히 티가 난다.
        </small>
      </p>
    </section>
  );
}

// ── 3. 심화: 상태 객체에 뭐가 들어있나 ──────────────────────────
type FragileStore = {
  count: number;
  inc: () => void;
};

// 3번 패널 전용 스토어. 여기서 일부러 망가뜨릴 거라 위 패널들과 분리했다.
const useFragileStore = create<FragileStore>()((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

function StoreShape() {
  const [snapshot, setSnapshot] = useState({
    fragile: Object.keys(useFragileStore.getState()),
    data: Object.keys(useDataStore.getState()),
  });
  const [message, setMessage] = useState('');

  const refresh = () =>
    setSnapshot({
      fragile: Object.keys(useFragileStore.getState()),
      data: Object.keys(useDataStore.getState()),
    });

  const callInc = () => {
    // TS 는 inc 가 항상 있다고 믿지만, replace 리셋 뒤에는 실제로 없다
    const action = useFragileStore.getState().inc as FragileStore['inc'] | undefined;
    if (!action) {
      setMessage('inc 가 스토어에서 사라졌다 — 호출하면 TypeError');
      return;
    }
    action();
    setMessage('inc 호출 성공');
  };

  const replaceReset = () => {
    // 두 번째 인자 replace=true 는 병합하지 않고 통째로 갈아끼운다.
    // 액션이 상태 안에 섞여 있으면 같이 날아간다. TS 가 막는 걸 캐스팅으로 뚫어야 재현된다.
    useFragileStore.setState({ count: 0 } as FragileStore, true);
    // 이쪽은 애초에 데이터뿐이라 캐스팅도 필요 없고 잃을 것도 없다
    useDataStore.setState({ count: 0 }, true);
    setMessage('replace 리셋 실행');
    refresh();
  };

  return (
    <section>
      <h2>3. 상태 객체 안에 무엇이 들어있나</h2>
      <p>
        A 형(액션 포함) 스토어의 키: <code>{snapshot.fragile.join(', ') || '(비어있음)'}</code>
        <br />
        B 형(데이터만) 스토어의 키: <code>{snapshot.data.join(', ') || '(비어있음)'}</code>
      </p>
      <p>
        <button onClick={callInc}>inc 호출해보기</button>{' '}
        <button onClick={replaceReset}>replace 모드로 리셋</button>{' '}
        <button onClick={refresh}>키 다시 읽기</button>
      </p>
      {message && <p>→ {message}</p>}
      <p>
        <small>
          <b>replace 모드로 리셋</b> 을 누르면 A 형의 키에서 <code>inc</code> 가 사라진다.
          이후 <b>inc 호출해보기</b> 는 실패한다. B 형은 잃을 게 없다. 상태를 순수 데이터로
          두면 리셋 · 직렬화 · persist 가 단순해진다는 게 이 스타일의 진짜 이득이다.
          (원상복구는 새로고침)
        </small>
      </p>
    </section>
  );
}

export default function NoStoreActions() {
  return (
    <>
      <p>
        문서는 액션을 상태와 함께 두는 쪽(A)을 기본으로 권하면서, 대안으로 액션을 모듈 레벨
        함수로 빼는 방식(B)을 소개한다. 이점은 두 가지 — <b>액션을 부르는 데 훅이 필요 없고</b>,{' '}
        <b>코드 분할에 유리하다</b>. 아래 세 패널로 그 차이를 직접 만져본다.
      </p>

      <section>
        <h2>1. 같은 카운터, 두 가지 스타일</h2>
        <div className="panels">
          <ColocatedPanel />
          <DataOnlyPanel />
        </div>
      </section>

      <OutsideReact />
      <StoreShape />

      <Notes
        points={[
          <>
            B 스타일의 스토어는 <code>create(() =&gt; ({'{'} ... {'}'}))</code> 처럼{' '}
            <code>set</code> 을 아예 받지 않는다. 갱신은 스토어 밖에서{' '}
            <code>useStore.setState(...)</code> 로 한다. <code>set</code> 과{' '}
            <code>setState</code> 는 같은 함수다.
          </>,
          <>
            A 는 액션을 쓰려면 <b>훅을 한 번 더 호출</b>해야 한다. B 의 액션은 그냥 함수라{' '}
            import 해서 어디서든 부른다 — 타이머, 이벤트 리스너, 다른 모듈, 테스트.
          </>,
          <>
            A 도 <code>useStore.getState().inc()</code> 로 컴포넌트 밖에서 부를 수 있다.{' '}
            <b>능력의 차이가 아니라 편의의 차이</b>다.
          </>,
          <>
            B 는 상태가 <b>순수 데이터</b>다. 그래서 <code>setState(next, true)</code> 리셋,
            직렬화, persist 가 단순하다. A 는 같은 객체에 함수가 섞여 있어 replace 리셋이 액션을
            지운다.
          </>,
          <>
            코드 분할 이점: 액션이 모듈 레벨이면 쓰는 쪽만 import 하므로 번들러가 안 쓰는 액션을
            떨어낼 수 있다. 액션이 스토어 객체 안에 있으면 스토어를 부르는 순간 전부 딸려온다.
          </>,
          <>
            문서는 &quot;이 패턴에 단점은 없다&quot;고 하면서도, 캡슐화 때문에 A 를 선호하는
            사람도 있다고 덧붙인다. 실제 차이는 <b>발견 가능성</b>이다 — A 는 스토어 하나만 보면
            뭘 할 수 있는지 다 보인다.
          </>,
        ]}
        questions={[
          {
            q: 'set 과 setState 는 다른 건가?',
            a: (
              <>
                같다. <code>create</code> 가 넘겨주는 <code>set</code> 이 곧 스토어의{' '}
                <code>setState</code> 다. A 는 클로저로 받은 이름(<code>set</code>)을 쓰고, B 는
                스토어에서 꺼내 쓴다(<code>useStore.setState</code>)는 차이뿐이다.
              </>
            ),
          },
          {
            q: '그럼 어느 쪽을 쓰나?',
            a: (
              <>
                기본은 A 로 시작해도 무방하다. B 가 유리해지는 신호는 이런 것들이다 — 액션을
                React 밖(타이머 · 소켓 · 라우터)에서 자주 부른다, 스토어가 커져서 액션을 파일로
                쪼개고 싶다, 상태를 통째로 리셋하거나 저장·복원할 일이 많다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
