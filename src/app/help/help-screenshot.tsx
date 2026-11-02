import Image from 'next/image'

import type { HelpScreenshotImage } from './help-topics'

interface HelpScreenshotProps {
  readonly image: HelpScreenshotImage
}

const HelpScreenshot = ({ image }: HelpScreenshotProps) => (
  <figure>
    <Image
      src={`/help/${image.fileName}`}
      width={image.width}
      height={image.height}
      alt={image.alt}
      unoptimized
      className="h-auto w-full max-w-sm border border-border"
    />
  </figure>
)

export { HelpScreenshot }
