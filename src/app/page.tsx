import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  contentWidth,
  footnote,
  formStack,
  fullWidthButton,
  pageLead,
  pageShell,
  pageTitle,
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
        <h1 className={pageTitle}>
          Know what is at home before you shop.
        </h1>
        <p className={pageLead}>
          Noospheric Tally records stock when you scan an item or change its
          count. It shows what needs restocking.
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
      </div>
    </main>
  )
}
