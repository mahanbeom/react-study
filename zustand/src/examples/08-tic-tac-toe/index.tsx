// 공식문서 Tutorial: Tic-Tac-Toe
// 요구사항은 같은 폴더의 REQUIREMENTS.md 참고.
// 여기부터 직접 구현한다. 스타일은 Tailwind v4 유틸리티 클래스로.

export default function TicTacToe() {
  return (
    <div className="rounded-lg border border-dashed border-gray-400 p-6">
      <p className="text-lg font-semibold">아직 구현 전</p>
      <p className="mt-2 text-sm opacity-70">
        같은 폴더의 <code>REQUIREMENTS.md</code> 를 보고 만든다.
      </p>
      <p className="mt-4 grid w-40 grid-cols-3 gap-1">
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={i}
            className="flex aspect-square items-center justify-center border border-gray-400 text-xs opacity-40"
          >
            {i}
          </span>
        ))}
      </p>
    </div>
  );
}
