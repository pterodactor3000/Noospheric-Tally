import Link from 'next/link'

import { Button } from './ui/button'

const HelpLink = () => {
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link href="/help" />}
      aria-label="Help"
      className="px-2!"
    >
      {'[ ? ]'}
    </Button>
  )
}

export { HelpLink }
