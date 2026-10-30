const filterItemsByName = <TItem extends { readonly name: string }>(
  items: readonly TItem[],
  query: string,
): TItem[] => {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return [...items]
  }

  return items.filter((item) =>
    item.name.toLowerCase().includes(normalizedQuery),
  )
}

export { filterItemsByName }
