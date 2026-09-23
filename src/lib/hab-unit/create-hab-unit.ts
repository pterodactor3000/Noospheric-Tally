import { DB_FUNCTION_CREATE_HOUSEHOLD } from '../db/entities'
import { createClient } from '../supabase/server'

const createNewHabUnit = async (householdName: string): Promise<void> => {
  const supabase = await createClient()
  const { error } = await supabase.rpc(DB_FUNCTION_CREATE_HOUSEHOLD, {
    household_name: householdName,
  })

  if (error) {
    throw new Error(`create_household failed for name ${householdName}`, {
      cause: error,
    })
  }
}

export { createNewHabUnit }
