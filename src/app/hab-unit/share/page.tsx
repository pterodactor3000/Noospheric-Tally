import { TextLink } from '@/components/ui/text-link'

import {
  contentWidth,
  footnote,
  pageShell,
} from '@/app/styles/class-names'
import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'

import ShareHabUnitForm from './share-hab-unit-form'

const ShareHabUnitPage = async () => {
  await requireCurrentUser()
  await requireCurrentHabUnit()

  return (
    <main className={pageShell}>
      <div className={contentWidth}>
        <ShareHabUnitForm />
        <p className={footnote}>
          <TextLink href="/inventory">
            Back to inventory
          </TextLink>
        </p>
      </div>
    </main>
  )
}

export default ShareHabUnitPage
