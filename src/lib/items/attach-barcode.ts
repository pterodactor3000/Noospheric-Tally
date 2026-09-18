import { DB_FUNCTION_ATTACH_BARCODE } from '../db/entities'
import { createClient } from '../supabase/server'

const attachBarcodeToItem = async (
  itemId: string,
  itemBarcode: string,
): Promise<void> => {
  const supabase = await createClient()
  const { error } = await supabase.rpc(DB_FUNCTION_ATTACH_BARCODE, {
    target_item_id: itemId,
    item_barcode: itemBarcode,
  })

  if (error) {
    throw new Error(
      `attach_barcode failed for item ${itemId} barcode ${itemBarcode}`,
      { cause: error },
    )
  }
}

export { attachBarcodeToItem }
