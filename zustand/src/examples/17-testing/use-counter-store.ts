import { create } from 'zustand';
import { counterStoreCreator } from './counter-store-creator.ts';

/** 전역(모듈) 스토어 — 테스트 사이에 상태가 남는 쪽 */
export const useCounterStore = create(counterStoreCreator);
