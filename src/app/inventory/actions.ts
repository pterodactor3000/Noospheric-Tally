'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { addItemToHabUnit } from '@/lib/items/add-item-to-hab-unit'
import { adjustHabUnitQuantity } from '@/lib/items/adjust-hab-unit-quantity'
import { attachBarcodeToItem } from '@/lib/items/attach-barcode'
import { createNewItem } from '@/lib/items/create-new-item'
import { createNewItemWithoutBarcode } from '@/lib/items/create-new-item-without-barcode'
import { decrementHabUnitQuantity } from '@/lib/items/decrement-hab-unit-quantity'
import { findGlobalItemByBarcode } from '@/lib/items/find-global-item-by-barcode'
import { incrementHabUnitQuantity } from '@/lib/items/increment-hab-unit-quantity'
import { loadHabUnitItemByBarcode } from '@/lib/items/load-hab-unit-item-by-barcode'
import {
  loadScanSessionLines,
  type ScanSessionLine,
} from '@/lib/items/load-scan-session-lines'
import { isQuantityAdjustment } from '@/lib/items/quantity-adjustment'
import { reverseQuantityChange } from '@/lib/items/reverse-quantity-change'
import {
  ITEM_WRITE_FAILURE_MESSAGE,
  SCAN_SESSION_LOAD_FAILURE_MESSAGE,
} from '@/lib/items/scan-failure-messages'
import { isScanSessionId } from '@/lib/items/scan-session'
import { setHabUnitItemLevels } from '@/lib/items/set-hab-unit-item-levels'
import { validateBarcode } from '@/lib/items/validate-barcode'
import { validateHouseholdQuantity } from '@/lib/items/validate-household-quantity'
import { validateItemName } from '@/lib/items/validate-item-name'
import { validateMinimumQuantity } from '@/lib/items/validate-minimum-quantity'
import { createClient } from '@/lib/supabase/server'

interface ItemActionError {
  status: 'error'
  message: string
  field?: 'name' | 'barcode' | 'minimum'
}

interface ItemAlreadyExists {
  status: 'exists'
  name: string
}

type ItemActionResult = ItemActionError | ItemAlreadyExists

interface ScanSessionLinesLoaded {
  status: 'loaded'
  lines: ScanSessionLine[]
}

type ScanSessionLinesResult = ScanSessionLinesLoaded | ItemActionError

interface ScanSessionLineReversed {
  status: 'reversed'
  quantity: number
}

type ScanSessionLineReversalResult = ScanSessionLineReversed | ItemActionError

interface QuantityAdjusted {
  status: 'adjusted'
  quantity: number
}

type QuantityAdjustmentResult = QuantityAdjusted | ItemActionError

const REVERSAL_BELOW_ZERO_MESSAGE =
  'This line cannot be reversed because the count would drop below 0.'

const QUANTITY_BELOW_ZERO_MESSAGE = 'The count cannot go below 0.'

const QUANTITY_ABOVE_MAXIMUM_MESSAGE = 'The count cannot go above 999999.'

const STALE_ITEM_LEVELS_MESSAGE =
  'The count changed. Reload the page before saving.'

const parseExpectedQuantity = (rawValue: string): number | null => {
  if (!/^\d+$/.test(rawValue)) {
    return null
  }

  const quantity = Number(rawValue)
  if (!Number.isSafeInteger(quantity)) {
    return null
  }

  return quantity
}

