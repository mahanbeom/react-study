import { Counter } from './Counter.tsx';
import { CounterWithContext } from './CounterWithContext.tsx';
import Notes from '../../ui/Notes.tsx';

// 공식문서 Testing and quality > Testing
//
// 이 꼭지의 결과물은 화면이 아니라 "돌아가는 테스트" 다. 이 페이지는 테스트가
// 무엇을 렌더하는지 눈으로 보기 위한 곁다리이고, 본체는 같은 폴더의 *.test.tsx 다.
//
//   pnpm test        한 번 실행
//   pnpm test:watch  지켜보기
//
// 문서 741 줄의 대부분은 Jest/Vitest 설정 안내이고, zustand 고유의 핵심은 딱 하나다:
// 스토어는 모듈 전역 변수라서 테스트끼리 상태가 샌다. __mocks__/zustand.ts 로
// create 를 가로채 테스트마다 전부 초기화한다 — 16 의 등록 패턴 그대로다.

export default function Testing() {
  return (
    <>
      <p>
        이 예제의 본체는 화면이 아니라 <code>src/examples/17-testing/*.test.tsx</code> 다. 아래 두
        컴포넌트가 테스트 대상이고, 같은 동작을 <b>전역 스토어</b>와 <b>Context 스토어</b> 두
        방식으로 만들어 두었다.
      </p>

      <section>
        <h2>테스트 대상</h2>
        <Counter />
        <CounterWithContext />
        <p>
          <small>
            화면에서는 둘이 똑같아 보인다. 차이는 <b>테스트에서만</b> 드러난다.
          </small>
        </p>
      </section>

      <section>
        <h2>돌려보기</h2>
        <pre>
          <code>pnpm test{'\n'}pnpm test:watch</code>
        </pre>
      </section>

      <Notes
        points={[
          <>
            문서는 741줄이지만 대부분 Jest/Vitest 설정 안내다. zustand 고유의 내용은 하나뿐 —{' '}
            <b>스토어가 모듈 전역 변수라서 테스트끼리 상태가 샌다.</b> 14 의 &quot;요청 간
            공유&quot; 와 같은 문제이고, 경계가 요청이 아니라 테스트일 뿐이다.
          </>,
          <>
            <code>__mocks__/zustand.ts</code> 가 <code>create</code> 를 가로채 스토어마다 리셋
            함수를 모으고 <code>afterEach</code> 에서 전부 되돌린다 — <b>16 의 등록 패턴 그대로</b>
            다. 16 에서는 로그아웃 버튼이, 여기서는 <code>afterEach</code> 가 부를 뿐이다.
          </>,
          <>
            Vitest 는 node_modules 를 <b>자동 모킹하지 않는다.</b> Jest 와 달리{' '}
            <code>vi.mock(&apos;zustand&apos;)</code> 를 setup 파일에 명시해야{' '}
            <code>__mocks__/zustand.ts</code> 가 쓰인다. 그리고 그 디렉터리는{' '}
            <b>node_modules 와 같은 높이</b>(프로젝트 루트)에 있어야 한다.
          </>,
          <>
            <b>Context 판은 mock 이 없어도 안 깨진다.</b> Provider 가 렌더될 때마다{' '}
            <code>useState(() =&gt; createCounterStore())</code> 로 스토어를 새로 만들기 때문이다 —
            15 에서 만든 격리가 그대로 테스트 격리가 된다. &quot;테스트하기 쉬운 구조&quot;가 공짜로
            따라오는 셈이고, 이것이 Context 배선의 값어치 중 하나다.
          </>,
          <>
            테스트에는 층이 있다. <code>counter-store.test.ts</code> 는 React 없이 스토어만
            확인하고(빠르고 안정적), <code>*.test.tsx</code> 는 RTL 로 실제 렌더와 클릭을 확인한다.
            로직은 아래층에서, 배선은 위층에서 잡는 것이 비용이 싸다.
          </>,
          <>
            <code>globals: true</code> 를 켜지 않았다. 켜면 <code>describe/test/expect</code> 를
            import 없이 쓸 수 있지만 <code>vitest/globals</code> 타입 선언이 따로 필요하다. 파일마다
            명시적으로 import 하는 편이 어디서 온 함수인지 드러나서 학습용으로 낫다.
          </>,
        ]}
      />
    </>
  );
}
