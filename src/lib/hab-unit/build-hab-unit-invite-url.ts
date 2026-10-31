const buildHabUnitInviteUrl = (origin: string, inviteCode: string): string => {
  const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin

  return `${normalizedOrigin}/hab-unit/new?code=${encodeURIComponent(inviteCode)}`
}

export { buildHabUnitInviteUrl }
