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
            <br />
            <br />그 대가가 하나 있었다 — <b>RTL 이 자동 cleanup 을 걸지 못한다.</b> RTL 은 전역{' '}
            <code>afterEach</code> 가 있을 때만 스스로 등록하기 때문에, 처음에는 render 결과가
            테스트마다 쌓여 <code>found multiple elements</code> 가 났다.{' '}
            <code>setup-vitest.ts</code> 에서 <code>afterEach(cleanup)</code> 을 직접 걸어 해결했다.
          </>,
        ]}
        questions={[
          {
            q: 'test.todo 는 무슨 뜻인가?',
            a: (
              <>
                <b>&quot;이 테스트를 쓸 예정&quot;이라는 표시</b>다. 콜백을 아예 받지 않으므로
                실행되는 코드가 없고, 리포트에 <code>2 todo</code> 로 계속 떠서 잊지 않게 한다.
                주석으로 적는 대신 테스트 결과에 남기는 셈이다.
                <br />
                <br />
                <code>test(&apos;...&apos;, fn)</code> 은 콜백이 있고 실행된다.{' '}
                <code>test.skip(&apos;...&apos;, fn)</code> 은 콜백이 있지만 건너뛴다(깨진 테스트를
                임시로 막을 때). <code>test.todo(&apos;...&apos;)</code> 는 콜백 자체가 없다 — 아직
                안 쓴 것이다.
              </>
            ),
          },
          {
            q: 'describe 본문에 단언을 써도 되나?',
            a: (
              <>
                <b>안 된다.</b> <code>describe</code> 의 본문은 &quot;어떤 테스트들이 있나&quot; 를
                훑는 <b>수집 단계</b>에 파일당 한 번 실행된다. 테스트가 도는 시점이 아니다.
                <br />
                <br />
                거기에 쓴 코드는 <b>실행은 되지만 어떤 테스트에도 속하지 않는다.</b> 통과해도{' '}
                <code>✓</code> 가 안 찍히고, 실패하면 파일 전체 수집이 무너져 리포트가{' '}
                <code>Tests no tests</code> 로 나온다(실측). 안에 멀쩡한 테스트가 있어도 함께
                사라지고, 무엇이 실패했는지도 알려주지 못한다.
                <br />
                <br />
                단언은 반드시 <code>test()</code> 콜백 안에 둔다. 여러 테스트가 공유할 준비 코드가
                필요하면 <code>beforeEach</code> 를 쓴다 — 그건 테스트마다 다시 돈다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
