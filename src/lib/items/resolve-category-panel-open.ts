interface ResolveCategoryPanelOpenOptions {
  readonly toggledOpen: boolean | undefined
  readonly isSearching: boolean
  readonly matchCount: number
  readonly hasShortage: boolean
}

const resolveCategoryPanelOpen = ({
  toggledOpen,
  isSearching,
  matchCount,
  hasShortage,
}: ResolveCategoryPanelOpenOptions): boolean => {
  if (toggledOpen !== undefined) {
    return toggledOpen
  }

  if (isSearching) {
    return matchCount > 0
  }

  return hasShortage
}

export { resolveCategoryPanelOpen }
