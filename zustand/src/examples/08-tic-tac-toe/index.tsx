import { useRef } from 'react';
import { create } from 'zustand';
import Notes from '../../ui/Notes.tsx';

// 공식문서 Tutorial: Tic-Tac-Toe
// 요구사항은 같은 폴더의 REQUIREMENTS.md 참고.

type Square = 'X' | 'O' | null;

// 이길 수 있는 8줄 — 가로 3, 세로 3, 대각선 2
const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const EMPTY_BOARD: Square[] = Array(9).fill(null);
// 타입을 명시한다. 안 붙이면 null[][] 로 좁게 추론된다 (07 의 Set<never> 와 같은 함정)
const INITIAL_HISTORY: Square[][] = [EMPTY_BOARD];

/**
 * 이긴 줄의 인덱스 3개를 돌려준다. 없으면 null.
 * 승자 판정과 승리 칸 강조가 같은 정보를 필요로 하므로 여기 한 곳에서 뽑는다.
 */
function calculateWinningLine(board: Square[]): number[] | null {
  // board[a] && 로 빈 칸을 먼저 거른다. 빼먹으면 null 세 개가 "모두 같다"로 걸린다
  return (
    WINNING_LINES.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]) ??
    null
  );
}

/**
 * 승자만 판단한다. 무승부는 여기서 다루지 않는다 —
 * "승자"와 "화면 문구"는 다른 관심사라 섞으면 호출하는 쪽이 'Draw' 를 승자로 오해한다.
 */
function calculateWinner(board: Square[]): Square {
  const line = calculateWinningLine(board);
  return line ? board[line[0]] : null;
}

/** 화면에 띄울 문구. 승자 검사가 먼저다 — 마지막 수로 이기면 빈 칸도 0이기 때문 */
function calculateStatus(board: Square[], turn: number): string {
  const winner = calculateWinner(board);
  if (winner) return `Winner ${winner}`;
  if (board.every(Boolean)) return 'Draw';
  return `Next player: ${turn % 2 === 0 ? 'X' : 'O'}`;
}

type GameStore = {
  /** 각 시점의 보드 스냅샷. history[n] = n수째의 보드 */
  history: Square[][];
  /** 지금 보고 있는 시점 */
  currentTurn: number;
  play: (index: number) => void;
  jumpTo: (turn: number) => void;
};

const useGameStore = create<GameStore>()((set, get) => ({
  history: INITIAL_HISTORY,
  currentTurn: 0,

  play: (index) => {
    const { history, currentTurn } = get();
    const board = history[currentTurn];

    // 채워진 칸이거나 이미 승부가 났으면 set 을 아예 부르지 않는다.
    // set 안에서 걸러 같은 값을 반환해도 동작은 같지만, 그러면 구독자에게
    // 헛알림이 한 번 나간다.
    if (board[index] || calculateWinner(board)) return;

    const nextBoard = board.slice(); // ① 보드 복사
    nextBoard[index] = currentTurn % 2 === 0 ? 'X' : 'O'; // ② 복사본이니 직접 대입 OK

    // ③ history 복사 + 새 보드 추가.
    // slice(0, currentTurn + 1) 이 "되돌아간 뒤 새로 두면 미래를 버린다"를 담당한다.
    // concat 은 인자가 배열이면 한 겹 펼치므로 [nextBoard] 로 감싸야 한다.
    const nextHistory = history.slice(0, currentTurn + 1).concat([nextBoard]);

    set({ history: nextHistory, currentTurn: nextHistory.length - 1 });
  },

  // 되돌리기에는 새 상태가 필요 없다. 보고 있는 시점만 바꾸면 된다.
  jumpTo: (turn) => set({ currentTurn: turn }),
}));

// ─────────────────────────────────────────────────────────────────────
// 선택 과제: 칸 9개가 각자 자기 칸만 구독하게 만들기
//
// 구독을 잘게 나누는 것만으로는 부족하다. 부모가 리렌더되면 자식은 props 가 같아도
// 따라 리렌더되기 때문이다(React.memo 가 없는 한). 그래서 트리를 이렇게 짰다.
//
//   TicTacToe   구독 없음  ← 여기가 리렌더되면 아래 전부가 따라 리렌더된다
//     Status    문구만
//     Board     구독 없음
//       Square  ×9  자기 칸만
//     MoveList  기록 목록만
//
// 03 · 07 에서 "조작부와 표시부를 형제로 두라" 고 했던 것의 확장판이다.
// ─────────────────────────────────────────────────────────────────────

