import type { ReactNode } from 'react';

export type Question = {
  /** 실제로 물어본 질문 */
  q: string;
  /** 그때 얻은 답의 요지 */
  a: ReactNode;
};

type NotesProps = {
  /** 이 예제에서 반드시 남겨야 할 것들 */
  points: ReactNode[];
  /** 진행 중 나온 질문과 답. 접어둔다 */
  questions?: Question[];
};

/** 예제 페이지 맨 아래에 붙이는 정리 블록 */
export default function Notes({ points, questions }: NotesProps) {
  return (
    <aside className="notes">
      <h2>정리</h2>
      <ul>
        {points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>

      {questions && questions.length > 0 && (
        <>
          <h3>진행하며 나온 질문</h3>
          {questions.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <div>{item.a}</div>
            </details>
          ))}
        </>
      )}
    </aside>
  );
}
