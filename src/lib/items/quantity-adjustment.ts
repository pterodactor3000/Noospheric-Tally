type QuantityAdjustment = -1 | 1

const isQuantityAdjustment = (value: unknown): value is QuantityAdjustment =>
  value === -1 || value === 1

export { isQuantityAdjustment }
export type { QuantityAdjustment }
