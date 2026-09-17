import { describe, expect, test } from 'vitest'

import { isProtectedPath } from './isProtectedPath'

describe('isProtectedPath', () => {
  test('returns true for inventory and hab-unit routes', () => {
    expect(isProtectedPath('/inventory')).toEqual(true)
    expect(isProtectedPath('/inventory/new')).toEqual(true)
    expect(isProtectedPath('/hab-unit')).toEqual(true)
    expect(isProtectedPath('/hab-unit/new')).toEqual(true)
  })

  test('returns false for public routes and lookalike paths', () => {
    expect(isProtectedPath('/')).toEqual(false)
    expect(isProtectedPath('/login')).toEqual(false)
    expect(isProtectedPath('/signup')).toEqual(false)
    expect(isProtectedPath('/inventoryfoo')).toEqual(false)
    expect(isProtectedPath('/hab-units')).toEqual(false)
  })
})
