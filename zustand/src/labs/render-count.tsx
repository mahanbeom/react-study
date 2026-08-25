import { useRef } from 'react';
import { create } from 'zustand';

// 실험: 무엇이 리렌더를 유발하는가?
// 렌더 횟수를 화면에 찍어서 selector와 리렌더의 관계를 눈으로 확인한다.

type CounterStore = {
  count: number;
  other: number;
  increment: (qty: number) => void;
  bumpOther: () => void;
};

const useCounterStore = create<CounterStore>()((set) => ({
  count: 0,
  other: 0,
  increment: (qty) => set((state) => ({ count: state.count + qty })),
  bumpOther: () => set((state) => ({ other: state.other + 1 })),
}));

/** 렌더될 때마다 1씩 증가. StrictMode(개발 모드)에서는 한 번의 렌더에 2씩 오른다 */
function useRenderCount() {
  const renders = useRef(0);
  renders.current += 1;
  return renders.current;
}

function Panel({ title, note, renders }: { title: string; note: string; renders: number }) {
  return (
    <div className="panel">
      <strong>{title}</strong>
      <p className="note">{note}</p>
      <p className="renders">렌더 횟수: {renders}</p>
    </div>
  );
}

/** A. count를 구독하고 화면에도 그린다 */
function SubscribeAndRender() {
  const count = useCounterStore((state) => state.count);
  const renders = useRenderCount();

  return (
    <div className="panel">
      <strong>A. 구독 + 화면 출력</strong>
      <p className="note">count를 selector로 뽑고 JSX에도 쓴다</p>
      <p className="renders">
        렌더 횟수: {renders} / count: {count}
      </p>
    </div>
  );
}

/** B. count를 구독하지만 화면에는 쓰지 않는다 ← 이번 질문의 핵심 */
function SubscribeOnly() {
  const count = useCounterStore((state) => state.count);
  void count; // 일부러 화면에 쓰지 않는다

  return (
    <Panel
      title="B. 구독만 (화면 출력 없음)"
      note="selector는 그대로, JSX에서만 뺐다"
      renders={useRenderCount()}
    />
  );
}

/** C. 액션만 구독한다 */
function ActionOnly() {
  const increment = useCounterStore((state) => state.increment);
  void increment;

  return (
    <Panel
      title="C. 액션만 구독"
      note="increment 함수는 참조가 절대 안 바뀐다"
      renders={useRenderCount()}
    />
  );
}

/** E. 같은 스토어의 다른 필드를 구독한다 */
function OtherField() {
  const other = useCounterStore((state) => state.other);
  const renders = useRenderCount();

  return (
    <div className="panel">
      <strong>E. 다른 필드(other) 구독</strong>
      <p className="note">같은 스토어지만 count가 아니라 other를 본다</p>
      <p className="renders">
        렌더 횟수: {renders} / other: {other}
      </p>
    </div>
  );
}

/** D. 스토어를 아예 안 쓴다 */
function NoSubscription() {
  return (
    <Panel title="D. 구독 없음" note="스토어와 무관한 컴포넌트" renders={useRenderCount()} />
  );
}

export default function RenderCountLab() {
  const increment = useCounterStore((state) => state.increment);
  const bumpOther = useCounterStore((state) => state.bumpOther);

  return (
    <>
      <p>
        아래 버튼을 누르고 각 패널의 렌더 횟수가 어떻게 변하는지 본다. 부모(이 컴포넌트)는
        액션만 구독하므로 리렌더되지 않는다 — 따라서 자식의 렌더는 전부 자기 구독 때문이다.
      </p>
      <p>
        <button onClick={() => increment(1)}>count +1</button>{' '}
        <button onClick={() => increment(0)}>count +0 (값 그대로)</button>{' '}
        <button onClick={bumpOther}>other +1 (다른 필드)</button>
      </p>
      <div className="panels">
        <SubscribeAndRender />
        <SubscribeOnly />
        <ActionOnly />
        <OtherField />
        <NoSubscription />
      </div>
    </>
  );
}
