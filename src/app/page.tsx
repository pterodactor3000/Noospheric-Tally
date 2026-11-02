import Link from 'next/link'
import { redirect } from 'next/navigation'

import { TextLink } from '@/components/ui/text-link'

import { Button } from '@/components/ui/button'
import {
  contentWidth,
  footnote,
  formStack,
  pageLead,
  pageShell,
  pageTitle,
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
            size="touch"
          >
            Sign in
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/signup" />}
            size="touch"
          >
            Sign up
          </Button>
        </div>

        <p className={footnote}>
          No personal cogitation unit?{' '}
          <TextLink href="/signup">
            Requisite one
          </TextLink>
        </p>
      </div>
    </main>
  )
}
