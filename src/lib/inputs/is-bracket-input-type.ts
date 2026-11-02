const isBracketInputType = (type: string | undefined): boolean => {
  return (
    type === undefined ||
    type === 'text' ||
    type === 'search' ||
    type === 'email' ||
    type === 'password'
  )
}

export { isBracketInputType }
