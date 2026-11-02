import { describe, expect, test } from 'vitest'

import { terminalCaret } from './class-names'

describe('terminalCaret', () => {
  test('matches the title caret classes', () => {
    expect(terminalCaret).toEqual(
      'border-r-[1ch] border-foreground animate-terminal-blink',
    )
  })
})
