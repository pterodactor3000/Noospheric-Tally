import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

interface OklchColor {
  readonly lightness: number
  readonly chroma: number
  readonly hue: number
}

interface TokenBlock {
  readonly declarations: Readonly<Record<string, string>>
  readonly chrome: Readonly<Record<string, OklchColor>>
}

const CHROME_TOKEN_NAMES = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
] as const

const STOCK_TOKEN_VALUES: Readonly<Record<string, string>> = {
  '--stock-critical': 'oklch(0.58 0.21 27)',
  '--stock-critical-foreground': 'oklch(0.985 0.008 155)',
  '--stock-warning': 'oklch(0.8 0.16 85)',
  '--stock-warning-foreground': 'oklch(0.2 0.015 160)',
  '--stock-in-stock': 'oklch(0.62 0.17 145)',
  '--stock-in-stock-foreground': 'oklch(0.2 0.015 160)',
}

const IN_STOCK_COLOR: OklchColor = { lightness: 0.62, chroma: 0.17, hue: 145 }
const MAX_CHROME_CHROMA = 0.06
const MIN_IN_STOCK_DISTANCE = 0.12
const CHROMA_AND_DISTANCE_EXEMPT_TOKEN = 'destructive'

const OKLCH_PATTERN =
  /^oklch\(\s*(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s*\)$/

const ROOT_BLOCK_PATTERN = /^:root\s*\{([^}]*)\}/m
const DARK_ROOT_BLOCK_PATTERN =
  /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/

const GLOBALS_CSS_PATH = path.join(__dirname, 'globals.css')

const parseOklch = (value: string): OklchColor | null => {
  const match = OKLCH_PATTERN.exec(value.trim())
  if (!match) {
    return null
  }
  return {
    lightness: Number(match[1]),
    chroma: Number(match[2]),
    hue: Number(match[3]),
  }
}

const parseTokenBlock = (blockBody: string): TokenBlock => {
  const declarations: Record<string, string> = {}
  for (const match of blockBody.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    declarations[match[1]] = match[2].trim()
  }

  const chrome: Record<string, OklchColor> = {}
  for (const tokenName of CHROME_TOKEN_NAMES) {
    const rawValue = declarations[`--${tokenName}`]
    if (rawValue === undefined) {
      throw new Error(`parseTokenBlock failed: chrome token --${tokenName} is missing`)
    }
    const color = parseOklch(rawValue)
    if (!color) {
      throw new Error(
        `parseTokenBlock failed: chrome token --${tokenName} is not oklch (value: ${rawValue})`,
      )
    }
    chrome[tokenName] = color
  }

  return { declarations, chrome }
}

const extractBlockBody = (css: string, pattern: RegExp): string => {
  const match = pattern.exec(css)
  if (!match) {
    throw new Error(`extractBlockBody failed: no block matched ${pattern} in globals.css`)
  }
  return match[1]
}

const toOklab = (color: OklchColor): readonly [number, number, number] => {
  const hueRadians = (color.hue * Math.PI) / 180
  return [
    color.lightness,
    color.chroma * Math.cos(hueRadians),
    color.chroma * Math.sin(hueRadians),
  ]
}

const getOklabDistance = (first: OklchColor, second: OklchColor): number => {
  const [firstL, firstA, firstB] = toOklab(first)
  const [secondL, secondA, secondB] = toOklab(second)
  return Math.hypot(firstL - secondL, firstA - secondA, firstB - secondB)
}

const getCheckedTokenNames = (): string[] =>
  CHROME_TOKEN_NAMES.filter((name) => name !== CHROMA_AND_DISTANCE_EXEMPT_TOKEN)

const globalsCss = readFileSync(GLOBALS_CSS_PATH, 'utf8')
const lightBlock = parseTokenBlock(extractBlockBody(globalsCss, ROOT_BLOCK_PATTERN))
const darkBlock = parseTokenBlock(extractBlockBody(globalsCss, DARK_ROOT_BLOCK_PATTERN))

const modes: ReadonlyArray<readonly [string, TokenBlock]> = [
  ['light', lightBlock],
  ['dark', darkBlock],
]

describe('theme tokens', () => {
  test('sets the base radius token to 0', () => {
    expect(lightBlock.declarations['--radius']).toEqual('0')
  })

  test('keeps the FR-008 stock label colors at their fixed values', () => {
    const actualStockValues = Object.fromEntries(
      Object.keys(STOCK_TOKEN_VALUES).map((name) => [name, lightBlock.declarations[name]]),
    )
    expect(actualStockValues).toEqual(STOCK_TOKEN_VALUES)
  })

  test('defines stock label tokens only in the light root block', () => {
    const lightStockNames = Object.keys(lightBlock.declarations)
      .filter((name) => name.startsWith('--stock-'))
      .sort()
    const darkStockNames = Object.keys(darkBlock.declarations).filter((name) =>
      name.startsWith('--stock-'),
    )
    expect({ light: lightStockNames, dark: darkStockNames }).toEqual({
      light: Object.keys(STOCK_TOKEN_VALUES).sort(),
      dark: [],
    })
  })

  test('keeps every chrome color token at or below 0.06 chroma except destructive', () => {
    const tokensOverCeiling = Object.fromEntries(
      modes.map(([modeName, block]) => [
        modeName,
        getCheckedTokenNames().filter(
          (name) => block.chrome[name].chroma > MAX_CHROME_CHROMA,
        ),
      ]),
    )
    expect(tokensOverCeiling).toEqual({ light: [], dark: [] })
  })

  test('keeps every chrome color token at least 0.12 OKLab distance from the in-stock color', () => {
    const tokensTooClose = Object.fromEntries(
      modes.map(([modeName, block]) => [
        modeName,
        getCheckedTokenNames().filter(
          (name) =>
            getOklabDistance(block.chrome[name], IN_STOCK_COLOR) < MIN_IN_STOCK_DISTANCE,
        ),
      ]),
    )
    expect(tokensTooClose).toEqual({ light: [], dark: [] })
  })

  test('fails to parse when a chrome token is not oklch', () => {
    const fixtureBody = CHROME_TOKEN_NAMES.map((name) =>
      name === 'ring' ? `--${name}: #668a76;` : `--${name}: oklch(0.5 0.02 160);`,
    ).join('\n')

    expect(() => parseTokenBlock(fixtureBody)).toThrowError(
      new Error('parseTokenBlock failed: chrome token --ring is not oklch (value: #668a76)'),
    )
  })
})
