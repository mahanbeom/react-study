import { create } from 'zustand';
import Notes from '../ui/Notes.tsx';

// 공식문서 Getting Started > Introduction 의 곰 카운터 예제
type BearStore = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

const useBearStore = create<BearStore>()((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

useBearStore.subscribe((state, prev) => {
  console.log(`bears: ${prev.bears} -> ${state.bears}`)
})

export default function Introduction() {
  const bears = useBearStore((state) => state.bears);
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  const removeAllBears = useBearStore((state) => state.removeAllBears);

  return (
    <>
      <p>{bears} bears around here...</p>
      <button onClick={increasePopulation}>one up</button>{' '}
      <button onClick={removeAllBears}>remove all</button>

      <Notes
        points={[
          <>
            <code>create()(fn)</code> 가 만든 스토어는 모듈 레벨 값이다. Provider 도, 컴포넌트
            트리 안 어느 위치에 두는지도 상관없다.
          </>,
          <>
            훅을 selector 와 함께 호출하는 행위 자체가 구독이다 —{' '}
            <code>useBearStore((s) =&gt; s.bears)</code>.
          </>,
          <>
            <code>set</code> 은 넘긴 조각을 기존 상태에 <b>얕게 병합</b>한다. 안 넘긴 필드는
            그대로 남는다.
          </>,
          <>
            액션도 상태와 같은 객체에 담는다. 액션 함수의 참조는 재생성되지 않으므로, 액션만
            구독하는 컴포넌트는 리렌더되지 않는다.
          </>,
          <>
            컴포넌트 밖에서도 <code>useBearStore.getState()</code> 와{' '}
            <code>.subscribe()</code> 로 스토어에 접근할 수 있다.
          </>,
          <>
            함정: selector 가 매번 <b>새 객체</b>를 반환하면 v5 에서 &quot;getSnapshot should be
            cached&quot; 무한 루프가 난다. 해법인 <code>useShallow</code> 는 Performance 섹션에서
            다룬다. 그전까지는 selector 를 한 줄에 하나씩 쓴다.
          </>,
        ]}
        questions={[
          {
            q: 'selector 로 값을 뽑기만 하고 화면에 안 쓰면 리렌더될까?',
            a: (
              <>
                된다. 실험 <b>&quot;무엇이 리렌더를 유발하는가&quot;</b> 의 B 패널이 그 증거다.
                구독을 만드는 건 <b>훅 호출</b>이지 JSX 사용 여부가 아니다. React 입장에서 값을
                어디에 쓰는지는 알 방법이 없다.
              </>
            ),
          },
          {
            q: '그러면 리렌더 여부는 무엇이 결정하나?',
            a: (
              <>
                selector <b>반환값</b>의 <code>Object.is</code> 비교다. 실험의{' '}
                <code>count +0</code> 버튼을 누르면 set 은 호출되지만 반환값이 같아 리렌더되지
                않는다. 같은 스토어라도 다른 필드(E 패널)를 구독하면 반응하지 않는 것도 같은
                이유다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
