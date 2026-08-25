import { useState } from 'react';
import Notes from '../../ui/Notes.tsx';
import { useBoundStore } from './store.ts';

// 공식문서 Core concepts > Slices Pattern
// 스토어가 커질 때 "코드"를 여러 파일로 쪼개는 방법.
// 파일은 4개로 나뉘지만 스토어는 여전히 하나, 상태 객체도 평평한 하나다.
//   bearSlice.ts   — bears, addBear, eatFish
//   fishSlice.ts   — fishes, addFish
//   sharedSlice.ts — addBoth, getBoth (상태 없이 액션만)
//   store.ts       — 셋을 spread 로 합친다

function Counters() {
  const bears = useBoundStore((state) => state.bears);
  const fishes = useBoundStore((state) => state.fishes);
  const addBear = useBoundStore((state) => state.addBear);
  const addFish = useBoundStore((state) => state.addFish);

  return (
    <div className="panels">
      <div className="panel">
        <strong>bearSlice.ts</strong>
        <p className="note">bears, addBear, eatFish</p>
        <p className="renders">bears: {bears}</p>
        <p>
          <button onClick={addBear}>곰 +1</button>
        </p>
      </div>
      <div className="panel">
        <strong>fishSlice.ts</strong>
        <p className="note">fishes, addFish</p>
        <p className="renders">fishes: {fishes}</p>
        <p>
          <button onClick={addFish}>물고기 +1</button>
        </p>
      </div>
    </div>
  );
}

function CrossSlice() {
  const eatFish = useBoundStore((state) => state.eatFish);
  const addBoth = useBoundStore((state) => state.addBoth);
  const getBoth = useBoundStore((state) => state.getBoth);
  const resetBoth = useBoundStore((state) => state.resetBoth);
  const [total, setTotal] = useState<number | null>(null);

  return (
    <section>
      <h2>2. slice 경계를 넘는 액션</h2>
      <p>
        <button onClick={eatFish}>곰이 물고기를 먹는다 (bearSlice 가 fishes 를 줄임)</button>
      </p>
      <p>
        <button onClick={addBoth}>둘 다 +1 (sharedSlice 가 남의 액션 재사용)</button>{' '}
        <button onClick={() => setTotal(getBoth())}>합계 계산 (getBoth)</button>{' '}
        <button onClick={resetBoth}>둘 다 리셋 (한 번의 set 으로)</button>
      </p>
      {total !== null && (
        <p>
          getBoth() = <strong>{total}</strong>
        </p>
      )}
      <p>
        <small>
          <code>eatFish</code> 는 bearSlice 에 있지만 fishSlice 의 <code>fishes</code> 를
          건드린다. <code>StateCreator</code> 의 첫 번째 타입 인자가 <b>합쳐진 전체 스토어</b>라
          타입 검사도 통과한다. slice 는 담장이 아니라 서랍이다.
        </small>
      </p>
    </section>
  );
}

function StoreShape() {
  const [keys, setKeys] = useState<string[]>(() => Object.keys(useBoundStore.getState()));

  return (
    <section>
      <h2>3. 합쳐진 결과는 평평한 스토어 하나</h2>
      <p>
        <code>Object.keys(useBoundStore.getState())</code>
      </p>
      <p>
        → <code>{keys.join(', ')}</code>
      </p>
      <p>
        <button onClick={() => setKeys(Object.keys(useBoundStore.getState()))}>다시 읽기</button>
      </p>
      <p>
        <small>
          <code>bears</code> 가 <code>bearSlice.bears</code> 로 중첩되지 않는다. spread 로
          합쳤으니 최상위에 나란히 놓인다. 즉 slice 는 <b>상태 트리를 쪼개지 않는다</b> — 쓰는
          쪽에서는 slice 가 몇 개인지 알 필요도 없다.
        </small>
      </p>
    </section>
  );
}

