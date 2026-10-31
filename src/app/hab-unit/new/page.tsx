import HabUnitNameForm from './hab-unit-name-form'
import JoinHabUnitForm from './join-hab-unit-form'
import { contentWidth, pageShell, panel } from '@/app/styles/class-names'
import { Separator } from '@/components/ui/separator'
import { requireCurrentUser } from '@/lib/helpers'
import {
  buildDefaultHabUnitName,
  readRandomHabUnitSuffix,
} from '@/lib/hab-unit/build-default-hab-unit-name'
import { loadCurrentHabUnit } from '@/lib/hab-unit/load-current-hab-unit'
import { redirect } from 'next/navigation'

type SearchParamValue = string | string[] | undefined

const NewHabUnit = async ({
  searchParams,
}: {
  searchParams: Promise<{
    code?: SearchParamValue
  }>
}) => {
  await requireCurrentUser()
  const habUnit = await loadCurrentHabUnit()

  if (habUnit) {
    redirect('/inventory')
  }

  const params = await searchParams
  const inviteCode = typeof params.code === 'string' ? params.code : ''

  return (
    <main className={pageShell}>
      <div className={contentWidth}>
        <div className={panel}>
          <JoinHabUnitForm defaultCode={inviteCode} />
          <Separator className="my-4 h-0.5! shadow-[0_0_8px] shadow-primary/40" />
          <HabUnitNameForm
            defaultName={buildDefaultHabUnitName(readRandomHabUnitSuffix())}
          />
        </div>
      </div>
    </main>
  )
}

export default NewHabUnit
