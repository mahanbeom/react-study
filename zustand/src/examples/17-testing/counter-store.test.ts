import { describe, test } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { counterStoreCreator } from './counter-store-creator.ts';

void createStore; // TODO ② 에서 사용
void counterStoreCreator; // TODO ② 에서 사용

// 스토어 단위 테스트 — React 도 RTL 도 필요 없다.
// 렌더 없이 로직만 확인하고 싶을 때 가장 빠르고 안정적인 층이다.

describe('counterStoreCreator', () => {
  // TODO ② — 아래 test.todo 두 개를 진짜 테스트로 바꿔라. 필요한 건 세 줄뿐이다:
  //   const store = createStore<CounterStore>()(counterStoreCreator);
  //   (CounterStore 타입도 같이 import 해야 한다)
  //   store.getState().inc();
  //   expect(store.getState().count).toBe(2);
  //
  // 그리고 생각해 볼 것: 이 파일은 왜 __mocks__ 의 자동 리셋이 없어도 안전한가?
  // (스토어를 매 테스트에서 새로 만드는지, 모듈 최상단에서 한 번 만드는지가 가른다)

  test.todo('초기 count 는 1 이다');
  test.todo('inc 를 두 번 부르면 3 이 된다');
});
