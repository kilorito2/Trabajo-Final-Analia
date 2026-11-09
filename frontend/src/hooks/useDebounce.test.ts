import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('entrega el valor recién cuando deja de cambiar durante 300 ms', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor), {
      initialProps: { valor: 'a' },
    });

    rerender({ valor: 'am' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ valor: 'amo' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('amo');
  });
});