/** 렌더될 때마다 1씩. StrictMode(개발 모드)에서는 한 번의 렌더에 2씩 오른다 */
function useRenderCount() {
  const renders = useRef(0);
  renders.current += 1;
  return renders.current;
}

const SQUARE_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function Square({ index }: { index: number }) {
  // TODO — 지금은 보드 배열 전체를 구독한다. 그래서 어느 칸을 눌러도 9칸이 전부 리렌더된다.
  //   이 칸의 값 하나만 뽑도록 고쳐라. 아래 isWinning 이 참고할 만한 예다.
  const board = useGameStore((state) => state.history[state.currentTurn]);
  const value = board[index];

  // 파생 boolean 을 뽑는 selector. 결과가 boolean 이라 Object.is 로 충분하다 —
  // 승부가 나는 순간 이 3칸만 false → true 로 바뀌고, 나머지 6칸은 리렌더되지 않는다.
  const isWinning = useGameStore((state) => {
    const line = calculateWinningLine(state.history[state.currentTurn]);
    return line?.includes(index) ?? false;
  });

  const play = useGameStore((state) => state.play);
  const renders = useRenderCount();

  return (
    <button
      className={`relative aspect-square text-4xl hover:bg-white/10 ${
        isWinning ? 'bg-emerald-500/25' : ''
      }`}
      onClick={() => play(index)}
    >
      {value}
      <span className="absolute right-1 bottom-1 text-xs font-normal opacity-50">{renders}</span>
    </button>
  );
}

function Board() {
  // 아무것도 구독하지 않는다. 칸을 배치하기만 한다.
  const renders = useRenderCount();

  return (
    <div>
      <div className="grid w-100 grid-cols-3 gap-2">
        {SQUARE_INDEXES.map((index) => (
          <Square key={index} index={index} />
        ))}
      </div>
      <p className="mt-2 text-sm opacity-60">Board 렌더 횟수: {renders}</p>
    </div>
  );
}

function Status() {
  // 문자열을 반환하는 selector. 파생 계산을 해도 결과가 원시값이라 useShallow 가 필요 없다.
  const status = useGameStore((state) =>
    calculateStatus(state.history[state.currentTurn], state.currentTurn),
  );
  const renders = useRenderCount();

  return (
    <p className="mb-3 text-lg font-medium">
      {status} <span className="text-sm font-normal opacity-60">(렌더 {renders})</span>
    </p>
  );
}

