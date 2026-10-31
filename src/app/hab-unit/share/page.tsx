import Link from 'next/link'

import {
  contentWidth,
  footnote,
  pageShell,
  panel,
  textLink,
} from '@/app/styles/class-names'
import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'

import ShareHabUnitForm from './share-hab-unit-form'

const ShareHabUnitPage = async () => {
  await requireCurrentUser()
  await requireCurrentHabUnit()

  return (
    <main className={pageShell}>
      <div className={contentWidth}>
        <div className={panel}>
          <ShareHabUnitForm />
          <p className={footnote}>
            <Link href="/inventory" className={textLink}>
              Back to inventory
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default ShareHabUnitPage
