import HabUnitNameForm from './hab-unit-name-form'
import { contentWidth, pageShell, panel } from '@/app/styles/class-names'
import { requireCurrentUser } from '@/lib/helpers'
import { loadCurrentHabUnit } from '@/lib/hab-unit/load-current-hab-unit'
import { redirect } from 'next/navigation'

const NewHabUnit = async () => {
  const user = await requireCurrentUser()
  const habUnit = await loadCurrentHabUnit()

  if (habUnit) {
    redirect('/inventory')
  }

  return (
    <main className={pageShell}>
      <div className={contentWidth}>
        <div className={panel}>
          <HabUnitNameForm defaultName={user.email?.split('@')[0] ?? ''} />
        </div>
      </div>
    </main>
  )
}

export default NewHabUnit
