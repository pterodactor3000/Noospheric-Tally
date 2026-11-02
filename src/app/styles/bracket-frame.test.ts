import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

const GLOBALS_CSS_PATH = path.join(__dirname, 'globals.css')

const extractUtilityBlock = (css: string, utilityName: string): string => {
  const marker = `@utility ${utilityName}`
  const start = css.indexOf(marker)
  if (start === -1) {
    throw new Error(
      `extractUtilityBlock failed: @utility ${utilityName} is missing from globals.css`,
    )
  }

  const openBrace = css.indexOf('{', start)
  if (openBrace === -1) {
    throw new Error(
      `extractUtilityBlock failed: @utility ${utilityName} has no block in globals.css`,
    )
  }

  let depth = 0
  for (let index = openBrace; index < css.length; index += 1) {
    const character = css[index]
    if (character === '{') {
      depth += 1
    } else if (character === '}') {
      depth -= 1
      if (depth === 0) {
        return css.slice(openBrace + 1, index)
      }
    }
  }

  throw new Error(
    `extractUtilityBlock failed: @utility ${utilityName} block does not close in globals.css`,
  )
}

const readDeclaration = (block: string, property: string): string | null => {
  const match = new RegExp(`(?:^|[\\s{;])${property}\\s*:\\s*([^;]+);`).exec(block)
  return match ? match[1].trim() : null
}

const globalsCss = readFileSync(GLOBALS_CSS_PATH, 'utf8')
const bracketFrameBlock = extractUtilityBlock(globalsCss, 'bracket-frame')

describe('bracket-frame utility', () => {
  test('draws both brackets on the button edges with a currentColor fallback', () => {
    expect({
      utility: globalsCss.includes('@utility bracket-frame'),
      before: /::before\s*[,{]/.test(bracketFrameBlock),
      after: /::after\s*[,{]/.test(bracketFrameBlock),
      top: readDeclaration(bracketFrameBlock, 'top'),
      bottom: readDeclaration(bracketFrameBlock, 'bottom'),
      border: readDeclaration(bracketFrameBlock, 'border'),
      width: readDeclaration(bracketFrameBlock, 'width'),
      glow: bracketFrameBlock.includes('color-mix'),
    }).toEqual({
      utility: true,
      before: true,
      after: true,
      top: '0',
      bottom: '0',
      border: '2px solid var(--bracket-color, currentColor)',
      width: 'calc(var(--bracket-arm, 0.4em) + 2px)',
      glow: false,
    })
  })
})
