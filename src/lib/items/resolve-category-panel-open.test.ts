import { describe, expect, test } from 'vitest'

import { resolveCategoryPanelOpen } from './resolve-category-panel-open'

describe('resolveCategoryPanelOpen', () => {
  test('starts open with a shortage and no search', () => {
    expect(
      resolveCategoryPanelOpen({
        toggledOpen: undefined,
        isSearching: false,
        matchCount: 0,
        hasShortage: true,
      }),
    ).toEqual(true)
  })

  test('starts closed with no shortage and no search', () => {
    expect(
      resolveCategoryPanelOpen({
        toggledOpen: undefined,
        isSearching: false,
        matchCount: 0,
        hasShortage: false,
      }),
    ).toEqual(false)
  })

  test('opens a panel with a match while searching', () => {
    expect(
      resolveCategoryPanelOpen({
        toggledOpen: undefined,
        isSearching: true,
        matchCount: 1,
        hasShortage: false,
      }),
    ).toEqual(true)
  })

  test('closes a panel with no match while searching even with a shortage', () => {
    expect(
      resolveCategoryPanelOpen({
        toggledOpen: undefined,
        isSearching: true,
        matchCount: 0,
        hasShortage: true,
      }),
    ).toEqual(false)
  })

  test('returns the toggled value over every derived rule', () => {
    expect([
      resolveCategoryPanelOpen({
        toggledOpen: false,
        isSearching: false,
        matchCount: 0,
        hasShortage: true,
      }),
      resolveCategoryPanelOpen({
        toggledOpen: true,
        isSearching: true,
        matchCount: 0,
        hasShortage: false,
      }),
      resolveCategoryPanelOpen({
        toggledOpen: false,
        isSearching: true,
        matchCount: 2,
        hasShortage: true,
      }),
    ]).toEqual([false, true, false])
  })
})
