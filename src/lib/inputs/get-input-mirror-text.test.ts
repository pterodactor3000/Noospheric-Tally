import { describe, expect, test } from 'vitest'

import { getInputMirrorText } from './get-input-mirror-text'

describe('getInputMirrorText', () => {
  test('returns the value for a text input', () => {
    expect(getInputMirrorText('abc', 'text')).toEqual('abc')
  })

  test('returns an empty string when the value is empty', () => {
    expect(getInputMirrorText('', 'text')).toEqual('')
  })

  test('returns one bullet per character for a password', () => {
    expect(getInputMirrorText('secret', 'password')).toEqual('••••••')
  })

  test('returns one bullet for an emoji in a password', () => {
    expect(getInputMirrorText('a👍b', 'password')).toEqual('•••')
  })

  test('returns the value for a search input', () => {
    expect(getInputMirrorText('bolt', 'search')).toEqual('bolt')
  })

  test('returns the value for an email input', () => {
    expect(getInputMirrorText('a@b.co', 'email')).toEqual('a@b.co')
  })
})
