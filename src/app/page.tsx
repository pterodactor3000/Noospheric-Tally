import Link from 'next/link'
import { redirect } from 'next/navigation'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'
import {
  contentWidth,
  footnote,
  formStack,
  fullWidthButton,
  pageLead,
  pageShell,
  pageTitle,
  panel,
  sectionCopy,
  sectionHeading,
  textLink,
} from '@/app/styles/class-names'
import loadCurrentUser from '@/lib/auth/loadCurrentUser'

export default async function Home() {
  const user = await loadCurrentUser()
  if (user) {
    redirect('/inventory')
  }

  return (
    <main className={pageShell}>
      <div className={contentWidth}>
        <div className={panel}>
          <h1 className={pageTitle}>
            Know what is at home before you shop.
          </h1>
          <p className={pageLead}>
            Noospheric Tally keeps everyday supplies visible at the moment stock
            changes. The deployment foundation is in place for the inventory
            experience to follow.
          </p>

          <div className={formStack}>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
              className={fullWidthButton}
            >
              Sign in
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/signup" />}
              className={fullWidthButton}
            >
              Sign up
            </Button>
          </div>

          <p className={footnote}>
            No personal cogitation unit?{' '}
            <Link href="/signup" className={textLink}>
              Requisite one
            </Link>
          </p>

          <div
            className={clsx(
              'mt-12',
              'grid',
              'gap-4',
              'border-t',
              'border-foreground/50',
              'pt-6',
              'sm:grid-cols-2',
            )}
          >
            <section>
              <h2 className={sectionHeading}>Inventory</h2>
              <p className={sectionCopy}>
                A signed-in member can scan an unknown barcode and save a
                household name.
              </p>
            </section>
            <section>
              <h2 className={sectionHeading}>Platform</h2>
              <p className={sectionCopy}>
                Secure web delivery for phone-ready barcode scanning.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
