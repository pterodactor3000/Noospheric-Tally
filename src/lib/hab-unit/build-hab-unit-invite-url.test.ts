import { describe, expect, test } from 'vitest'

import { buildHabUnitInviteUrl } from './build-hab-unit-invite-url'

const INVITE_CODE = '0123456789abcdef0123456789abcdef'

describe('buildHabUnitInviteUrl', () => {
  test('joins an origin that has no trailing slash', () => {
    expect(buildHabUnitInviteUrl('https://tally.example', INVITE_CODE)).toEqual(
      `https://tally.example/hab-unit/new?code=${INVITE_CODE}`,
    )
  })

  test('removes one trailing slash before joining the path', () => {
    expect(
      buildHabUnitInviteUrl('https://tally.example/', INVITE_CODE),
    ).toEqual(`https://tally.example/hab-unit/new?code=${INVITE_CODE}`)
  })

  test('leaves a code that needs no encoding unchanged', () => {
    expect(encodeURIComponent(INVITE_CODE)).toEqual(INVITE_CODE)
    expect(buildHabUnitInviteUrl('https://tally.example', INVITE_CODE)).toEqual(
      'https://tally.example/hab-unit/new?code=0123456789abcdef0123456789abcdef',
    )
  })
})
