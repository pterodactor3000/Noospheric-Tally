import Link from 'next/link'

import {
  contentWidth,
  footnote,
  pageShell,
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
        <ShareHabUnitForm />
        <p className={footnote}>
          <Link href="/inventory" className={textLink}>
            Back to inventory
          </Link>
        </p>
      </div>
    </main>
  )
}

export default ShareHabUnitPage