export default function SlicesPattern() {
  return (
    <>
      <p>
        기능이 늘면 스토어 파일이 감당 안 되게 커진다. slices 는 <code>create</code> 에 넘기는{' '}
        <b>함수 하나를 여러 개로 쪼개</b> spread 로 합치는 패턴이다. 이 예제는 파일 4개로
        나뉘어 있다 — 왼쪽 목록에서 이 항목을 고르면 그 4개가 합쳐진 스토어 하나가 뜬다.
      </p>

      <section>
        <h2>1. 파일은 나뉘어도 스토어는 하나</h2>
        <Counters />
      </section>

      <CrossSlice />
      <StoreShape />

      <Notes
        points={[
          <>
            <code>(...a)</code> 는 zustand 가 주는 <code>(set, get, api)</code> 세 개를 각
            slice 에 그대로 흘려보내는 관용구다.{' '}
            <code>(set, get, api) =&gt; ({'{'} ...createBearSlice(set, get, api) {'}'})</code> 와
            같은 뜻인데, 인자가 바뀌어도 손댈 곳이 없어 이렇게 쓴다.
          </>,
          <>
            <code>StateCreator&lt;T, Mis, Mos, U&gt;</code> 의 인자 네 개는 순서대로{' '}
            <b>전체 스토어 타입</b> / 이미 적용된 미들웨어 / 새로 적용할 미들웨어 /{' '}
            <b>이 함수가 반환하는 조각</b>이다. 미들웨어가 없으면 가운데 둘은 <code>[]</code>{' '}
            <code>[]</code>로 비워둔다.
          </>,
          <>
            1번과 4번이 다른 게 핵심이다. <b>보는 범위는 전체, 책임지는 범위는 자기 조각.</b>{' '}
            그래서 bearSlice 의 <code>eatFish</code> 가 fishSlice 의 <code>fishes</code> 를
            건드릴 수 있다.
          </>,
          <>
            slice 안에서 <code>get()</code> 을 부르면 합쳐진 전체 스토어가 나온다. 다른 slice 의
            액션을 재사용할 수 있고, <code>getBoth</code> 처럼 상태를 저장하지 않는 파생 값도
            만들 수 있다.
          </>,
          <>
            합친 결과는 <b>평평한 스토어 하나</b>다 — <code>bears</code> 지{' '}
            <code>bearSlice.bears</code> 가 아니다. slice 는 상태 트리가 아니라{' '}
            <b>코드를 나누는 단위</b>다.
          </>,
          <>
            미들웨어는 <b>합친 쪽에만</b> 적용한다. 개별 slice 안에 넣으면 예기치 않은 문제가
            생긴다고 문서가 명시한다. 미들웨어를 쓰면 2번 타입 인자를 그 mutator 로 채워야 한다
            (예: <code>[[&quot;zustand/devtools&quot;, never]]</code>).
          </>,
        ]}
        questions={[
          {
            q: 'StateCreator<T, [], [], U> 에서 가운데 [] 두 개는 뭔가?',
            a: (
              <>
                미들웨어 목록이다. 2번은 <b>내가 받는</b> set/get 이 이미 어떤 미들웨어로
                변형됐는지(Mutators <b>In</b>), 3번은 <b>내가 적용하는</b> 미들웨어가
                무엇인지(Mutators <b>Out</b>)를 나타낸다. slice 는 미들웨어가 아니라 그냥
                조각이라 둘 다 비어 있다. 그리고 TypeScript 는 타입 인자를 건너뛸 수 없어서,
                4번 자리에 도달하려면 2 · 3 번을 <code>[]</code> 로 채워야 한다 — 의미가 있어
                쓰는 게 아니라 <b>자리 채우기</b>다. 미들웨어를 쓰면 3번이 아니라 <b>2번</b> 이
                바뀐다 (예: <code>[[&apos;zustand/devtools&apos;, never]]</code>).
              </>
            ),
          },
          {
            q: 'fishSlice 는 BearSlice 를 안 쓰는데 왜 T 에 BearSlice & FishSlice 를 넣나?',
            a: (
              <>
                지금 코드만 보면 <b>필요 없다</b>. <code>StateCreator&lt;FishSlice, [], [],
                FishSlice&gt;</code> 로 좁혀도 컴파일과 합성이 모두 통과한다(함수 인자의
                반공변성 덕분). 필요해지는 건 <b>남의 slice 를 건드리는 순간</b>이다 — T 를
                좁힌 채 <code>get().bears</code> 나 <code>set({'{'} bears {'}'})</code> 를 쓰면
                TS2339 로 막힌다. 게다가 T 를 좁히면 구멍이 하나 생긴다. 좁은 T 에서는{' '}
                <code>set(전체교체객체, true)</code> 가 통과해버려서, 런타임에 다른 slice 의
                상태가 통째로 날아간다. T 를 전체로 두면 &quot;완전한 T&quot; 요구 때문에 TS 가
                이걸 차단한다. 즉 T 는 <b>이 slice 가 실제로 들어가 살 집 전체</b>를 정직하게
                적는 자리다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
