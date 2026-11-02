import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import { Input } from './input'

const INPUT_DOT_TRACK = '·'.repeat(300)

const FRAMED_TYPES = ['text', 'search', 'email', 'password'] as const

const UNFRAMED_TYPES = ['file', 'checkbox', 'radio', 'hidden'] as const

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
  const mirrorSlotIndex = markup.indexOf('data-slot="input-mirror"')
  if (mirrorSlotIndex < 0) {
    return ''
  }

  const mirrorTagStart = markup.lastIndexOf('<span', mirrorSlotIndex)
  const trackTagStart = markup.lastIndexOf('<span', mirrorTagStart - 1)
  if (trackTagStart < 0) {
    return ''
  }

  const trackTagEnd = markup.indexOf('>', trackTagStart)
  return markup.slice(trackTagStart, trackTagEnd + 1)
}

const getSlotText = (markup: string, slot: string): string => {
  const openingTag = getOpeningTag(markup, slot)
  const contentStart = markup.indexOf(openingTag)
  if (openingTag.length === 0 || contentStart < 0) {
    return ''
  }

  const textStart = contentStart + openingTag.length
  const textEnd = markup.indexOf('</span>', textStart)
  return markup.slice(textStart, textEnd)
}

const countInputElements = (markup: string): number =>
  markup.match(/<input\b/g)?.length ?? 0

describe('Input', () => {
  test.each(FRAMED_TYPES)(
    'frames a %s input with a dot track and a transparent placeholder',
    (type) => {
      const markup = renderInput({ type })
      const inputTag = getOpeningTag(markup, 'input')

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
      }).toEqual({
        hasFrame: true,
        hasDots: true,
        trackIsHidden: true,
        hasDotTrack: true,
        hasTransparentPlaceholder: true,
        hasLongerArms: true,
        hidesNativeCaret: false,
        hasBlockCaret: false,
      })
    },
  )

  test('masks a password in the mirror and leaves the typed value out of it', () => {
    const markup = renderInput({ type: 'password', defaultValue: 'secret' })
    const mirrorText = getSlotText(markup, 'input-mirror')

    expect(mirrorText).toEqual('••••••')
    expect(mirrorText.includes('secret')).toEqual(false)
  })

  test.each(UNFRAMED_TYPES)(
    'renders one unframed input for type %s',
    (type) => {
      const markup = renderInput({ type })

      expect({
        hasFrame: markup.includes('data-slot="input-frame"'),
        inputCount: countInputElements(markup),
        hasFileClasses: markup.includes('file:h-6'),
      }).toEqual({
        hasFrame: false,
        inputCount: 1,
        hasFileClasses: true,
      })
    },
  )

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
