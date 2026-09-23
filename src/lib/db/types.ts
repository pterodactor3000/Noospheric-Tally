interface dbHabUnitInventory {
  readonly id: string
  readonly household_id: string
  readonly item_id: string
  readonly name: string
  readonly created_at: Date
}

interface dbFindItemByBarcode {
  readonly item_id: string
  readonly canonical_name: string
}

export { type dbFindItemByBarcode, type dbHabUnitInventory }
