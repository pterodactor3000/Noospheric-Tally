import { DB_TABLE_HOUSEHOLDS } from '../db/entities'
import { createClient } from '../supabase/server'

interface CurrentHabUnit {
  id: string
  name: string
}

const loadCurrentHabUnit = async (): Promise<CurrentHabUnit | null> => {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from(DB_TABLE_HOUSEHOLDS)
      .select('id, name')
      .maybeSingle()

    if (error) {
      throw new Error('Hab-unit check failed.', { cause: error })
    }

    if (data === null) {
      return null
    }

    return {
      id: data.id,
      name: data.name,
    }
  } catch (error: unknown) {
    console.error('Loading hab-unit failed.', { error })
    throw error
  }
}

export { loadCurrentHabUnit }
