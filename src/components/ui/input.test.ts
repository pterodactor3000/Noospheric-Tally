import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import { Input } from './input'

const INPUT_DOT_TRACK = '.'.repeat(300)

const FRAMED_TYPES = ['text', 'search', 'email', 'password'] as const

const UNFRAMED_TYPES = ['checkbox', 'radio', 'hidden'] as const

const renderInput = (props: ComponentProps<'input'>): string =>
  renderToStaticMarkup(createElement(Input, props))

const getOpeningTag = (markup: string, slot: string): string => {
  const token = `data-slot="${slot}"`
  const tokenIndex = markup.indexOf(token)
  if (tokenIndex < 0) {
    return ''
  }

  const tagStart = markup.lastIndexOf('<', tokenIndex)
  const tagEnd = markup.indexOf('>', tokenIndex)
  return markup.slice(tagStart, tagEnd + 1)
}

const getTrackOpeningTag = (markup: string): string => {
  const token = 'aria-hidden="true"'
  const tokenIndex = markup.indexOf(token)
  if (tokenIndex < 0) {
    return ''
  }

  const tagStart = markup.lastIndexOf('<span', tokenIndex)
  const tagEnd = markup.indexOf('>', tokenIndex)
  if (tagStart < 0 || tagEnd < 0) {
    return ''
  }

  return markup.slice(tagStart, tagEnd + 1)
}

const countInputElements = (markup: string): number =>
  markup.match(/<input\b/g)?.length ?? 0

