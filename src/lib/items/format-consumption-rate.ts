const formatConsumptionRate = (usingScanCount: number): string => {
  if (!Number.isInteger(usingScanCount) || usingScanCount < 0) {
    throw new Error(
      `formatConsumptionRate rejected count ${usingScanCount}`,
    )
  }

  if (usingScanCount === 0) {
    return 'No use recorded'
  }

  return `${usingScanCount} per week`
}

export { formatConsumptionRate }
