import { useState, type ComponentType } from 'react';
import { examples } from './examples/index.ts';
import { labs } from './labs/index.ts';

type Entry = { id: string; title: string; docs?: string; Component: ComponentType };

const allEntries: Entry[] = [...examples, ...labs];

export default function App() {
  const [currentId, setCurrentId] = useState(allEntries[0].id);
  const current = allEntries.find((entry) => entry.id === currentId) ?? allEntries[0];

  const renderButton = (entry: Entry) => (
    <li key={entry.id}>
      <button
        type="button"
        aria-current={entry.id === current.id}
        onClick={() => setCurrentId(entry.id)}
      >
        {entry.title}
      </button>
    </li>
  );

  return (
    <div className="layout">
      <nav>
        <strong>zustand 스터디</strong>
        <ol>{examples.map(renderButton)}</ol>
        <strong>실험</strong>
        <ul>{labs.map(renderButton)}</ul>
      </nav>
      <main>
        <h1>{current.title}</h1>
        {current.docs && (
          <p>
            <a href={current.docs} target="_blank" rel="noreferrer">
              공식문서 원문 ↗
            </a>
          </p>
        )}
        <hr />
        <current.Component />
      </main>
    </div>
  );
}