const getFormString = (formData: FormData, key: string): string => {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

const redirectToInventory = (): never => {
  revalidatePath('/inventory')
  redirect('/inventory')
}

const createItem = async (formData: FormData): Promise<ItemActionResult> => {
  const nameResult = validateItemName(getFormString(formData, 'name'))
  if (nameResult.status === 'invalid') {
    return { status: 'error', message: nameResult.message, field: 'name' }
  }

  const barcodeResult = validateBarcode(getFormString(formData, 'barcode'))
  if (barcodeResult.status === 'invalid') {
    return {
      status: 'error',
      message: barcodeResult.message,
      field: 'barcode',
    }
  }

  const { name } = nameResult
  const { barcode } = barcodeResult

  try {
    const householdItem = await loadHabUnitItemByBarcode(barcode)
    if (householdItem) {
      return { status: 'exists', name: householdItem.name }
    }

    const globalItem = await findGlobalItemByBarcode(barcode)
    if (globalItem) {
      await addItemToHabUnit(globalItem.itemId, name)
    } else {
      try {
        await createNewItem(name, barcode)
      } catch (error: unknown) {
        console.error('create_item failed, looking up barcode again', {
          barcode,
          error,
        })

        const householdItemAfterCreate = await loadHabUnitItemByBarcode(barcode)
        if (householdItemAfterCreate) {
          return { status: 'exists', name: householdItemAfterCreate.name }
        }

        const globalItemAfterCreate = await findGlobalItemByBarcode(barcode)
        if (globalItemAfterCreate) {
          await addItemToHabUnit(globalItemAfterCreate.itemId, name)
        } else {
          return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
        }
      }
    }
  } catch (error: unknown) {
    console.error('createItem failed', { barcode, error })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  return redirectToInventory()
}

const createItemWithoutBarcode = async (
  formData: FormData,
): Promise<ItemActionResult> => {
  const nameResult = validateItemName(getFormString(formData, 'name'))
  if (nameResult.status === 'invalid') {
    return { status: 'error', message: nameResult.message, field: 'name' }
  }

  try {
    const supabase = await createClient()
    await createNewItemWithoutBarcode(nameResult.name, supabase)
  } catch (error: unknown) {
    console.error('createItemWithoutBarcode failed', {
      name: nameResult.name,
      error,
    })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  return redirectToInventory()
}

const attachBarcode = async (formData: FormData): Promise<ItemActionResult> => {
  const itemId = getFormString(formData, 'itemId')
  if (!itemId) {
    return {
      status: 'error',
      message: ITEM_WRITE_FAILURE_MESSAGE,
    }
  }

  const barcodeResult = validateBarcode(getFormString(formData, 'barcode'))
  if (barcodeResult.status === 'invalid') {
    return {
      status: 'error',
      message: barcodeResult.message,
      field: 'barcode',
    }
  }

  try {
    await attachBarcodeToItem(itemId, barcodeResult.barcode)
  } catch (error: unknown) {
    console.error('attachBarcode failed', { itemId, error })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  return redirectToInventory()
}

const addItemToHousehold = async (
  formData: FormData,
): Promise<ItemActionResult> => {
  const itemId = getFormString(formData, 'itemId')
  const nameResult = validateItemName(getFormString(formData, 'name'))

  if (!itemId) {
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  if (nameResult.status === 'invalid') {
    return { status: 'error', message: nameResult.message, field: 'name' }
  }

  try {
    await addItemToHabUnit(itemId, nameResult.name)
  } catch (error: unknown) {
    console.error('addItemToHousehold failed', { itemId, error })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  return redirectToInventory()
}

const stockScannedItem = async (
  barcode: string,
  scanSessionId: unknown,
): Promise<ItemActionResult> => {
  const barcodeResult = validateBarcode(barcode)
  if (barcodeResult.status === 'invalid') {
    return {
      status: 'error',
      message: barcodeResult.message,
      field: 'barcode',
    }
  }

  if (!isScanSessionId(scanSessionId)) {
    console.error('stockScannedItem rejected scan session id', {
      barcode: barcodeResult.barcode,
    })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  const validBarcode = barcodeResult.barcode
  const encodedBarcode = encodeURIComponent(validBarcode)

  const householdItem = await loadHabUnitItemByBarcode(validBarcode)
  if (!householdItem) {
    redirect(`/inventory/new?barcode=${encodedBarcode}`)
  }

  try {
    const supabase = await createClient()
    await incrementHabUnitQuantity(validBarcode, scanSessionId, supabase)
  } catch (error: unknown) {
    console.error('stockScannedItem failed', { barcode: validBarcode, error })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  revalidatePath('/inventory')
  redirect(
    `/inventory/scan?barcode=${encodedBarcode}&direction=stocking&added=1`,
  )
}

const consumeScannedItem = async (
  barcode: string,
  scanSessionId: unknown,
): Promise<ItemActionResult> => {
  const barcodeResult = validateBarcode(barcode)
  if (barcodeResult.status === 'invalid') {
    return {
      status: 'error',
      message: barcodeResult.message,
      field: 'barcode',
    }
  }

  if (!isScanSessionId(scanSessionId)) {
    console.error('consumeScannedItem rejected scan session id', {
      barcode: barcodeResult.barcode,
    })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  const validBarcode = barcodeResult.barcode
  const encodedBarcode = encodeURIComponent(validBarcode)

  const householdItem = await loadHabUnitItemByBarcode(validBarcode)
  if (!householdItem) {
    redirect(`/inventory/new?barcode=${encodedBarcode}`)
  }

  if (householdItem.quantity === 0) {
    redirect(
      `/inventory/scan?barcode=${encodedBarcode}&direction=using&floor=1`,
    )
  }

  try {
    const supabase = await createClient()
    await decrementHabUnitQuantity(validBarcode, scanSessionId, supabase)
  } catch (error: unknown) {
    console.error('consumeScannedItem failed', { barcode: validBarcode, error })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  revalidatePath('/inventory')
  redirect(
    `/inventory/scan?barcode=${encodedBarcode}&direction=using&removed=1`,
  )
}

const fetchScanSessionLines = async (
  scanSessionId: unknown,
): Promise<ScanSessionLinesResult> => {
  if (!isScanSessionId(scanSessionId)) {
    console.error('fetchScanSessionLines rejected scan session id', {
      scanSessionId,
    })
    return { status: 'error', message: SCAN_SESSION_LOAD_FAILURE_MESSAGE }
  }

  try {
    const supabase = await createClient()
    const lines = await loadScanSessionLines(scanSessionId, supabase)
    return { status: 'loaded', lines }
  } catch (error: unknown) {
    console.error('fetchScanSessionLines failed', { scanSessionId, error })
    return { status: 'error', message: SCAN_SESSION_LOAD_FAILURE_MESSAGE }
  }
}

const reverseScanSessionLine = async (
  changeId: unknown,
): Promise<ScanSessionLineReversalResult> => {
  // A change id is a UUID, so the scan session id guard validates it too.
  if (!isScanSessionId(changeId)) {
    console.error('reverseScanSessionLine rejected change id', { changeId })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  try {
    const supabase = await createClient()
    const result = await reverseQuantityChange(changeId, supabase)
    if (result.status === 'below-zero') {
      return { status: 'error', message: REVERSAL_BELOW_ZERO_MESSAGE }
    }

    revalidatePath('/inventory')
    return { status: 'reversed', quantity: result.quantity }
  } catch (error: unknown) {
    console.error('reverseScanSessionLine failed', { changeId, error })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }
}

const saveItemLevels = async (
  formData: FormData,
): Promise<ItemActionError> => {
  const itemId = getFormString(formData, 'itemId')
  const rawQuantity = getFormString(formData, 'quantity')
  const rawMinimumQuantity = getFormString(formData, 'minimumQuantity')
  const expectedQuantity = parseExpectedQuantity(
    getFormString(formData, 'expectedQuantity'),
  )

  if (!isScanSessionId(itemId)) {
    console.error('saveItemLevels rejected item id', { itemId })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  const quantityResult = validateHouseholdQuantity(rawQuantity)
  if (quantityResult.status === 'invalid') {
    return { status: 'error', message: quantityResult.message }
  }

  const minimumResult = validateMinimumQuantity(rawMinimumQuantity)
  if (minimumResult.status === 'invalid') {
    return {
      status: 'error',
      message: minimumResult.message,
      field: 'minimum',
    }
  }

  if (expectedQuantity === null) {
    console.error('saveItemLevels rejected expected quantity', { itemId })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  try {
    const supabase = await createClient()
    const result = await setHabUnitItemLevels(
      itemId,
      {
        quantity: quantityResult.quantity,
        minimumQuantity: minimumResult.minimumQuantity,
        expectedQuantity,
      },
      supabase,
    )
    if (result.status === 'stale') {
      return { status: 'error', message: STALE_ITEM_LEVELS_MESSAGE }
    }
  } catch (error: unknown) {
    console.error('saveItemLevels failed', { itemId, error })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${itemId}`)
  redirect('/inventory')
}

const adjustItemQuantity = async (
  itemId: unknown,
  deltaQuantity: unknown,
): Promise<QuantityAdjustmentResult> => {
  if (!isScanSessionId(itemId)) {
    console.error('adjustItemQuantity rejected item id', { itemId })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  if (!isQuantityAdjustment(deltaQuantity)) {
    console.error('adjustItemQuantity rejected delta', { deltaQuantity })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  try {
    const supabase = await createClient()
    const result = await adjustHabUnitQuantity(itemId, deltaQuantity, supabase)
    if (result.status === 'below-zero') {
      return { status: 'error', message: QUANTITY_BELOW_ZERO_MESSAGE }
    }

    if (result.status === 'above-maximum') {
      return { status: 'error', message: QUANTITY_ABOVE_MAXIMUM_MESSAGE }
    }

    revalidatePath('/inventory')
    revalidatePath(`/inventory/${itemId}`)
    return { status: 'adjusted', quantity: result.quantity }
  } catch (error: unknown) {
    console.error('adjustItemQuantity failed', {
      itemId,
      deltaQuantity,
      error,
    })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }
}

export {
  createItem,
  createItemWithoutBarcode,
  attachBarcode,
  addItemToHousehold,
  stockScannedItem,
  consumeScannedItem,
  fetchScanSessionLines,
  reverseScanSessionLine,
  saveItemLevels,
  adjustItemQuantity,
}
