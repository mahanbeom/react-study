import { delay } from 'msw';

/**
 * 개발 브라우저에서는 지정한 지연으로 로딩 상태를 눈으로 확인할 수 있게 하고,
 * 테스트에서는 즉시 응답해 수백 ms씩 쌓이는 대기를 없앤다.
 * (vitest는 import.meta.env.MODE를 'test'로 설정한다)
 */
export function networkDelay(ms: number): Promise<void> {
  return import.meta.env.MODE === 'test' ? Promise.resolve() : delay(ms);
}
