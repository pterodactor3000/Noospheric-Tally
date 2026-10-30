const HAB_UNIT_NAME_PREFIX = 'Hab-unit#'
const HAB_UNIT_SUFFIX_SPAN = 1000

const readRandomHabUnitSuffix = (): number => {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % HAB_UNIT_SUFFIX_SPAN
}

const buildDefaultHabUnitName = (suffix: number): string => {
  if (!Number.isInteger(suffix) || suffix < 0 || suffix >= HAB_UNIT_SUFFIX_SPAN) {
    throw new Error(`buildDefaultHabUnitName rejected suffix ${suffix}`)
  }

  return `${HAB_UNIT_NAME_PREFIX}${String(suffix).padStart(3, '0')}`
}

export { buildDefaultHabUnitName, readRandomHabUnitSuffix }
