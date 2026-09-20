'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { addItemToHabUnit } from '@/lib/items/add-item-to-hab-unit'
import { attachBarcodeToItem } from '@/lib/items/attach-barcode'
import { createNewItem } from '@/lib/items/create-new-item'
import { findGlobalItemByBarcode } from '@/lib/items/find-global-item-by-barcode'
import { loadHabUnitItemByBarcode } from '@/lib/items/load-hab-unit-item-by-barcode'
import { validateBarcode } from '@/lib/items/validate-barcode'
import { validateItemName } from '@/lib/items/validate-item-name'

interface ItemActionError {
  status: 'error'
  message: string
  field?: 'name' | 'barcode'
}

interface ItemAlreadyExists {
  status: 'exists'
  name: string
}

type ItemActionResult = ItemActionError | ItemAlreadyExists

const ITEM_WRITE_FAILURE_MESSAGE =
  'Item write failed. Purify the Machine Spirit and try again.'

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

export { createItem, attachBarcode, addItemToHousehold }
