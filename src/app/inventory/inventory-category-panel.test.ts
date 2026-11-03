import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import InventoryCategoryPanel from './inventory-category-panel'

const CLOSED_EMPTY_MARKUP =
  '<div><h2 class="m-0"><button type="button" aria-expanded="false" aria-controls="inventory-category-pet-food" class="flex w-full items-center justify-between gap-3 text-left font-mono text-base leading-7"><span class="flex min-w-0 items-center gap-2"><span class="truncate">Pet food</span><span class="shrink-0">0</span></span><svg viewBox="0 0 24 24" aria-hidden="true" class="size-5 shrink-0 transition-transform duration-500 ease-in-out motion-reduce:transition-none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg></button></h2><div class="grid transition-[grid-template-rows] duration-500 ease-in-out motion-reduce:transition-none grid-rows-[0fr]"><div class="min-h-0 overflow-hidden"><div id="inventory-category-pet-food" inert="" aria-hidden="true"><p class="px-2">Nothing in this category.</p></div></div></div></div>'

const OPEN_WARNING_MARKUP =
  '<div><h2 class="m-0"><button type="button" aria-expanded="true" aria-controls="inventory-category-pet-food" class="flex w-full items-center justify-between gap-3 text-left font-mono text-base leading-7 text-stock-warning-text"><span class="flex min-w-0 items-center gap-2"><span class="truncate">Pet food</span><span class="shrink-0">2</span><span class="sr-only">WARNING</span></span><svg viewBox="0 0 24 24" aria-hidden="true" class="size-5 shrink-0 transition-transform duration-500 ease-in-out motion-reduce:transition-none rotate-180" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg></button></h2><div class="grid transition-[grid-template-rows] duration-500 ease-in-out motion-reduce:transition-none grid-rows-[1fr]"><div class="min-h-0 overflow-hidden"><div id="inventory-category-pet-food" aria-hidden="false">Kept</div></div></div></div>'

const renderPanel = ({
  isOpen = false,
  itemCount = 0,
  shortage = null,
  actions,
}: {
  isOpen?: boolean
  itemCount?: number
  shortage?: 'critical' | 'warning' | null
  actions?: ReactNode
} = {}): string => {
  const panelProps = {
    label: 'Pet food',
    panelId: 'inventory-category-pet-food',
    isOpen,
    onToggle: () => undefined,
    itemCount,
    shortage,
  }

  if (actions === undefined) {
    return renderToStaticMarkup(
      createElement(InventoryCategoryPanel, panelProps, 'Kept'),
    )
  }

  return renderToStaticMarkup(
    createElement(InventoryCategoryPanel, { ...panelProps, actions }, 'Kept'),
  )
}

describe('InventoryCategoryPanel', () => {
  test('returns the pre-change markup when actions is absent', () => {
    expect({
      closedEmpty: renderPanel(),
      openWarning: renderPanel({
        isOpen: true,
        itemCount: 2,
        shortage: 'warning',
      }),
    }).toEqual({
      closedEmpty: CLOSED_EMPTY_MARKUP,
      openWarning: OPEN_WARNING_MARKUP,
    })
  })

  test('places actions outside the toggle button', () => {
    const markup = renderPanel({
      actions: createElement(
        'span',
        { 'data-slot': 'category-actions' },
        'Rename',
      ),
    })
    const buttonEnd = markup.indexOf('</button>')
    const actionIndex = markup.indexOf('data-slot="category-actions"')
    const headingEnd = markup.indexOf('</h2>')

    expect({
      actionFollowsButton: actionIndex > buttonEnd,
      actionStaysInHeading: actionIndex < headingEnd,
      buttonOmitsAction: !markup.slice(0, buttonEnd).includes('category-actions'),
    }).toEqual({
      actionFollowsButton: true,
      actionStaysInHeading: true,
      buttonOmitsAction: true,
    })
  })
})
