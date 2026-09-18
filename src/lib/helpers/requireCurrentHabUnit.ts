import { redirect } from 'next/navigation'
import { loadCurrentHabUnit } from '../hab-unit/load-current-hab-unit'

const requireCurrentHabUnit = async () => {
  const habUnit = await loadCurrentHabUnit()
  if (!habUnit) {
    redirect('/hab-unit/new')
  }
  return habUnit
}

export { requireCurrentHabUnit }