function MoveList() {
  // history 배열 자체가 아니라 길이만 구독한다. 되돌리기로 시점만 바뀔 때는 반응하지 않는다.
  const moveCount = useGameStore((state) => state.history.length);
  const turn = useGameStore((state) => state.currentTurn);
  const jumpTo = useGameStore((state) => state.jumpTo);
  const renders = useRenderCount();

  return (
    <div>
      <p className="mb-3 text-lg font-medium">
        기록 <span className="text-sm font-normal opacity-60">(렌더 {renders})</span>
      </p>
      <ol className="space-y-1">
        {Array.from({ length: moveCount }, (_, move) => (
          <li key={move}>
            <button
              className={`border-0 px-0 py-1 text-sm underline ${
                move === turn ? 'font-bold opacity-100' : 'opacity-60'
              }`}
              onClick={() => jumpTo(move)}
            >
              {move === 0 ? '게임 시작' : `${move}번째 수로`}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function TicTacToe() {
  // 여기서는 아무것도 구독하지 않는다. 구독을 잘게 나눈 효과를 지키는 조건이다.
  const renders = useRenderCount();

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-10">
        <div>
          <Status />
          <Board />
        </div>
        <MoveList />
      </div>

      <p className="mt-4 text-sm opacity-60">
        TicTacToe(최상위) 렌더 횟수: {renders} — 칸 안의 작은 숫자는 그 칸의 렌더 횟수다. StrictMode
        때문에 2씩 오른다.
      </p>

      <Notes
        points={[
          <>
            상태는 <code>history</code> 와 <code>currentTurn</code> <b>둘뿐</b>이다. 누구 차례인지(
            <code>turn % 2</code>)도 승자도 <b>계산</b>해서 쓴다. 중복 상태를 두면 두 값이 어긋날
            여지가 생긴다.
          </>,
          <>
            되돌리기에 새 상태가 필요 없다. <code>history</code> 에 시점별 스냅샷이 쌓여 있으니{' '}
            <code>currentTurn</code> 만 바꾸면 그 시점이 화면에 뜬다.
          </>,
          <>
            복사가 <b>두 겹</b> 필요하다 — 안쪽 보드(<code>board.slice()</code>)와 바깥{' '}
            <code>history</code>. 바깥만 복사하면 안쪽 보드는 여전히 공유된다.
          </>,
          <>
            <code>slice(0, currentTurn + 1)</code> 이 &quot;과거로 돌아간 뒤 새로 두면 그 이후
            기록을 버린다&quot;를 담당한다. 이 한 조각이 없으면 되돌리기가 성립하지 않는다.
          </>,
          <>
            승자 판정은 <b>스토어 밖 순수 함수</b>로 뒀다. 화면과 <code>play</code> 양쪽에서
            쓰이므로 컴포넌트 안에 두면 스토어에서 부를 수 없다. 02 에서 reducer 를 밖에 뒀던 것과
            같은 이유다.
          </>,
          <>
            아무 일도 일어나지 않게 하려면 <code>set</code> 을 <b>아예 부르지 않는</b> 게 가장
            깔끔하다. <code>get()</code> 으로 읽고 조건에 걸리면 그냥 <code>return</code> 한다.
          </>,
        ]}
        questions={[
          {
            q: '클릭해도 화면이 안 바뀐다',
            a: (
              <>
                <code>usePlayerStore.getState().history</code> 로 읽고 있었다. 이건 훅 호출이 아니라{' '}
                <b>함수 객체의 프로퍼티 접근</b>이라 구독이 생기지 않는다. 초기 렌더는 잘 그려지므로
                더 헷갈린다 — <code>getState()</code> 의 문제는 &quot;못 읽는 것&quot;이 아니라{' '}
                <b>&quot;바뀌었을 때 통보를 못 받는 것&quot;</b> 이다.{' '}
                <code>useStore((s) =&gt; s.history)</code> 로 바꿔야 한다.
              </>
            ),
          },
          {
            q: 'history 가 보드들의 배열이 아니라 문자열 배열이 돼버렸다',
            a: (
              <>
                <code>concat(nextBoard)</code> 때문이다. <code>concat</code> 은 인자가 배열이면{' '}
                <b>한 겹 펼쳐서</b> 붙인다 — <code>[1,2].concat([3,4])</code> 는{' '}
                <code>[1,2,3,4]</code> 다. 보드 하나를 통째로 넣으려면{' '}
                <code>concat([nextBoard])</code> 로 감싸야 한다.
                <br />
                <br />
                <b>TypeScript 가 못 잡았다.</b> <code>history</code> 가 <code>Square[][]</code> 라{' '}
                <code>T = Square[]</code> 인데, <code>nextBoard</code> 도 <code>Square[]</code> 라
                &quot;T 원소 하나를 붙이는구나&quot;로 해석해 통과시킨다. 런타임의{' '}
                <code>concat</code> 은 그 사정을 모르고 &quot;배열이네? 펼치자&quot;라고 판단한다.{' '}
                <b>타입 검사를 통과했다고 의도대로 도는 건 아니다.</b>
              </>
            ),
          },
          {
            q: '무승부인데 화면에 "Winner Draw" 라고 나온다',
            a: (
              <>
                <code>calculateWinner</code> 가 승자와 무승부를 <b>같은 반환값</b>으로 돌려주고
                있었다. 이름은 &quot;승자를 계산한다&quot;인데 상태까지 반환하니 호출하는 쪽이{' '}
                <code>&apos;Draw&apos;</code> 를 승자 이름으로 오해한다. 반환 타입이{' '}
                <code>Square</code> 가 못 되고 <code>string | null</code> 로 넓어진 것도 그
                신호였다. <b>승자 판정</b>과 <b>화면 문구</b>를 두 함수로 분리했다.
              </>
            ),
          },
        ]}
      />
    </>
  );
}