describe('Input', () => {
  test.each(FRAMED_TYPES)(
    'frames a %s input with a dot track and a transparent placeholder',
    (type) => {
      const markup = renderInput({ type })
      const inputTag = getOpeningTag(markup, 'input')
      const caretClassTokens = (
        getOpeningTag(markup, 'input-caret').match(/class="([^"]*)"/)?.[1] ?? ''
      ).split(/\s+/)
      const textIndex = type === 'password'
        ? markup.indexOf('data-slot="input-caret"')
        : markup.indexOf('data-slot="input-mirror"')
      const caretIndex = markup.indexOf('data-slot="input-caret"')
      const dotsIndex = markup.indexOf('data-slot="input-dots"')

      expect({
        hasFrame: markup.includes('data-slot="input-frame"'),
        hasDots: markup.includes('data-slot="input-dots"'),
        trackIsHidden: getTrackOpeningTag(markup).includes('aria-hidden="true"'),
        hasDotTrack: markup.includes(INPUT_DOT_TRACK),
        hasTransparentPlaceholder: inputTag.includes('placeholder:text-transparent'),
        hasLongerArms: getOpeningTag(markup, 'input-frame').includes(
          '[--bracket-arm:calc(0.4em+2px)]',
        ),
        hidesNativeCaret: inputTag.includes('caret-transparent'),
        hasBlockCaret: markup.includes('data-slot="input-caret"'),
        caretHasHiddenClass: caretClassTokens.includes('hidden'),
        caretShowsOnFocus: caretClassTokens.includes('group-focus-within/input:block'),
        caretSitsBeforeDots: textIndex >= 0 && textIndex <= caretIndex && caretIndex < dotsIndex,
      }).toEqual({
        hasFrame: true,
        hasDots: true,
        trackIsHidden: true,
        hasDotTrack: true,
        hasTransparentPlaceholder: true,
        hasLongerArms: true,
        hidesNativeCaret: true,
        hasBlockCaret: true,
        caretHasHiddenClass: true,
        caretShowsOnFocus: true,
        caretSitsBeforeDots: true,
      })
    },
  )

  test('masks a password with one still caret block per character', () => {
    const markup = renderInput({ type: 'password', defaultValue: 'secret' })
    const blockCount = markup.match(/data-slot="input-password-block"/g)?.length ?? 0
    const trackStart = markup.indexOf('aria-hidden="true"')
    const track = trackStart < 0 ? '' : markup.slice(trackStart)
    const passwordBlocksBlink = track
      .split('data-slot="input-password-block"')
      .slice(1)
      .some((part) => part.slice(0, part.indexOf('>')).includes('animate-terminal-blink'))
    const blockIndex = markup.indexOf('data-slot="input-password-block"')
    const caretIndex = markup.indexOf('data-slot="input-caret"')
    const dotsIndex = markup.indexOf('data-slot="input-dots"')

    expect({
      blockCount,
      trackContainsSecret: track.includes('secret'),
      passwordBlocksBlink,
      inputHidesNativeGlyphs: getOpeningTag(markup, 'input').includes('text-transparent'),
      nativeCaretHidden: getOpeningTag(markup, 'input').includes('caret-transparent'),
      caretFollowsBlocks: blockIndex < caretIndex && caretIndex < dotsIndex,
    }).toEqual({
      blockCount: 6,
      trackContainsSecret: false,
      passwordBlocksBlink: false,
      inputHidesNativeGlyphs: true,
      nativeCaretHidden: true,
      caretFollowsBlocks: true,
    })
  })

  test.each(UNFRAMED_TYPES)(
    'renders one unframed input for type %s',
    (type) => {
      const markup = renderInput({ type })

      expect({
        hasFrame: markup.includes('data-slot="input-frame"'),
        inputCount: countInputElements(markup),
        hasFileClasses: markup.includes('file:h-6'),
        hasBlockCaret: markup.includes('data-slot="input-caret"'),
        hidesNativeCaret: markup.includes('caret-transparent'),
      }).toEqual({
        hasFrame: false,
        inputCount: 1,
        hasFileClasses: true,
        hasBlockCaret: false,
        hidesNativeCaret: false,
      })
    },
  )

  test('frames a file input with the dot track and hides the native picker', () => {
    const markup = renderInput({ type: 'file', className: 'min-h-11' })
    const frameTag = getOpeningTag(markup, 'input-frame')
    const inputTag = getOpeningTag(markup, 'input')
    const caretClassTokens = (
      getOpeningTag(markup, 'input-caret').match(/class="([^"]*)"/)?.[1] ?? ''
    ).split(/\s+/)
    const nameIndex = markup.indexOf('data-slot="input-file-name"')
    const caretIndex = markup.indexOf('data-slot="input-caret"')
    const dotsIndex = markup.indexOf('data-slot="input-dots"')

    expect({
      hasFrame: markup.includes('data-slot="input-frame"'),
      hasDots: markup.includes(INPUT_DOT_TRACK),
      hasLongerArms: frameTag.includes('[--bracket-arm:calc(0.4em+2px)]'),
      hasButtonInk: frameTag.includes('[--bracket-color:var(--color-button)]'),
      frameHasClassName: frameTag.includes('min-h-11'),
      inputHasClassName: inputTag.includes('min-h-11'),
      inputCount: countInputElements(markup),
      inputIsFile: inputTag.includes('type="file"'),
      hidesNativePicker: inputTag.includes('opacity-0'),
      hasFileNameSlot: nameIndex >= 0,
      caretHasHiddenClass: caretClassTokens.includes('hidden'),
      caretShowsOnFocus: caretClassTokens.includes('group-focus-within/input:block'),
      caretSitsBeforeDots: nameIndex < caretIndex && caretIndex < dotsIndex,
      hasChooseFileClasses: markup.includes('file:h-6'),
    }).toEqual({
      hasFrame: true,
      hasDots: true,
      hasLongerArms: true,
      hasButtonInk: true,
      frameHasClassName: true,
      inputHasClassName: false,
      inputCount: 1,
      inputIsFile: true,
      hidesNativePicker: true,
      hasFileNameSlot: true,
      caretHasHiddenClass: true,
      caretShowsOnFocus: true,
      caretSitsBeforeDots: true,
      hasChooseFileClasses: false,
    })
  })

  test('puts className on the frame for a framed input', () => {
    const markup = renderInput({ type: 'text', className: 'min-h-11' })
    const frameTag = getOpeningTag(markup, 'input-frame')
    const inputTag = getOpeningTag(markup, 'input')

    expect({
      frameHasClassName: frameTag.includes('min-h-11'),
      inputHasClassName: inputTag.includes('min-h-11'),
    }).toEqual({
      frameHasClassName: true,
      inputHasClassName: false,
    })
  })
})
