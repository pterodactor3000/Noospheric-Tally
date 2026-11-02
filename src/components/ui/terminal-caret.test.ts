import { describe, expect, test } from 'vitest'

import { terminalCaretVariants } from './terminal-caret'

describe('terminalCaretVariants', () => {
  test('matches the title caret classes', () => {
    expect(terminalCaretVariants()).toEqual(
      'border-r-[1ch] border-foreground animate-terminal-blink',
    )
  })

  test('hides the caret until its input has focus', () => {
    expect(terminalCaretVariants({ visibility: 'input-focus' })).toEqual(
      'border-r-[1ch] border-foreground animate-terminal-blink hidden shrink-0 group-focus-within/input:block h-[1.25em]',
    )
  })
})
